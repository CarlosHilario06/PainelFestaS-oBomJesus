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
      vias: document.getElementById('cfgVias'),
      cortar: document.getElementById('cfgCortar'),
      fallback: document.getElementById('cfgFallback')
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
    campos.vias.value = String(c.vias || 1);
    campos.cortar.checked = !!c.cortar;
    campos.fallback.checked = c.fallbackNavegador !== false;
  }

  function salvar() {
    DB.salvarConfig({
      nome: campos.nome.value.trim(),
      linha2: campos.linha2.value.trim(),
      rodape: campos.rodape.value.trim(),
      largura: parseInt(campos.largura.value, 10) || 32,
      codepage: campos.codepage.value,
      vias: parseInt(campos.vias.value, 10) || 1,
      cortar: campos.cortar.checked,
      fallbackNavegador: campos.fallback.checked
    });
    App.atualizarCabecalho();
  }

  function imprimirTeste() {
    var t = '';
    t += Cupom.centro(DB.config().nome || 'FESTA');
    t += Cupom.centro('TESTE DE IMPRESSAO');
    t += Cupom.linha('=');
    t += Cupom.esquerdaDireita('Acentuacao', 'ç ã é í ô ú');
    t += Cupom.esquerdaDireita('Exemplo', '1 x 8,00');
    t += Cupom.linha('-');
    t += Cupom.esquerdaDireita('TOTAL', 'R$ 8,00');
    t += Cupom.centro('Se leu isso, esta pronto!');
    App.enviarParaImpressora(t, 1, 'Teste');
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
