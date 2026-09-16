/* ===========================================================
   db.js - guarda tudo no navegador (localStorage)
   Valores em dinheiro são sempre CENTAVOS (número inteiro),
   para nunca dar erro de arredondamento.
   =========================================================== */
var DB = (function () {
  var CHAVE = 'festa-sbj:v1';

  var padrao = {
    produtos: [],
    vendas: [],
    proximoPedido: 1,
    config: {
      nome: 'FESTA SAO BOM JESUS',
      linha2: 'Paroquia Sao Bom Jesus',
      rodape: 'Deus abencoe! Obrigado.',
      largura: 32,
      codepage: 'cp860',
      vias: 1,
      cortar: false,
      fallbackNavegador: true
    }
  };

  var dados = carregar();

  function carregar() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (!bruto) return JSON.parse(JSON.stringify(padrao));
      var obj = JSON.parse(bruto);
      return {
        produtos: obj.produtos || [],
        vendas: obj.vendas || [],
        proximoPedido: obj.proximoPedido || 1,
        config: Object.assign({}, padrao.config, obj.config || {})
      };
    } catch (e) {
      console.error('Falha ao ler dados salvos', e);
      return JSON.parse(JSON.stringify(padrao));
    }
  }

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(dados));
      return true;
    } catch (e) {
      console.error('Falha ao salvar', e);
      return false;
    }
  }

  function novoId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---------- Produtos ---------- */
  function listarProdutos() {
    return dados.produtos.slice().sort(function (a, b) {
      var c = (a.categoria || '').localeCompare(b.categoria || '', 'pt-BR');
      return c !== 0 ? c : a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }

  function acharProduto(id) {
    for (var i = 0; i < dados.produtos.length; i++) {
      if (dados.produtos[i].id === id) return dados.produtos[i];
    }
    return null;
  }

  function salvarProduto(p) {
    if (p.id) {
      var atual = acharProduto(p.id);
      if (atual) {
        atual.nome = p.nome;
        atual.preco = p.preco;
        atual.categoria = p.categoria;
        atual.emoji = p.emoji;
      }
    } else {
      p.id = novoId();
      dados.produtos.push(p);
    }
    salvar();
    return p;
  }

  function removerProduto(id) {
    dados.produtos = dados.produtos.filter(function (p) { return p.id !== id; });
    salvar();
  }

  function categorias() {
    var vistas = [];
    dados.produtos.forEach(function (p) {
      var c = (p.categoria || '').trim();
      if (c && vistas.indexOf(c) === -1) vistas.push(c);
    });
    return vistas.sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
  }

  /* ---------- Vendas ---------- */
  function proximoPedido() {
    return dados.proximoPedido;
  }

  function registrarVenda(venda) {
    venda.id = novoId();
    venda.pedido = dados.proximoPedido;
    venda.data = new Date().toISOString();
    dados.vendas.push(venda);
    dados.proximoPedido += 1;
    salvar();
    return venda;
  }

  function cancelarVenda(id) {
    for (var i = 0; i < dados.vendas.length; i++) {
      if (dados.vendas[i].id === id) {
        dados.vendas[i].cancelada = true;
        salvar();
        return dados.vendas[i];
      }
    }
    return null;
  }

  function listarVendas(dia) {
    var lista = dados.vendas.slice().reverse();
    if (dia) {
      lista = lista.filter(function (v) { return diaDaVenda(v) === dia; });
    }
    return lista;
  }

  function diaDaVenda(v) {
    return new Date(v.data).toLocaleDateString('pt-BR');
  }

  function diasComVenda() {
    var dias = [];
    dados.vendas.forEach(function (v) {
      var d = diaDaVenda(v);
      if (dias.indexOf(d) === -1) dias.push(d);
    });
    return dias.reverse();
  }

  function apagarVendas() {
    dados.vendas = [];
    dados.proximoPedido = 1;
    salvar();
  }

  /* ---------- Config ---------- */
  function config() { return dados.config; }

  function salvarConfig(novo) {
    Object.assign(dados.config, novo);
    salvar();
  }

  /* ---------- Backup ---------- */
  function exportar() {
    return JSON.stringify(dados, null, 2);
  }

  function importar(texto) {
    var obj = JSON.parse(texto);
    if (!obj || (!obj.produtos && !obj.vendas)) throw new Error('Arquivo inválido');
    dados = {
      produtos: obj.produtos || [],
      vendas: obj.vendas || [],
      proximoPedido: obj.proximoPedido || 1,
      config: Object.assign({}, padrao.config, obj.config || {})
    };
    salvar();
  }

  /* ---------- Exemplos para o primeiro uso ---------- */
  function semearExemplos() {
    if (dados.produtos.length > 0) return false;
    var exemplos = [
      ['Cachorro-quente', 800, 'Lanches', '🌭'],
      ['Pastel', 700, 'Lanches', '🥟'],
      ['Espetinho', 1000, 'Lanches', '🍢'],
      ['Pipoca', 500, 'Lanches', '🍿'],
      ['Milho verde', 600, 'Lanches', '🌽'],
      ['Refrigerante lata', 500, 'Bebidas', '🥤'],
      ['Água mineral', 300, 'Bebidas', '💧'],
      ['Suco natural', 500, 'Bebidas', '🧃'],
      ['Café', 200, 'Bebidas', '☕'],
      ['Bolo (fatia)', 500, 'Doces', '🍰'],
      ['Doce caseiro', 300, 'Doces', '🍬'],
      ['Algodão doce', 500, 'Doces', '🍭']
    ];
    exemplos.forEach(function (e) {
      dados.produtos.push({
        id: novoId(), nome: e[0], preco: e[1], categoria: e[2], emoji: e[3]
      });
    });
    salvar();
    return true;
  }

  return {
    listarProdutos: listarProdutos,
    acharProduto: acharProduto,
    salvarProduto: salvarProduto,
    removerProduto: removerProduto,
    categorias: categorias,
    proximoPedido: proximoPedido,
    registrarVenda: registrarVenda,
    cancelarVenda: cancelarVenda,
    listarVendas: listarVendas,
    diaDaVenda: diaDaVenda,
    diasComVenda: diasComVenda,
    apagarVendas: apagarVendas,
    config: config,
    salvarConfig: salvarConfig,
    exportar: exportar,
    importar: importar,
    semearExemplos: semearExemplos
  };
})();

/* ===== Ajudantes de dinheiro (centavos <-> texto) ===== */
var Dinheiro = {
  formatar: function (centavos) {
    return 'R$ ' + (centavos / 100).toFixed(2).replace('.', ',');
  },
  semSimbolo: function (centavos) {
    return (centavos / 100).toFixed(2).replace('.', ',');
  },
  paraCentavos: function (texto) {
    if (typeof texto === 'number') return Math.round(texto * 100);
    if (!texto) return 0;
    var limpo = String(texto).replace(/[^\d,.-]/g, '').trim();
    if (limpo.indexOf(',') > -1) {
      limpo = limpo.replace(/\./g, '').replace(',', '.');
    }
    var n = parseFloat(limpo);
    return isNaN(n) ? 0 : Math.round(n * 100);
  }
};
