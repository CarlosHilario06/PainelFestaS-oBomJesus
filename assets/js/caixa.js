/* ===========================================================
   caixa.js - a tela do PDV: escolher produtos e finalizar
   =========================================================== */
var TelaCaixa = (function () {

  var carrinho = [];            // [{ id, nome, preco, quantidade }]
  var formaPagamento = 'Dinheiro';
  var categoriaAtiva = 'Todos';
  var textoBusca = '';

  var elGrade, elBusca, elCategorias, elItens, elTotal, elPedido;
  var elFormas, elTroco, elRecebido, elValorTroco, elAtalhos;
  var btnFinalizar, btnFinalizarSem, btnLimpar;

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

    elBusca.addEventListener('input', function () {
      textoBusca = elBusca.value.trim().toLowerCase();
      desenharGrade();
    });
    elBusca.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        var achados = filtrar();
        if (achados.length > 0) {
          adicionar(achados[0].id);
          elBusca.value = '';
          textoBusca = '';
          desenharGrade();
        }
      }
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
      if (!confirm('Limpar o pedido atual?')) return;
      zerar();
    });

    btnFinalizar.addEventListener('click', function () { finalizar(true); });
    btnFinalizarSem.addEventListener('click', function () { finalizar(false); });

    desenhar();
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

  function adicionar(id) {
    var prod = DB.acharProduto(id);
    if (!prod) return;
    var item = acharNoCarrinho(id);
    if (item) {
      item.quantidade += 1;
    } else {
      carrinho.push({ id: prod.id, nome: prod.nome, preco: prod.preco, quantidade: 1 });
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
    var vazio = carrinho.length === 0;
    btnFinalizar.disabled = vazio;
    btnFinalizarSem.disabled = vazio;
    atualizarTroco();
  }

  function atualizarTroco() {
    var recebido = Dinheiro.paraCentavos(elRecebido.value);
    var diferenca = recebido - total();
    var caixa = elValorTroco.parentElement;
    if (recebido === 0) {
      elValorTroco.textContent = Dinheiro.formatar(0);
      caixa.classList.remove('falta');
    } else if (diferenca < 0) {
      elValorTroco.textContent = 'faltam ' + Dinheiro.formatar(-diferenca);
      caixa.classList.add('falta');
    } else {
      elValorTroco.textContent = Dinheiro.formatar(diferenca);
      caixa.classList.remove('falta');
    }
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

    var trocoTexto = venda.troco > 0 ? ' | Troco: ' + Dinheiro.formatar(venda.troco) : '';
    App.avisar('Pedido #' + venda.pedido + ' registrado.' + trocoTexto, 'ok');

    zerar();
    TelaVendas.desenhar();

    if (comImpressao) App.imprimirPedido(venda);
  }

  function desenhar() {
    desenharCategorias();
    desenharGrade();
    desenharCarrinho();
  }

  return { iniciar: iniciar, desenhar: desenhar };
})();
