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

    document.getElementById('btnTema').addEventListener('click', alternarTema);
    mostrarTema();

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

  /* ---------- Tema claro / escuro ---------- */
  var CHAVE_TEMA = 'festa-sbj:tema';

  function temaEscuro() {
    return document.documentElement.getAttribute('data-tema') === 'escuro';
  }

  function aplicarTema(escuro) {
    if (escuro) document.documentElement.setAttribute('data-tema', 'escuro');
    else document.documentElement.removeAttribute('data-tema');
    try { localStorage.setItem(CHAVE_TEMA, escuro ? 'escuro' : 'claro'); } catch (e) {}
    mostrarTema();
  }

  /* Troca o tema com o novo visual se espalhando em círculo a partir do
     botão. Se o navegador não tiver View Transitions (ou a pessoa pedir
     menos animação no sistema), troca na hora — o resultado é o mesmo. */
  function alternarTema(ev) {
    var escuro = !temaEscuro();
    var animar = document.startViewTransition &&
      !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (!animar) { aplicarTema(escuro); return; }

    /* centro do círculo: onde a pessoa clicou */
    var alvo = (ev && ev.currentTarget) || document.getElementById('btnTema');
    var caixa = alvo.getBoundingClientRect();
    var x = (ev && ev.clientX) || (caixa.left + caixa.width / 2);
    var y = (ev && ev.clientY) || (caixa.top + caixa.height / 2);

    /* raio até o canto mais distante, senão sobra um pedaço sem pintar */
    var raio = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    var transicao = document.startViewTransition(function () { aplicarTema(escuro); });
    transicao.ready.then(function () {
      document.documentElement.animate(
        {
          clipPath: [
            'circle(0px at ' + x + 'px ' + y + 'px)',
            'circle(' + raio + 'px at ' + x + 'px ' + y + 'px)'
          ]
        },
        {
          duration: 520,
          easing: 'cubic-bezier(.4,0,.2,1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    }).catch(function () { /* animação é enfeite: se falhar, o tema já trocou */ });
  }

  function mostrarTema() {
    var escuro = temaEscuro();
    var botao = document.getElementById('btnTema');
    botao.textContent = escuro ? 'Modo claro' : 'Modo escuro';
    botao.title = escuro ? 'Voltar para o tema claro' : 'Trocar para o tema escuro';
    var cor = document.querySelector('meta[name="theme-color"]');
    /* acompanha a barra de cima, que é escura nos dois temas */
    if (cor) cor.setAttribute('content', escuro ? '#0b1526' : '#0e1c33');
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
    if (window.TelaCaixa && TelaCaixa.desenhar) TelaCaixa.desenhar();
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

  /* Monta o que sai ao finalizar o pedido: fichas para destacar,
     o cupom do cliente, ou os dois — conforme os Ajustes. */
  function blocosDoPedido(venda, marca) {
    var modo = DB.config().imprimirAoFinalizar || 'fichas';
    var blocos = [];
    if (modo !== 'fichas') blocos = blocos.concat(Cupom.doPedido(venda, marca || null));
    if (modo !== 'cupom') blocos = blocos.concat(Cupom.doFichas(venda, marca || null));
    return blocos;
  }

  function imprimirPedido(venda, marca) {
    enviarParaImpressora(blocosDoPedido(venda, marca), 'Pedido #' + venda.pedido);
  }

  /* Tenta o Bluetooth; se não der, cai para a impressão do navegador */
  function enviarParaImpressora(blocos, rotulo) {
    if (Impressora.conectada()) {
      Impressora.imprimir(blocos, 1).then(function () {
        avisar((rotulo || 'Cupom') + ' impresso.', 'ok');
      }).catch(function (e) {
        console.error(e);
        avisar('Falha ao imprimir: ' + (e.message || 'erro'), 'erro');
        planoB(blocos);
      });
    } else if (DB.config().fallbackNavegador !== false) {
      avisar('Impressora não conectada. Abrindo a impressão do navegador.');
      planoB(blocos);
    } else {
      avisar('Impressora não conectada — a venda foi salva mesmo assim.', 'erro');
    }
  }

  function planoB(blocos) {
    if (DB.config().fallbackNavegador === false) return;
    setTimeout(function () {
      Impressora.imprimirPeloNavegador(blocos);
    }, 400);
  }

  /* ---------- Confirmação dentro do app ----------
     Devolve uma promessa: resolve true se a pessoa confirmar.
     Enter confirma, Esc cancela, clicar fora cancela. */
  function confirmar(opcoes) {
    opcoes = opcoes || {};
    var caixa = document.getElementById('dialogo');
    var btnOk = document.getElementById('dialogoConfirmar');
    var btnNao = document.getElementById('dialogoCancelar');

    document.getElementById('dialogoTitulo').textContent = opcoes.titulo || 'Confirmar';
    document.getElementById('dialogoTexto').textContent = opcoes.texto || '';
    btnOk.textContent = opcoes.botao || 'Confirmar';
    btnOk.className = opcoes.perigo === false ? 'btn-principal' : 'btn-perigo';

    var focoAnterior = document.activeElement;
    caixa.classList.remove('escondido');
    btnOk.focus();

    return new Promise(function (resolve) {
      function fechar(resposta) {
        caixa.classList.add('escondido');
        btnOk.removeEventListener('click', aoSim);
        btnNao.removeEventListener('click', aoNao);
        caixa.removeEventListener('click', aoFundo);
        document.removeEventListener('keydown', aoTeclado, true);
        if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
        resolve(resposta);
      }
      function aoSim() { fechar(true); }
      function aoNao() { fechar(false); }
      function aoFundo(ev) { if (ev.target === caixa) fechar(false); }
      function aoTeclado(ev) {
        if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); fechar(false); }
        else if (ev.key === 'Enter') { ev.preventDefault(); ev.stopPropagation(); fechar(true); }
      }
      btnOk.addEventListener('click', aoSim);
      btnNao.addEventListener('click', aoNao);
      caixa.addEventListener('click', aoFundo);
      document.addEventListener('keydown', aoTeclado, true);
    });
  }

  /* ---------- Utilidades ---------- */
  /* O aviso aceita uma ação ("Desfazer"), e nesse caso fica mais tempo
     na tela para dar tempo de clicar. */
  function avisar(mensagem, tipo, acao) {
    elAviso.innerHTML = '';
    var texto = document.createElement('span');
    texto.textContent = mensagem;
    elAviso.appendChild(texto);

    if (acao && acao.fn) {
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'aviso-acao';
      botao.textContent = acao.texto || 'Desfazer';
      botao.addEventListener('click', function () {
        elAviso.className = 'aviso';
        clearTimeout(tempoAviso);
        acao.fn();
      });
      elAviso.appendChild(botao);
    }

    elAviso.className = 'aviso mostrar' + (tipo ? ' ' + tipo : '');
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(function () {
      elAviso.className = 'aviso';
    }, acao ? 7000 : 3200);
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
    confirmar: confirmar,
    baixarArquivo: baixarArquivo,
    conectarImpressora: conectarImpressora,
    imprimirPedido: imprimirPedido,
    blocosDoPedido: blocosDoPedido,
    enviarParaImpressora: enviarParaImpressora,
    atualizarCabecalho: atualizarCabecalho
  };
})();

document.addEventListener('DOMContentLoaded', App.iniciar);
