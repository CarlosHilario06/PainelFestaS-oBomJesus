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
    document.getElementById('cfgLogoLargura').addEventListener('input', mostrarTamanho);
    document.getElementById('cfgLogoLimite').addEventListener('input', function () {
      document.getElementById('logoLimiteValor').textContent = this.value;
    });
    document.getElementById('cfgLogoLargura').value = porcentagemSalva();
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
  /* O controle é em porcentagem da largura da ficha, que é o que a
     pessoa consegue enxergar. A conversão para pontinhos da impressora
     fica aqui, arredondada para múltiplo de 8 (um byte = 8 pontinhos). */
  /* Qual porcentagem mostrar ao abrir a tela. Quem já tinha uma imagem
     salva antes deste controle existir não tem logoPct guardado, então
     descobrimos pela largura da imagem — senão o controle mostraria um
     número que não bate com o que está no papel. */
  function porcentagemSalva() {
    var c = DB.config();
    if (c.logoPct) return c.logoPct;
    if (c.logo && c.logo.largura) {
      var total = Logo.pontosPorLinha(c.largura || 32);
      return Math.min(100, Math.max(10, Math.round(c.logo.largura / total * 20) * 5));
    }
    return 35;
  }

  function porcentagemEscolhida() {
    return parseInt(document.getElementById('cfgLogoLargura').value, 10) || 35;
  }

  function opcoesLogo() {
    var total = Logo.pontosPorLinha(DB.config().largura || 32);
    var pontos = Math.max(8, Math.round(total * porcentagemEscolhida() / 100 / 8) * 8);
    return {
      largura: pontos,
      limite: parseInt(document.getElementById('cfgLogoLimite').value, 10)
    };
  }

  function mostrarTamanho() {
    var alvo = document.getElementById('logoLarguraValor');
    var pct = porcentagemEscolhida();
    var logo = DB.config().logo;
    var texto = pct + '% da largura';
    if (logo) {
      texto += ' · ' + Logo.milimetros(logo.largura) + ' x ' +
        Logo.milimetros(logo.altura) + ' mm no papel';
    }
    alvo.textContent = texto;
  }

  function receberLogo(ev) {
    var arquivo = ev.target.files && ev.target.files[0];
    if (!arquivo) return;
    ev.target.value = '';
    Logo.doArquivo(arquivo).then(function (original) {
      DB.salvarConfig({ logoOriginal: original });
      converterLogo();
    }).catch(function (e) {
      App.avisar(e.message || 'Não consegui usar essa imagem.', 'erro');
    });
  }

  /* Reconverte sempre a partir do original guardado, então mexer no
     tamanho funciona mesmo depois de fechar e abrir o sistema. */
  function converterLogo() {
    var original = DB.config().logoOriginal;
    if (!original) return;
    Logo.converter(original, opcoesLogo()).then(function (logo) {
      if (Logo.tamanhoKb(logo) > 400) {
        App.avisar('Imagem muito pesada. Diminua o tamanho na ficha.', 'erro');
        return;
      }
      DB.salvarConfig({ logo: logo, logoPct: porcentagemEscolhida() });
      desenharLogo();
      App.avisar('Imagem salva! Veja em "Ver como fica".', 'ok');
    }).catch(function (e) {
      App.avisar(e.message || 'Não consegui usar essa imagem.', 'erro');
    });
  }

  function reconverterLogo() {
    if (DB.config().logoOriginal) { converterLogo(); return; }
    if (DB.config().logo) {
      App.avisar('Escolha a imagem de novo para poder mudar o tamanho.', 'erro');
    }
  }

  function removerLogo() {
    if (!DB.config().logo) return;
    DB.salvarConfig({ logo: null, logoOriginal: null });
    desenharLogo();
    App.avisar('Imagem removida.');
  }

  function desenharLogo() {
    var alvo = document.getElementById('logoPreview');
    var logo = DB.config().logo;
    if (!logo || !logo.dados) {
      alvo.className = 'logo-preview vazio';
      alvo.textContent = 'Nenhuma imagem';
      mostrarTamanho();
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
    mostrarTamanho();
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
