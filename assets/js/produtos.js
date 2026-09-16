/* ===========================================================
   produtos.js - cadastro de produtos
   =========================================================== */
var TelaProdutos = (function () {

  var form, campoId, campoNome, campoPreco, campoCategoria;
  var btnCancelar, lista, contador, datalist, titulo;

  function iniciar() {
    form = document.getElementById('formProduto');
    campoId = document.getElementById('produtoId');
    campoNome = document.getElementById('produtoNome');
    campoPreco = document.getElementById('produtoPreco');
    campoCategoria = document.getElementById('produtoCategoria');
    btnCancelar = document.getElementById('btnCancelarProduto');
    lista = document.getElementById('listaProdutos');
    contador = document.getElementById('qtdProdutos');
    datalist = document.getElementById('listaCategorias');
    titulo = document.getElementById('tituloFormProduto');

    form.addEventListener('submit', salvar);
    btnCancelar.addEventListener('click', limparForm);
    desenhar();
  }

  function salvar(ev) {
    ev.preventDefault();
    var nome = campoNome.value.trim();
    var preco = Dinheiro.paraCentavos(campoPreco.value);

    if (!nome) { App.avisar('Escreva o nome do produto.', 'erro'); return; }
    if (preco <= 0) { App.avisar('Coloque um preço maior que zero.', 'erro'); return; }

    DB.salvarProduto({
      id: campoId.value || null,
      nome: nome,
      preco: preco,
      categoria: campoCategoria.value.trim()
    });

    App.avisar(campoId.value ? 'Produto atualizado.' : 'Produto cadastrado!', 'ok');
    limparForm();
    desenhar();
    TelaCaixa.desenhar();
  }

  function editar(id) {
    var p = DB.acharProduto(id);
    if (!p) return;
    campoId.value = p.id;
    campoNome.value = p.nome;
    campoPreco.value = Dinheiro.semSimbolo(p.preco);
    campoCategoria.value = p.categoria || '';
    titulo.textContent = 'Editando: ' + p.nome;
    btnCancelar.classList.remove('escondido');
    campoNome.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function apagar(id) {
    var p = DB.acharProduto(id);
    if (!p) return;
    if (!confirm('Apagar o produto "' + p.nome + '"?\n\nAs vendas já registradas continuam guardadas.')) return;
    DB.removerProduto(id);
    if (campoId.value === id) limparForm();
    desenhar();
    TelaCaixa.desenhar();
    App.avisar('Produto apagado.');
  }

  function mover(id, direcao) {
    if (!DB.moverProduto(id, direcao)) return;
    desenhar();
    TelaCaixa.desenhar();
  }

  function limparForm() {
    form.reset();
    campoId.value = '';
    titulo.textContent = 'Cadastrar produto';
    btnCancelar.classList.add('escondido');
  }

  function desenhar() {
    var produtos = DB.listarProdutos();
    contador.textContent = produtos.length;

    datalist.innerHTML = '';
    DB.categorias().forEach(function (c) {
      var op = document.createElement('option');
      op.value = c;
      datalist.appendChild(op);
    });

    lista.innerHTML = '';
    if (produtos.length === 0) {
      lista.innerHTML = '<p class="vazio">Nenhum produto ainda. Cadastre o primeiro acima.</p>';
      return;
    }

    produtos.forEach(function (p, indice) {
      var linha = document.createElement('div');
      linha.className = 'linha';

      var info = document.createElement('div');
      info.className = 'linha-info';
      var titulo = document.createElement('div');
      titulo.className = 'linha-titulo';
      titulo.textContent = p.nome;
      var sub = document.createElement('div');
      sub.className = 'linha-sub';
      sub.textContent = p.categoria || 'Sem categoria';
      info.appendChild(titulo);
      info.appendChild(sub);

      var valor = document.createElement('div');
      valor.className = 'linha-valor';
      valor.textContent = Dinheiro.formatar(p.preco);

      var acoes = document.createElement('div');
      acoes.className = 'linha-acoes';

      /* subir/descer: deixa a ordem da tela do caixa igual à da barraca */
      var bSubir = document.createElement('button');
      bSubir.type = 'button';
      bSubir.className = 'mover';
      bSubir.textContent = '↑';
      bSubir.title = 'Subir';
      bSubir.disabled = indice === 0;
      bSubir.addEventListener('click', function () { mover(p.id, -1); });
      var bDescer = document.createElement('button');
      bDescer.type = 'button';
      bDescer.className = 'mover';
      bDescer.textContent = '↓';
      bDescer.title = 'Descer';
      bDescer.disabled = indice === produtos.length - 1;
      bDescer.addEventListener('click', function () { mover(p.id, 1); });
      acoes.appendChild(bSubir);
      acoes.appendChild(bDescer);

      var bEditar = document.createElement('button');
      bEditar.type = 'button';
      bEditar.textContent = 'Editar';
      bEditar.addEventListener('click', function () { editar(p.id); });
      var bApagar = document.createElement('button');
      bApagar.type = 'button';
      bApagar.className = 'perigo';
      bApagar.textContent = 'Apagar';
      bApagar.addEventListener('click', function () { apagar(p.id); });
      acoes.appendChild(bEditar);
      acoes.appendChild(bApagar);

      linha.appendChild(info);
      linha.appendChild(valor);
      linha.appendChild(acoes);
      lista.appendChild(linha);
    });
  }

  return { iniciar: iniciar, desenhar: desenhar };
})();
