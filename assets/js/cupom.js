/* ===========================================================
   cupom.js - monta o texto que sai na impressora
   =========================================================== */
var Cupom = (function () {

  function largura() {
    return DB.config().largura || 32;
  }

  function linha(caractere) {
    return new Array(largura() + 1).join(caractere || '-') + '\n';
  }

  function centro(texto) {
    var L = largura();
    var t = String(texto).slice(0, L);
    var espacos = Math.max(0, Math.floor((L - t.length) / 2));
    return new Array(espacos + 1).join(' ') + t + '\n';
  }

  /* Texto à esquerda e valor à direita, preenchendo o meio com espaços */
  function esquerdaDireita(esq, dir) {
    var L = largura();
    esq = String(esq);
    dir = String(dir);
    var sobra = L - dir.length;
    if (esq.length > sobra - 1) esq = esq.slice(0, Math.max(0, sobra - 1));
    var meio = Math.max(1, L - esq.length - dir.length);
    return esq + new Array(meio + 1).join(' ') + dir + '\n';
  }

  function quebrar(texto, colunas) {
    var palavras = String(texto).split(' ');
    var linhas = [];
    var atual = '';
    palavras.forEach(function (p) {
      if ((atual + ' ' + p).trim().length > colunas) {
        if (atual) linhas.push(atual);
        atual = p.slice(0, colunas);
      } else {
        atual = (atual ? atual + ' ' : '') + p;
      }
    });
    if (atual) linhas.push(atual);
    return linhas.length ? linhas : [''];
  }

  function dataHora(iso) {
    var d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    });
  }

  /* ---------- Cupom do pedido ---------- */
  function doPedido(venda, viaTexto) {
    var cfg = DB.config();
    var L = largura();
    var t = '';

    t += centro(cfg.nome || 'FESTA');
    if (cfg.linha2) t += centro(cfg.linha2);
    t += '\n';
    t += esquerdaDireita('PEDIDO ' + venda.pedido, dataHora(venda.data));
    if (viaTexto) t += centro('*** ' + viaTexto + ' ***');
    t += linha('=');

    venda.itens.forEach(function (item) {
      var subtotal = item.preco * item.quantidade;
      var nomes = quebrar(item.nome, L);
      t += nomes[0] + '\n';
      for (var i = 1; i < nomes.length; i++) t += '  ' + nomes[i] + '\n';
      t += esquerdaDireita(
        '  ' + item.quantidade + ' x ' + Dinheiro.semSimbolo(item.preco),
        Dinheiro.semSimbolo(subtotal)
      );
    });

    t += linha('=');
    t += esquerdaDireita('TOTAL', 'R$ ' + Dinheiro.semSimbolo(venda.total));
    t += esquerdaDireita('Pagamento', venda.pagamento);
    if (venda.pagamento === 'Dinheiro' && venda.recebido) {
      t += esquerdaDireita('Recebido', Dinheiro.semSimbolo(venda.recebido));
      t += esquerdaDireita('Troco', Dinheiro.semSimbolo(venda.troco || 0));
    }
    t += linha('-');
    if (cfg.rodape) {
      quebrar(cfg.rodape, L).forEach(function (l) { t += centro(l); });
    }
    t += centro('Nao e documento fiscal');
    return t;
  }

  /* ---------- Cupom do fechamento de caixa ---------- */
  function doFechamento(resumo, dia) {
    var cfg = DB.config();
    var t = '';
    t += centro(cfg.nome || 'FESTA');
    t += centro('FECHAMENTO DE CAIXA');
    t += '\n';
    t += esquerdaDireita('Dia', dia || 'Todos');
    t += esquerdaDireita('Emitido', dataHora());
    t += linha('=');
    t += esquerdaDireita('Pedidos', String(resumo.quantidade));
    t += esquerdaDireita('Itens vendidos', String(resumo.itens));
    t += linha('-');

    Object.keys(resumo.porPagamento).forEach(function (forma) {
      t += esquerdaDireita(forma, Dinheiro.semSimbolo(resumo.porPagamento[forma]));
    });

    t += linha('=');
    t += esquerdaDireita('TOTAL GERAL', 'R$ ' + Dinheiro.semSimbolo(resumo.total));
    if (resumo.canceladas) {
      t += esquerdaDireita('Pedidos cancelados', String(resumo.canceladas));
    }
    t += linha('-');
    t += centro('MAIS VENDIDOS');
    resumo.ranking.slice(0, 10).forEach(function (r) {
      t += esquerdaDireita(r.nome, r.quantidade + 'x');
    });
    t += linha('-');
    t += centro('Conferido por: ______________');
    return t;
  }

  return {
    doPedido: doPedido,
    doFechamento: doFechamento,
    centro: centro,
    linha: linha,
    esquerdaDireita: esquerdaDireita
  };
})();
