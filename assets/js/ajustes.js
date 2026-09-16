/* ===========================================================
   ajustes.js - configurações, impressora e backup
   =========================================================== */
var TelaAjustes = (function () {

  var campos = {};

  function iniciar() {
    campos = {
      nome: document.getElementById('cfgNome'),
      linha2: document.getElementById('cfgLinha2'),
      rodape: document.getElementById('cfgRodape'),
      largura: document.getElementById('cfgLargura'),
      codepage: document.getElementById('cfgCodepage'),
      aoFinalizar: document.getElementById('cfgAoFinalizar'),
      cortar: document.getElementById('cfgCortar'),
      fallback: document.getElementById('cfgFallback'),
      logoNaFicha: document.getElementById('cfgLogoNaFicha')
    };

    carregar();

    Object.keys(campos).forEach(function (chave) {
      campos[chave].addEventListener('change', salvar);
      if (campos[chave].tagName === 'INPUT' && campos[chave].type === 'text') {
        campos[chave].addEventListener('input', salvar);
      }
    });

    document.getElementById('btnConectar').addEventListener('click', App.conectarImpressora);
    document.getElementById('btnDesconectar').addEventListener('click', function () {
      Impressora.desconectar();
      App.avisar('Impressora desconectada.');
    });
    document.getElementById('btnTeste').addEventListener('click', imprimirTeste);
    document.getElementById('btnPrevia').addEventListener('click', verPrevia);
    document.getElementById('fecharPrevia').addEventListener('click', fecharPrevia);
    document.getElementById('previa').addEventListener('click', function (ev) {
      if (ev.target.id === 'previa') fecharPrevia();
    });

    /* --- imagem da ficha --- */
    document.getElementById('btnEscolherLogo').addEventListener('click', function () {
      document.getElementById('arquivoLogo').click();
    });
    document.getElementById('arquivoLogo').addEventListener('change', receberLogo);
    document.getElementById('btnRemoverLogo').addEventListener('click', removerLogo);
    document.getElementById('cfgLogoLargura').addEventListener('input', function () {
      document.getElementById('logoLarguraValor').textContent = this.value;
    });
    document.getElementById('cfgLogoLimite').addEventListener('input', function () {
      document.getElementById('logoLimiteValor').textContent = this.value;
    });
    document.getElementById('cfgLogoLargura').addEventListener('change', reconverterLogo);
    document.getElementById('cfgLogoLimite').addEventListener('change', reconverterLogo);
    desenharLogo();

    document.getElementById('btnBackup').addEventListener('click', baixarBackup);
    document.getElementById('btnRestaurar').addEventListener('click', function () {
      document.getElementById('arquivoBackup').click();
    });
    document.getElementById('arquivoBackup').addEventListener('change', restaurarBackup);
    document.getElementById('btnZerarVendas').addEventListener('click', zerarVendas);
  }

  function carregar() {
    var c = DB.config();
    campos.nome.value = c.nome || '';
    campos.linha2.value = c.linha2 || '';
    campos.rodape.value = c.rodape || '';
    campos.largura.value = String(c.largura || 32);
    campos.codepage.value = c.codepage || 'cp860';
    campos.aoFinalizar.value = c.imprimirAoFinalizar || 'fichas';
    campos.cortar.checked = !!c.cortar;
    campos.fallback.checked = c.fallbackNavegador !== false;
    campos.logoNaFicha.checked = c.logoNaFicha !== false;
  }

  function salvar() {
    DB.salvarConfig({
      nome: campos.nome.value.trim(),
      linha2: campos.linha2.value.trim(),
      rodape: campos.rodape.value.trim(),
      largura: parseInt(campos.largura.value, 10) || 32,
      codepage: campos.codepage.value,
      imprimirAoFinalizar: campos.aoFinalizar.value,
      cortar: campos.cortar.checked,
      fallbackNavegador: campos.fallback.checked,
      logoNaFicha: campos.logoNaFicha.checked
    });
    App.atualizarCabecalho();
  }

  function imprimirTeste() {
    App.enviarParaImpressora(Cupom.doTeste(), 'Teste');
  }

  /* Mostra na tela como o papel vai sair, com um pedido de exemplo */
  function verPrevia() {
    var exemplo = {
      pedido: 12,
      data: new Date().toISOString(),
      pagamento: 'Dinheiro',
      recebido: 3000,
      troco: 700,
      total: 2300,
      itens: [
        { nome: 'Cachorro-quente', preco: 800, quantidade: 2 },
        { nome: 'Refrigerante lata', preco: 500, quantidade: 1 },
        { nome: 'Pastel', preco: 700, quantidade: 1 }
      ]
    };
    document.getElementById('previaConteudo').innerHTML =
      Cupom.paraHtml(App.blocosDoPedido(exemplo, null));
    document.getElementById('previa').classList.remove('escondido');
  }

  function fecharPrevia() {
    document.getElementById('previa').classList.add('escondido');
  }

  /* ---------- Imagem da ficha ---------- */
  var arquivoOriginal = null;   // guardado para reconverter ao mexer nos controles

  function opcoesLogo() {
    return {
      largura: parseInt(document.getElementById('cfgLogoLargura').value, 10),
      limite: parseInt(document.getElementById('cfgLogoLimite').value, 10)
    };
  }

  function receberLogo(ev) {
    var arquivo = ev.target.files && ev.target.files[0];
    if (!arquivo) return;
    arquivoOriginal = arquivo;
    converterLogo(arquivo);
    ev.target.value = '';
  }

  function converterLogo(arquivo) {
    Logo.doArquivo(arquivo, opcoesLogo()).then(function (logo) {
      if (Logo.tamanhoKb(logo) > 400) {
        App.avisar('Imagem muito pesada. Diminua o tamanho na ficha.', 'erro');
        return;
      }
      DB.salvarConfig({ logo: logo });
      desenharLogo();
      App.avisar('Imagem salva! Veja em "Ver como fica".', 'ok');
    }).catch(function (e) {
      App.avisar(e.message || 'Não consegui usar essa imagem.', 'erro');
    });
  }

  /* Mexer no tamanho ou no contraste reconverte a partir do arquivo original,
     para a imagem não ir perdendo qualidade a cada ajuste. */
  function reconverterLogo() {
    if (arquivoOriginal) { converterLogo(arquivoOriginal); return; }
    if (DB.config().logo) App.avisar('Escolha a imagem de novo para aplicar o novo tamanho.');
  }

  function removerLogo() {
    if (!DB.config().logo) return;
    DB.salvarConfig({ logo: null });
    arquivoOriginal = null;
    desenharLogo();
    App.avisar('Imagem removida.');
  }

  function desenharLogo() {
    var alvo = document.getElementById('logoPreview');
    var logo = DB.config().logo;
    if (!logo || !logo.dados) {
      alvo.className = 'logo-preview vazio';
      alvo.textContent = 'Nenhuma imagem';
      return;
    }
    alvo.className = 'logo-preview';
    alvo.innerHTML = '';
    var img = document.createElement('img');
    img.alt = '';
    img.src = Logo.paraDataUrl(logo);
    var info = document.createElement('span');
    info.className = 'logo-info';
    info.textContent = logo.largura + ' x ' + logo.altura +
      ' pontos · ' + Logo.tamanhoKb(logo) + ' KB';
    alvo.appendChild(img);
    alvo.appendChild(info);
  }

  function baixarBackup() {
    var hoje = new Date().toISOString().slice(0, 10);
    App.baixarArquivo(DB.exportar(), 'backup-festa-' + hoje + '.json', 'application/json');
    App.avisar('Backup baixado.', 'ok');
  }

  function restaurarBackup(ev) {
    var arquivo = ev.target.files && ev.target.files[0];
    if (!arquivo) return;
    if (!confirm('Restaurar o backup vai SUBSTITUIR os produtos e vendas atuais. Continuar?')) {
      ev.target.value = '';
      return;
    }
    var leitor = new FileReader();
    leitor.onload = function () {
      try {
        DB.importar(leitor.result);
        carregar();
        desenharLogo();
        App.atualizarCabecalho();
        TelaProdutos.desenhar();
        TelaCaixa.desenhar();
        TelaVendas.desenhar();
        App.avisar('Backup restaurado!', 'ok');
      } catch (e) {
        App.avisar('Não consegui ler esse arquivo de backup.', 'erro');
      }
      ev.target.value = '';
    };
    leitor.readAsText(arquivo);
  }

  function zerarVendas() {
    if (!confirm('Apagar TODAS as vendas registradas?\n\nOs produtos continuam cadastrados e a numeração dos pedidos volta para #1.')) return;
    if (!confirm('Tem certeza mesmo? Isso não tem volta.\n\nDica: baixe o backup antes.')) return;
    DB.apagarVendas();
    TelaVendas.desenhar();
    TelaCaixa.desenhar();
    App.avisar('Vendas apagadas.');
  }

  return { iniciar: iniciar, carregar: carregar };
})();
