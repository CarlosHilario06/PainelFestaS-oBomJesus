/* ===========================================================
   cupom.js - monta o que vai sair na impressora
   ------------------------------------------------------------
   Nada aqui é texto solto: cada documento é uma lista de
   BLOCOS, e quem imprime traduz cada bloco no comando certo
   (letra grande, negrito, corte do papel...).

   Tipos de bloco:
     {t:'centro',   v:'texto'}          centralizado
     {t:'grande',   v:'texto'}          centralizado, letra DOBRADA
     {t:'negrito',  v:'texto'}          centralizado e forte
     {t:'txt',      v:'texto'}          alinhado à esquerda
     {t:'ld',  e:'esquerda', d:'direita'}
     {t:'linha',    c:'='}              linha cheia
     {t:'tracejado'}                    linha de destacar (- - - -)
     {t:'branco',   n:2}                pula linhas
     {t:'corte'}                        fim da ficha: corta/destaca
   =========================================================== */
var Cupom = (function () {

  function largura() {
    return DB.config().largura || 32;
  }

  /* Na letra dobrada cabe metade dos caracteres */
  function larguraGrande() {
    return Math.floor(largura() / 2);
  }

  function quebrar(texto, colunas) {
    var palavras = String(texto).trim().split(/\s+/);
    var linhas = [];
    var atual = '';
    palavras.forEach(function (p) {
      while (p.length > colunas) {              // palavra maior que a linha
        if (atual) { linhas.push(atual); atual = ''; }
        linhas.push(p.slice(0, colunas));
        p = p.slice(colunas);
      }
      if ((atual + ' ' + p).trim().length > colunas) {
        if (atual) linhas.push(atual);
        atual = p;
      } else {
        atual = (atual ? atual + ' ' : '') + p;
      }
    });
    if (atual) linhas.push(atual);
    return linhas.length ? linhas : [''];
  }

  /* O nome do produto na ficha: tenta letra grande; se o nome for
     comprido demais, usa letra normal em negrito para não cortar. */
  function blocosNome(nome) {
    var linhas = quebrar(nome, larguraGrande());
    if (linhas.length <= 2) {
      return linhas.map(function (l) { return { t: 'grande', v: l }; });
    }
    return quebrar(nome, largura()).map(function (l) {
      return { t: 'negrito', v: l };
    });
  }

  function dataHora(iso) {
    var d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    });
  }

  function horaCurta(iso) {
    var d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- FICHAS: uma por unidade, para destacar ---------- */
  function doFichas(venda, marca) {
    var cfg = DB.config();
    var blocos = [];

    var totalFichas = venda.itens.reduce(function (s, i) { return s + i.quantidade; }, 0);
    var numero = 0;

    venda.itens.forEach(function (item) {
      for (var n = 0; n < item.quantidade; n++) {
        numero++;
        if (cfg.logo && cfg.logo.dados && cfg.logoNaFicha !== false) {
          blocos.push({ t: 'imagem', logo: cfg.logo });
        }
        blocos.push({ t: 'centro', v: cfg.nome || 'FESTA' });
        blocos.push({ t: 'linha', c: '=' });
        blocos.push({ t: 'branco', n: 1 });

        blocosNome(item.nome).forEach(function (b) { blocos.push(b); });

        blocos.push({ t: 'negrito', v: Dinheiro.formatar(item.preco) });
        blocos.push({ t: 'branco', n: 1 });
        blocos.push({ t: 'ld', e: 'Pedido ' + venda.pedido, d: numero + '/' + totalFichas });
        blocos.push({ t: 'ld', e: horaCurta(venda.data), d: venda.pagamento });

        if (marca) blocos.push({ t: 'centro', v: '** ' + marca + ' **' });

        blocos.push({ t: 'tracejado' });
        blocos.push({ t: 'corte' });
      }
    });

    return blocos;
  }

  /* ---------- CUPOM: o recibo com a compra toda ---------- */
  function doPedido(venda, marca) {
    var cfg = DB.config();
    var blocos = [];

    if (cfg.logo && cfg.logo.dados && cfg.logoNaFicha !== false) {
      blocos.push({ t: 'imagem', logo: cfg.logo });
    }
    blocos.push({ t: 'centro', v: cfg.nome || 'FESTA' });
    if (cfg.linha2) blocos.push({ t: 'centro', v: cfg.linha2 });
    blocos.push({ t: 'branco', n: 1 });
    blocos.push({ t: 'ld', e: 'PEDIDO ' + venda.pedido, d: dataHora(venda.data) });
    if (marca) blocos.push({ t: 'centro', v: '*** ' + marca + ' ***' });
    blocos.push({ t: 'linha', c: '=' });

    venda.itens.forEach(function (item) {
      quebrar(item.nome, largura()).forEach(function (l) {
        blocos.push({ t: 'txt', v: l });
      });
      blocos.push({
        t: 'ld',
        e: '  ' + item.quantidade + ' x ' + Dinheiro.semSimbolo(item.preco),
        d: Dinheiro.semSimbolo(item.preco * item.quantidade)
      });
    });

    blocos.push({ t: 'linha', c: '=' });
    blocos.push({ t: 'ld', e: 'TOTAL', d: 'R$ ' + Dinheiro.semSimbolo(venda.total) });
    blocos.push({ t: 'ld', e: 'Pagamento', d: venda.pagamento });
    if (venda.pagamento === 'Dinheiro' && venda.recebido) {
      blocos.push({ t: 'ld', e: 'Recebido', d: Dinheiro.semSimbolo(venda.recebido) });
      blocos.push({ t: 'ld', e: 'Troco', d: Dinheiro.semSimbolo(venda.troco || 0) });
    }
    blocos.push({ t: 'linha', c: '-' });
    if (cfg.rodape) {
      quebrar(cfg.rodape, largura()).forEach(function (l) {
        blocos.push({ t: 'centro', v: l });
      });
    }
    blocos.push({ t: 'centro', v: 'Nao e documento fiscal' });
    blocos.push({ t: 'corte' });
    return blocos;
  }

  /* ---------- FECHAMENTO DE CAIXA ---------- */
  function doFechamento(resumo, dia) {
    var cfg = DB.config();
    var blocos = [];

    blocos.push({ t: 'centro', v: cfg.nome || 'FESTA' });
    blocos.push({ t: 'negrito', v: 'FECHAMENTO DE CAIXA' });
    blocos.push({ t: 'branco', n: 1 });
    blocos.push({ t: 'ld', e: 'Dia', d: dia || 'Todos' });
    blocos.push({ t: 'ld', e: 'Emitido', d: dataHora() });
    blocos.push({ t: 'linha', c: '=' });
    blocos.push({ t: 'ld', e: 'Pedidos', d: String(resumo.quantidade) });
    blocos.push({ t: 'ld', e: 'Fichas entregues', d: String(resumo.itens) });
    blocos.push({ t: 'linha', c: '-' });

    Object.keys(resumo.porPagamento).forEach(function (forma) {
      blocos.push({ t: 'ld', e: forma, d: Dinheiro.semSimbolo(resumo.porPagamento[forma]) });
    });

    blocos.push({ t: 'linha', c: '=' });
    blocos.push({ t: 'grande', v: Dinheiro.formatar(resumo.total) });
    blocos.push({ t: 'centro', v: 'TOTAL GERAL' });
    if (resumo.canceladas) {
      blocos.push({ t: 'ld', e: 'Cancelados', d: String(resumo.canceladas) });
    }
    blocos.push({ t: 'linha', c: '-' });
    blocos.push({ t: 'centro', v: 'MAIS VENDIDOS' });
    resumo.ranking.slice(0, 10).forEach(function (r) {
      blocos.push({ t: 'ld', e: r.nome, d: r.quantidade + 'x' });
    });
    blocos.push({ t: 'linha', c: '-' });
    blocos.push({ t: 'centro', v: 'Conferido por:' });
    blocos.push({ t: 'branco', n: 1 });
    blocos.push({ t: 'centro', v: '____________________' });
    blocos.push({ t: 'corte' });
    return blocos;
  }

  /* ---------- TESTE ---------- */
  function doTeste() {
    var cfg = DB.config();
    return [
      cfg.logo && cfg.logo.dados
        ? { t: 'imagem', logo: cfg.logo }
        : { t: 'branco', n: 0 },
      { t: 'centro', v: cfg.nome || 'FESTA' },
      { t: 'linha', c: '=' },
      { t: 'centro', v: 'TESTE DE IMPRESSAO' },
      { t: 'branco', n: 1 },
      { t: 'centro', v: 'Assim sai uma ficha:' },
      { t: 'branco', n: 1 },
      { t: 'grande', v: 'PASTEL' },
      { t: 'negrito', v: 'R$ 7,00' },
      { t: 'branco', n: 1 },
      { t: 'ld', e: 'Pedido 12', d: '1/3' },
      { t: 'tracejado' },
      { t: 'branco', n: 1 },
      { t: 'ld', e: 'Acentuacao', d: 'ç ã é í ô ú' },
      { t: 'centro', v: 'Se leu tudo, esta pronto!' },
      { t: 'corte' }
    ];
  }

  /* ---------- Converter blocos em texto puro ----------
     Usado na pré-visualização e nos testes. A letra grande
     aparece em MAIÚSCULAS, já que texto puro não tem tamanho. */
  function paraTexto(blocos) {
    var L = largura();
    var saida = '';

    function centralizar(txt, colunas) {
      var t = String(txt).slice(0, colunas);
      var espacos = Math.max(0, Math.floor((colunas - t.length) / 2));
      return new Array(espacos + 1).join(' ') + t;
    }

    blocos.forEach(function (b) {
      switch (b.t) {
        case 'centro':
          saida += centralizar(b.v, L) + '\n'; break;
        case 'negrito':
          saida += centralizar(b.v, L) + '\n'; break;
        case 'grande':
          /* ocupa o dobro: centraliza como se a linha tivesse metade */
          saida += centralizar(String(b.v).toUpperCase(), Math.floor(L / 2)) + '\n'; break;
        case 'txt':
          saida += String(b.v).slice(0, L) + '\n'; break;
        case 'ld':
          var e = String(b.e), d = String(b.d);
          var sobra = L - d.length;
          if (e.length > sobra - 1) e = e.slice(0, Math.max(0, sobra - 1));
          saida += e + new Array(Math.max(1, L - e.length - d.length) + 1).join(' ') + d + '\n';
          break;
        case 'linha':
          saida += new Array(L + 1).join(b.c || '-') + '\n'; break;
        case 'tracejado':
          saida += new Array(Math.floor(L / 2) + 1).join('- ').slice(0, L) + '\n'; break;
        case 'branco':
          saida += new Array((b.n || 1) + 1).join('\n'); break;
        case 'imagem':
          saida += '[imagem]\n'; break;
        case 'corte':
          saida += '\n'; break;
      }
    });
    return saida;
  }

  /* ---------- Converter blocos em HTML ----------
     Usado quando a impressão sai pelo navegador (plano B) e na
     pré-visualização da tela. Cada ficha vira um bloco separado,
     com linha pontilhada para recortar. */
  function paraHtml(blocos) {
    function escapar(t) {
      return String(t)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    var L = largura();
    var partes = [];
    var atual = [];

    function fechar() {
      if (atual.length) partes.push('<div class="via">' + atual.join('') + '</div>');
      atual = [];
    }

    blocos.forEach(function (b) {
      switch (b.t) {
        case 'centro':
          atual.push('<div class="c">' + escapar(b.v) + '</div>'); break;
        case 'negrito':
          atual.push('<div class="c n">' + escapar(b.v) + '</div>'); break;
        case 'grande':
          atual.push('<div class="c g">' + escapar(b.v) + '</div>'); break;
        case 'txt':
          atual.push('<div>' + escapar(b.v) + '</div>'); break;
        case 'ld':
          atual.push('<div class="ld"><span>' + escapar(b.e) +
            '</span><span>' + escapar(b.d) + '</span></div>'); break;
        case 'linha':
          atual.push('<div class="r">' + escapar(new Array(L + 1).join(b.c || '-')) + '</div>');
          break;
        case 'tracejado':
          atual.push('<div class="r">' +
            escapar(new Array(Math.floor(L / 2) + 1).join('- ').slice(0, L)) + '</div>');
          break;
        case 'branco':
          for (var i = 0; i < (b.n || 1); i++) atual.push('<div>&nbsp;</div>');
          break;
        case 'imagem':
          if (b.logo && b.logo.dados) {
            atual.push('<div class="c"><img class="logo" alt="" src="' +
              Logo.paraDataUrl(b.logo) + '"></div>');
          }
          break;
        case 'corte':
          fechar(); break;
      }
    });
    fechar();
    return partes.join('');
  }

  return {
    doFichas: doFichas,
    doPedido: doPedido,
    doFechamento: doFechamento,
    doTeste: doTeste,
    paraTexto: paraTexto,
    paraHtml: paraHtml,
    quebrar: quebrar,
    largura: largura
  };
})();
