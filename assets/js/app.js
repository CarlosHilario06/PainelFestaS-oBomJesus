/* ===========================================================
   app.js - liga tudo: navegação, avisos e impressão
   =========================================================== */
var App = (function () {

  var elAviso, elChip, elStatus, tempoAviso;

  function iniciar() {
    elAviso = document.getElementById('aviso');
    elChip = document.getElementById('btnImpressora');
    elStatus = document.getElementById('statusImpressora');

    /* Abas */
    Array.prototype.forEach.call(document.querySelectorAll('.aba'), function (aba) {
      aba.addEventListener('click', function () { abrirAba(aba.dataset.aba); });
    });

    elChip.addEventListener('click', function () {
      if (Impressora.conectada()) {
        abrirAba('ajustes');
      } else {
        conectarImpressora();
      }
    });

    Impressora.aoMudar(atualizarStatusImpressora);

    /* Primeira vez: já deixa produtos de exemplo prontos */
    if (DB.semearExemplos()) {
      setTimeout(function () {
        avisar('Coloquei produtos de exemplo. Ajuste na aba "Produtos".');
      }, 700);
    }

    TelaProdutos.iniciar();
    TelaCaixa.iniciar();
    TelaVendas.iniciar();
    TelaAjustes.iniciar();

    atualizarCabecalho();
    atualizarStatusImpressora();
    registrarServiceWorker();
  }

  function abrirAba(nome) {
    Array.prototype.forEach.call(document.querySelectorAll('.aba'), function (a) {
      a.classList.toggle('ativa', a.dataset.aba === nome);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tela'), function (t) {
      t.classList.toggle('ativa', t.id === 'tela-' + nome);
    });
    if (nome === 'vendas') TelaVendas.desenhar();
    if (nome === 'produtos') TelaProdutos.desenhar();
    window.scrollTo({ top: 0 });
  }

  function atualizarCabecalho() {
    var c = DB.config();
    document.getElementById('tituloFesta').textContent = c.nome || 'Caixa da Festa';
    document.getElementById('subtituloFesta').textContent = c.linha2 || 'Caixa';
  }

  function atualizarStatusImpressora() {
    var ligada = Impressora.conectada();
    elChip.classList.toggle('chip-on', ligada);
    elChip.classList.toggle('chip-off', !ligada);
    elStatus.textContent = ligada
      ? (Impressora.nomeDispositivo() || 'Impressora conectada')
      : 'Conectar impressora';
  }

  function conectarImpressora() {
    if (!Impressora.suportado()) {
      avisar('Este navegador não tem Bluetooth. Use o Google Chrome.', 'erro');
      return;
    }
    avisar('Procurando impressora...');
    Impressora.conectar().then(function (nome) {
      avisar('Conectado em ' + nome + '!', 'ok');
    }).catch(function (e) {
      if (e && e.name === 'NotFoundError') {
        avisar('Nenhuma impressora escolhida.');
      } else {
        avisar(e.message || 'Não consegui conectar.', 'erro');
      }
      atualizarStatusImpressora();
    });
  }

  /* Imprime o cupom de um pedido, respeitando o número de vias configurado */
  function imprimirPedido(venda, marca) {
    var cfg = DB.config();
    var vias = marca ? 1 : (cfg.vias || 1);
    var texto = Cupom.doPedido(venda, marca || null);
    enviarParaImpressora(texto, vias, 'Pedido #' + venda.pedido);
  }

  /* Tenta o Bluetooth; se não der, cai para a impressão do navegador */
  function enviarParaImpressora(texto, vias, rotulo) {
    if (Impressora.conectada()) {
      Impressora.imprimir(texto, vias).then(function () {
        avisar((rotulo || 'Cupom') + ' impresso.', 'ok');
      }).catch(function (e) {
        console.error(e);
        avisar('Falha ao imprimir: ' + (e.message || 'erro'), 'erro');
        planoB(texto);
      });
    } else {
      avisar('Impressora não conectada.', 'erro');
      planoB(texto);
    }
  }

  function planoB(texto) {
    if (DB.config().fallbackNavegador === false) return;
    setTimeout(function () {
      Impressora.imprimirPeloNavegador(texto);
    }, 400);
  }

  /* ---------- Utilidades ---------- */
  function avisar(mensagem, tipo) {
    elAviso.textContent = mensagem;
    elAviso.className = 'aviso mostrar' + (tipo ? ' ' + tipo : '');
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(function () {
      elAviso.className = 'aviso';
    }, 3200);
  }

  function baixarArquivo(conteudo, nome, tipo) {
    var blob = new Blob([conteudo], { type: tipo });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    navigator.serviceWorker.register('sw.js').catch(function () { /* sem problema */ });
  }

  return {
    iniciar: iniciar,
    abrirAba: abrirAba,
    avisar: avisar,
    baixarArquivo: baixarArquivo,
    conectarImpressora: conectarImpressora,
    imprimirPedido: imprimirPedido,
    enviarParaImpressora: enviarParaImpressora,
    atualizarCabecalho: atualizarCabecalho
  };
})();

document.addEventListener('DOMContentLoaded', App.iniciar);
