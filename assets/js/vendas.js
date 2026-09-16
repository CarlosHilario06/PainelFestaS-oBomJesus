/* ===========================================================
   vendas.js - relatório, fechamento de caixa e exportação
   =========================================================== */
var TelaVendas = (function () {

  var elFiltro, elCartoes, elRanking, elLista;
  var diaEscolhido = '';

  function iniciar() {
    elFiltro = document.getElementById('filtroDia');
    elCartoes = document.getElementById('cartoesResumo');
    elRanking = document.getElementById('ranking');
    elLista = document.getElementById('listaVendas');

    elFiltro.addEventListener('change', function () {
      diaEscolhido = elFiltro.value;
      desenhar();
    });

    document.getElementById('btnImprimirFechamento').addEventListener('click', function () {
      var dia = diaEscolhido || '';
      var blocos = Cupom.doFechamento(calcularResumo(dia), dia || 'Todos os dias');
      App.enviarParaImpressora(blocos, 'Fechamento');
    });

    document.getElementById('btnExportarCsv').addEventListener('click', exportarCsv);

    desenhar();
  }

  function vendasFiltradas(dia) {
    return DB.listarVendas(dia || undefined);
  }

  function calcularResumo(dia) {
    var vendas = vendasFiltradas(dia);
    var resumo = {
      total: 0, quantidade: 0, itens: 0, canceladas: 0,
      porPagamento: {}, ranking: []
    };
    var contagem = {};

    vendas.forEach(function (v) {
      if (v.cancelada) { resumo.canceladas += 1; return; }
      resumo.total += v.total;
      resumo.quantidade += 1;
      resumo.porPagamento[v.pagamento] = (resumo.porPagamento[v.pagamento] || 0) + v.total;
      v.itens.forEach(function (i) {
        resumo.itens += i.quantidade;
        if (!contagem[i.nome]) contagem[i.nome] = { nome: i.nome, quantidade: 0, valor: 0 };
        contagem[i.nome].quantidade += i.quantidade;
        contagem[i.nome].valor += i.preco * i.quantidade;
      });
    });

    resumo.ranking = Object.keys(contagem).map(function (k) { return contagem[k]; })
      .sort(function (a, b) { return b.quantidade - a.quantidade; });

    return resumo;
  }

  function desenharFiltro() {
    var dias = DB.diasComVenda();
    var anterior = diaEscolhido;
    elFiltro.innerHTML = '';

    var todos = document.createElement('option');
    todos.value = '';
    todos.textContent = 'Todos os dias';
    elFiltro.appendChild(todos);

    dias.forEach(function (d) {
      var op = document.createElement('option');
      op.value = d;
      op.textContent = d;
      elFiltro.appendChild(op);
    });

    if (dias.indexOf(anterior) > -1) {
      elFiltro.value = anterior;
    } else {
      diaEscolhido = '';
      elFiltro.value = '';
    }
  }

  function cartao(rotulo, valor, destaque) {
    var d = document.createElement('div');
    d.className = 'cartao' + (destaque ? ' destaque' : '');
    var r = document.createElement('div');
    r.className = 'rotulo';
    r.textContent = rotulo;
    var v = document.createElement('div');
    v.className = 'valor';
    v.textContent = valor;
    d.appendChild(r);
    d.appendChild(v);
    return d;
  }

  function desenhar() {
    desenharFiltro();
    var resumo = calcularResumo(diaEscolhido);

    elCartoes.innerHTML = '';
    elCartoes.appendChild(cartao('Total arrecadado', Dinheiro.formatar(resumo.total), true));
    elCartoes.appendChild(cartao('Pedidos', String(resumo.quantidade)));
    elCartoes.appendChild(cartao('Itens vendidos', String(resumo.itens)));
    var ticket = resumo.quantidade ? Math.round(resumo.total / resumo.quantidade) : 0;
    elCartoes.appendChild(cartao('Média por pedido', Dinheiro.formatar(ticket)));
    Object.keys(resumo.porPagamento).forEach(function (forma) {
      elCartoes.appendChild(cartao(forma, Dinheiro.formatar(resumo.porPagamento[forma])));
    });

    elRanking.innerHTML = '';
    if (resumo.ranking.length === 0) {
      elRanking.innerHTML = '<p class="vazio">Nenhuma venda ainda.</p>';
    } else {
      resumo.ranking.slice(0, 15).forEach(function (r, indice) {
        var linha = document.createElement('div');
        linha.className = 'linha';
        var info = document.createElement('div');
        info.className = 'linha-info';
        var t = document.createElement('div');
        t.className = 'linha-titulo';
        t.textContent = (indice + 1) + '. ' + r.nome;
        var s = document.createElement('div');
        s.className = 'linha-sub';
        s.textContent = r.quantidade + ' unidade(s)';
        info.appendChild(t); info.appendChild(s);
        var v = document.createElement('div');
        v.className = 'linha-valor';
        v.textContent = Dinheiro.formatar(r.valor);
        linha.appendChild(info); linha.appendChild(v);
        elRanking.appendChild(linha);
      });
    }

    desenharLista();
  }

  function desenharLista() {
    var vendas = vendasFiltradas(diaEscolhido);
    elLista.innerHTML = '';

    if (vendas.length === 0) {
      elLista.innerHTML = '<p class="vazio">Nenhum pedido registrado.</p>';
      return;
    }

    vendas.slice(0, 200).forEach(function (v) {
      var linha = document.createElement('div');
      linha.className = 'linha';

      var info = document.createElement('div');
      info.className = 'linha-info';
      var t = document.createElement('div');
      t.className = 'linha-titulo';
      t.textContent = 'Pedido #' + v.pedido + (v.cancelada ? ' (CANCELADO)' : '');
      if (v.cancelada) t.style.textDecoration = 'line-through';
      var s = document.createElement('div');
      s.className = 'linha-sub';
      var quando = new Date(v.data);
      var resumoItens = v.itens.map(function (i) { return i.quantidade + 'x ' + i.nome; }).join(', ');
      s.textContent = quando.toLocaleDateString('pt-BR') + ' ' +
        quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) +
        ' · ' + v.pagamento + ' · ' + resumoItens;
      info.appendChild(t); info.appendChild(s);

      var valor = document.createElement('div');
      valor.className = 'linha-valor';
      valor.textContent = Dinheiro.formatar(v.total);

      var acoes = document.createElement('div');
      acoes.className = 'linha-acoes';
      var bReimprimir = document.createElement('button');
      bReimprimir.type = 'button';
      bReimprimir.textContent = 'Reimprimir';
      bReimprimir.addEventListener('click', function () { App.imprimirPedido(v, 'SEGUNDA VIA'); });
      acoes.appendChild(bReimprimir);

      if (!v.cancelada) {
        var bCancelar = document.createElement('button');
        bCancelar.type = 'button';
        bCancelar.className = 'perigo';
        bCancelar.textContent = 'Cancelar';
        bCancelar.addEventListener('click', function () {
          App.confirmar({
            titulo: 'Cancelar o pedido #' + v.pedido + '?',
            texto: 'O valor de ' + Dinheiro.formatar(v.total) + ' sai do total do caixa. ' +
                   'O pedido continua na lista, marcado como cancelado.',
            botao: 'Cancelar pedido'
          }).then(function (confirmou) {
            if (!confirmou) return;
            DB.cancelarVenda(v.id);
            desenhar();
            App.avisar('Pedido #' + v.pedido + ' cancelado.');
          });
        });
        acoes.appendChild(bCancelar);
      }

      linha.appendChild(info);
      linha.appendChild(valor);
      linha.appendChild(acoes);
      elLista.appendChild(linha);
    });
  }

  function exportarCsv() {
    var vendas = vendasFiltradas(diaEscolhido).slice().reverse();
    if (vendas.length === 0) { App.avisar('Não há vendas para exportar.', 'erro'); return; }

    var linhas = ['Pedido;Data;Hora;Produto;Quantidade;Preco unitario;Subtotal;Pagamento;Situacao'];
    vendas.forEach(function (v) {
      var d = new Date(v.data);
      v.itens.forEach(function (i) {
        linhas.push([
          v.pedido,
          d.toLocaleDateString('pt-BR'),
          d.toLocaleTimeString('pt-BR'),
          i.nome.replace(/;/g, ','),
          i.quantidade,
          Dinheiro.semSimbolo(i.preco),
          Dinheiro.semSimbolo(i.preco * i.quantidade),
          v.pagamento,
          v.cancelada ? 'CANCELADO' : 'OK'
        ].join(';'));
      });
    });

    var conteudo = '﻿' + linhas.join('\r\n');
    App.baixarArquivo(conteudo, 'vendas-festa-' + (diaEscolhido || 'geral').replace(/\//g, '-') + '.csv',
      'text/csv;charset=utf-8');
    App.avisar('Planilha exportada.', 'ok');
  }

  return { iniciar: iniciar, desenhar: desenhar, calcularResumo: calcularResumo };
})();
