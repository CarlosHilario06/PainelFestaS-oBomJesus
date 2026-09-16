/* ===========================================================
   caixa.js - a tela do PDV: escolher produtos e finalizar
   =========================================================== */
var TelaCaixa = (function () {

  var carrinho = [];            // [{ id, nome, preco, quantidade }]
  var formaPagamento = 'Dinheiro';
  var categoriaAtiva = 'Todos';
  var textoBusca = '';
  var quantidadeDigitada = 1;   // de "3 pastel"

  var elGrade, elBusca, elCategorias, elItens, elTotal, elPedido;
  var elFormas, elTroco, elRecebido, elValorTroco, elAtalhos;
  var btnFinalizar, btnFinalizarSem, btnLimpar;
  var elPainel, elBarraToggle, elBarraFinalizar, elResumoQtd, elResumoTotal;
  var carrinhoAnterior = null;   // guardado para o "Desfazer" do botão Limpar

  function iniciar() {
    elGrade = document.getElementById('gradeProdutos');
    elBusca = document.getElementById('busca');
    elCategorias = document.getElementById('filtroCategorias');
    elItens = document.getElementById('itensCarrinho');
    elTotal = document.getElementById('totalCarrinho');
    elPedido = document.getElementById('numeroPedido');
    elFormas = document.getElementById('formasPagamento');
    elTroco = document.getElementById('areaTroco');
    elRecebido = document.getElementById('valorRecebido');
    elValorTroco = document.getElementById('valorTroco');
    elAtalhos = document.getElementById('atalhosCedula');
    btnFinalizar = document.getElementById('btnFinalizar');
    btnFinalizarSem = document.getElementById('btnFinalizarSemImprimir');
    btnLimpar = document.getElementById('btnLimparCarrinho');
    elPainel = document.getElementById('painelCarrinho');
    elBarraToggle = document.getElementById('barraToggle');
    elBarraFinalizar = document.getElementById('barraFinalizar');
    elResumoQtd = document.getElementById('resumoQtd');
    elResumoTotal = document.getElementById('resumoTotal');

    elBarraToggle.addEventListener('click', function () {
      elPainel.classList.toggle('aberto');
    });
    elBarraFinalizar.addEventListener('click', function () { finalizar(); });

    elBusca.addEventListener('input', function () {
      var bruto = elBusca.value.trim().toLowerCase();
      var comNumero = bruto.match(/^(\d+)\s*x?\s+(.+)$/);
      if (comNumero) {
        quantidadeDigitada = Math.min(99, parseInt(comNumero[1], 10)) || 1;
        textoBusca = comNumero[2];
      } else {
        quantidadeDigitada = 1;
        textoBusca = bruto;
      }
      desenharGrade();
    });
    elBusca.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();

      /* busca vazia + Enter = finaliza. Deixa fechar a venda sem tirar
         a mão do teclado: "past" Enter, "refri" Enter, Enter. */
      if (!elBusca.value.trim()) { finalizar(); return; }

      var achados = filtrar();
      if (achados.length === 0) {
        App.avisar('Nenhum produto com esse nome.', 'erro');
        return;
      }
      adicionar(achados[0].id, quantidadeDigitada);
      elBusca.value = '';
      textoBusca = '';
      quantidadeDigitada = 1;
      desenharGrade();
    });
    document.getElementById('limparBusca').addEventListener('click', function () {
      elBusca.value = ''; textoBusca = ''; desenharGrade(); elBusca.focus();
    });

    elFormas.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('.forma');
      if (!alvo) return;
      formaPagamento = alvo.dataset.forma;
      Array.prototype.forEach.call(elFormas.children, function (b) {
        b.classList.toggle('ativa', b === alvo);
      });
      elTroco.style.display = formaPagamento === 'Dinheiro' ? 'block' : 'none';
      atualizarTroco();
    });

    elRecebido.addEventListener('input', atualizarTroco);

    [200, 500, 1000, 2000, 5000, 10000].forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = Dinheiro.formatar(c);
      b.addEventListener('click', function () {
        elRecebido.value = Dinheiro.semSimbolo(c);
        atualizarTroco();
      });
      elAtalhos.appendChild(b);
    });

    btnLimpar.addEventListener('click', function () {
      if (carrinho.length === 0) return;
      carrinhoAnterior = carrinho.slice();
      zerar();
      App.avisar('Pedido limpo.', null, { texto: 'Desfazer', fn: restaurarCarrinho });
    });

    btnFinalizar.addEventListener('click', function () { finalizar(true); });
    btnFinalizarSem.addEventListener('click', function () { finalizar(false); });

    document.addEventListener('keydown', atalhos);

    /* no computador o foco já começa na busca; no celular não,
       senão o teclado sobe sozinho e come metade da tela */
    if (window.innerWidth > 900) elBusca.focus();

    desenhar();
  }

  function atalhos(ev) {
    if (ev.key === 'F2') { ev.preventDefault(); elBusca.focus(); elBusca.select(); return; }
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); finalizar(); return; }
    if (ev.key === 'Escape') {
      if (elPainel.classList.contains('aberto')) { elPainel.classList.remove('aberto'); return; }
      if (elBusca.value) { elBusca.value = ''; textoBusca = ''; quantidadeDigitada = 1; desenharGrade(); }
      return;
    }
    /* digitou uma letra em qualquer lugar: manda para a busca */
    var campo = document.activeElement && document.activeElement.tagName;
    if (campo !== 'INPUT' && campo !== 'SELECT' && campo !== 'TEXTAREA' &&
        ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey &&
        document.getElementById('tela-caixa').classList.contains('ativa')) {
      elBusca.focus();
    }
  }

  /* ---------- Produtos na tela ---------- */
  function filtrar() {
    return DB.listarProdutos().filter(function (p) {
      var okCategoria = categoriaAtiva === 'Todos' || (p.categoria || 'Sem categoria') === categoriaAtiva;
      var okBusca = !textoBusca || p.nome.toLowerCase().indexOf(textoBusca) > -1;
      return okCategoria && okBusca;
    });
  }

  function desenharCategorias() {
    var cats = ['Todos'].concat(DB.categorias());
    var temSem = DB.listarProdutos().some(function (p) { return !(p.categoria || '').trim(); });
    if (temSem) cats.push('Sem categoria');
    if (cats.indexOf(categoriaAtiva) === -1) categoriaAtiva = 'Todos';

    elCategorias.innerHTML = '';
    cats.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = c;
      if (c === categoriaAtiva) b.classList.add('ativa');
      b.addEventListener('click', function () {
        categoriaAtiva = c;
        desenharCategorias();
        desenharGrade();
      });
      elCategorias.appendChild(b);
    });
  }

  function desenharGrade() {
    var produtos = filtrar();
    elGrade.innerHTML = '';

    if (produtos.length === 0) {
      var p = document.createElement('p');
      p.className = 'vazio';
      p.textContent = DB.listarProdutos().length === 0
        ? 'Nenhum produto cadastrado. Vá na aba "Produtos" para cadastrar.'
        : 'Nenhum produto encontrado com esse filtro.';
      elGrade.appendChild(p);
      return;
    }

    produtos.forEach(function (prod) {
      var envolucro = document.createElement('div');
      envolucro.className = 'card-wrap';

      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'card-produto';
      card.innerHTML =
        '<span class="icone">' + (prod.emoji || '🎪') + '</span>' +
        '<span class="nome"></span>' +
        '<span class="preco"></span>';
      card.querySelector('.nome').textContent = prod.nome;
      card.querySelector('.preco').textContent = Dinheiro.formatar(prod.preco);
      card.addEventListener('click', function () { adicionar(prod.id); });
      envolucro.appendChild(card);

      var noCarrinho = acharNoCarrinho(prod.id);
      if (noCarrinho) {
        var badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = noCarrinho.quantidade;
        envolucro.appendChild(badge);
      }

      elGrade.appendChild(envolucro);
    });
  }

  /* ---------- Carrinho ---------- */
  function acharNoCarrinho(id) {
    for (var i = 0; i < carrinho.length; i++) {
      if (carrinho[i].id === id) return carrinho[i];
    }
    return null;
  }

  function adicionar(id, quantas) {
    var prod = DB.acharProduto(id);
    if (!prod) return;
    var n = Math.max(1, quantas || 1);
    var item = acharNoCarrinho(id);
    if (item) {
      item.quantidade += n;
    } else {
      carrinho.push({ id: prod.id, nome: prod.nome, preco: prod.preco, quantidade: n });
    }
    desenharCarrinho();
    desenharGrade();
  }

  function mudarQuantidade(id, delta) {
    var item = acharNoCarrinho(id);
    if (!item) return;
    item.quantidade += delta;
    if (item.quantidade <= 0) {
      carrinho = carrinho.filter(function (i) { return i.id !== id; });
    }
    desenharCarrinho();
    desenharGrade();
  }

  function remover(id) {
    carrinho = carrinho.filter(function (i) { return i.id !== id; });
    desenharCarrinho();
    desenharGrade();
  }

  function total() {
    return carrinho.reduce(function (soma, i) { return soma + i.preco * i.quantidade; }, 0);
  }

  function desenharCarrinho() {
    elItens.innerHTML = '';
    elPedido.textContent = '#' + DB.proximoPedido();

    if (carrinho.length === 0) {
      elItens.innerHTML = '<p class="vazio">Toque nos produtos para adicionar à compra.</p>';
    } else {
      carrinho.forEach(function (item) {
        var div = document.createElement('div');
        div.className = 'item';

        var info = document.createElement('div');
        info.className = 'item-info';
        var nome = document.createElement('div');
        nome.className = 'item-nome';
        nome.textContent = item.nome;
        var sub = document.createElement('div');
        sub.className = 'item-sub';
        sub.textContent = Dinheiro.formatar(item.preco) + ' cada';
        info.appendChild(nome);
        info.appendChild(sub);

        var qtd = document.createElement('div');
        qtd.className = 'qtd';
        var menos = document.createElement('button');
        menos.type = 'button'; menos.textContent = '−';
        menos.addEventListener('click', function () { mudarQuantidade(item.id, -1); });
        var num = document.createElement('span');
        num.textContent = item.quantidade;
        var mais = document.createElement('button');
        mais.type = 'button'; mais.textContent = '+';
        mais.addEventListener('click', function () { mudarQuantidade(item.id, 1); });
        qtd.appendChild(menos); qtd.appendChild(num); qtd.appendChild(mais);

        var valor = document.createElement('div');
        valor.className = 'item-total';
        valor.textContent = Dinheiro.formatar(item.preco * item.quantidade);

        var lixeira = document.createElement('button');
        lixeira.type = 'button';
        lixeira.className = 'btn-remover';
        lixeira.textContent = '×';
        lixeira.title = 'Remover';
        lixeira.addEventListener('click', function () { remover(item.id); });

        div.appendChild(info);
        div.appendChild(qtd);
        div.appendChild(valor);
        div.appendChild(lixeira);
        elItens.appendChild(div);
      });
    }

    elTotal.textContent = Dinheiro.formatar(total());

    var pecas = carrinho.reduce(function (s, i) { return s + i.quantidade; }, 0);
    elResumoQtd.textContent = pecas === 0 ? 'Nenhum item'
      : pecas + (pecas === 1 ? ' item' : ' itens');
    elResumoTotal.textContent = Dinheiro.formatar(total());

    var vazio = carrinho.length === 0;
    btnFinalizar.disabled = vazio;
    btnFinalizarSem.disabled = vazio;
    elBarraFinalizar.disabled = vazio;
    if (vazio) elPainel.classList.remove('aberto');
    atualizarBotoes();
    atualizarTroco();
  }

  /* Sem impressora conectada o botão não promete imprimir, e o
     "finalizar sem imprimir" some por ser redundante. */
  function atualizarBotoes() {
    var temImpressora = Impressora.conectada();
    btnFinalizar.textContent = temImpressora ? 'Finalizar e imprimir' : 'Finalizar venda';
    btnFinalizarSem.classList.toggle('escondido', !temImpressora);
  }

  function atualizarTroco() {
    var recebido = Dinheiro.paraCentavos(elRecebido.value);
    var diferenca = recebido - total();
    var caixa = elValorTroco.parentElement;
    caixa.classList.remove('falta', 'destaque');
    if (recebido === 0) {
      elValorTroco.textContent = Dinheiro.formatar(0);
    } else if (diferenca < 0) {
      elValorTroco.textContent = 'faltam ' + Dinheiro.formatar(-diferenca);
      caixa.classList.add('falta');
    } else {
      elValorTroco.textContent = Dinheiro.formatar(diferenca);
      if (diferenca > 0) caixa.classList.add('destaque');
    }
  }

  function restaurarCarrinho() {
    if (!carrinhoAnterior) return;
    carrinho = carrinhoAnterior.slice();
    carrinhoAnterior = null;
    desenharCarrinho();
    desenharGrade();
  }

  function zerar() {
    carrinho = [];
    elRecebido.value = '';
    desenharCarrinho();
    desenharGrade();
  }

  /* ---------- Finalizar ---------- */
  function finalizar(comImpressao) {
    if (carrinho.length === 0) return;
    if (comImpressao === undefined) comImpressao = Impressora.conectada();

    var valorTotal = total();
    var recebido = Dinheiro.paraCentavos(elRecebido.value);

    if (formaPagamento === 'Dinheiro' && recebido > 0 && recebido < valorTotal) {
      App.avisar('O valor recebido é menor que o total.', 'erro');
      return;
    }

    var venda = DB.registrarVenda({
      itens: carrinho.map(function (i) {
        return { id: i.id, nome: i.nome, preco: i.preco, quantidade: i.quantidade };
      }),
      total: valorTotal,
      pagamento: formaPagamento,
      recebido: formaPagamento === 'Dinheiro' ? recebido : 0,
      troco: formaPagamento === 'Dinheiro' && recebido > 0 ? recebido - valorTotal : 0
    });

    var trocoTexto = venda.troco > 0 ? ' · Troco ' + Dinheiro.formatar(venda.troco) : '';
    App.avisar('Pedido #' + venda.pedido + ' · ' + Dinheiro.formatar(venda.total) + trocoTexto,
      'ok', { texto: 'Desfazer', fn: desfazerVenda });

    zerar();
    TelaVendas.desenhar();
    if (window.innerWidth > 900) elBusca.focus();

    if (comImpressao) App.imprimirPedido(venda);
  }

  /* Desfaz a venda recém-feita: o pedido some, o número volta a valer
     e os itens voltam para a tela, para corrigir e refazer. */
  function desfazerVenda() {
    var venda = DB.desfazerUltimaVenda();
    if (!venda) return;
    carrinho = venda.itens.map(function (i) {
      return { id: i.id, nome: i.nome, preco: i.preco, quantidade: i.quantidade };
    });
    formaPagamento = venda.pagamento || 'Dinheiro';
    Array.prototype.forEach.call(elFormas.children, function (b) {
      b.classList.toggle('ativa', b.dataset.forma === formaPagamento);
    });
    elTroco.style.display = formaPagamento === 'Dinheiro' ? 'block' : 'none';
    desenharCarrinho();
    desenharGrade();
    TelaVendas.desenhar();
    App.avisar('Pedido #' + venda.pedido + ' desfeito. Os itens voltaram.');
  }

  function desenhar() {
    atualizarBotoes();
    desenharCategorias();
    desenharGrade();
    desenharCarrinho();
  }

  return { iniciar: iniciar, desenhar: desenhar };
})();
