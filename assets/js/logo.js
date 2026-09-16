/* ===========================================================
   logo.js - a imagem que sai no alto da ficha
   ------------------------------------------------------------
   Impressora térmica não imprime foto: ela só sabe queimar
   pontinhos pretos. Então a imagem é convertida para preto e
   branco puro e guardada já no formato que a impressora usa —
   um bit por pontinho, 8 pontinhos por byte.
   =========================================================== */
var Logo = (function () {

  var LARGURA_MAXIMA = 384;   // pontos de uma impressora de 58mm

  /* ---------- Converter um arquivo escolhido pelo usuário ---------- */
  function doArquivo(arquivo, opcoes) {
    opcoes = opcoes || {};
    var larguraAlvo = Math.min(opcoes.largura || 240, LARGURA_MAXIMA);
    var limite = opcoes.limite || 160;   // do que é escuro o bastante para virar preto

    return new Promise(function (resolve, rejeitar) {
      if (!arquivo.type || arquivo.type.indexOf('image/') !== 0) {
        rejeitar(new Error('Isso não parece ser uma imagem.'));
        return;
      }
      var leitor = new FileReader();
      leitor.onerror = function () { rejeitar(new Error('Não consegui ler o arquivo.')); };
      leitor.onload = function () {
        var img = new Image();
        img.onerror = function () { rejeitar(new Error('Não consegui abrir essa imagem.')); };
        img.onload = function () {
          try { resolve(daImagem(img, larguraAlvo, limite)); }
          catch (e) { rejeitar(e); }
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  /* ---------- Imagem -> pontinhos ---------- */
  function daImagem(img, larguraAlvo, limite) {
    /* a largura tem que ser múltipla de 8: cada byte carrega 8 pontinhos */
    var largura = Math.max(8, Math.floor(larguraAlvo / 8) * 8);
    var altura = Math.max(1, Math.round(img.height * (largura / img.width)));

    var tela = document.createElement('canvas');
    tela.width = largura;
    tela.height = altura;
    var ctx = tela.getContext('2d');
    ctx.fillStyle = '#fff';                 // fundo branco: transparência vira branco
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(img, 0, 0, largura, altura);

    var pixels = ctx.getImageData(0, 0, largura, altura).data;
    var bytesPorLinha = largura / 8;
    var dados = new Uint8Array(bytesPorLinha * altura);

    for (var y = 0; y < altura; y++) {
      for (var x = 0; x < largura; x++) {
        var i = (y * largura + x) * 4;
        var alfa = pixels[i + 3] / 255;
        /* luminância: o verde pesa mais para o olho humano */
        var luz = (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
        luz = luz * alfa + 255 * (1 - alfa);
        if (luz < limite) {                 // escuro o bastante: acende o pontinho
          dados[y * bytesPorLinha + (x >> 3)] |= (0x80 >> (x & 7));
        }
      }
    }

    return { largura: largura, altura: altura, dados: paraBase64(dados) };
  }

  /* ---------- Guardar como texto (para caber no localStorage) ---------- */
  function paraBase64(bytes) {
    var pedacos = [];
    for (var i = 0; i < bytes.length; i += 8192) {
      pedacos.push(String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)));
    }
    return btoa(pedacos.join(''));
  }

  function paraBytes(logo) {
    var bruto = atob(logo.dados);
    var bytes = new Uint8Array(bruto.length);
    for (var i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i);
    return bytes;
  }

  /* ---------- Desenhar de volta na tela ----------
     A pré-visualização mostra exatamente os mesmos pontinhos que
     vão para o papel, então o que se vê é o que sai. */
  var cache = {};

  function paraDataUrl(logo) {
    if (!logo || !logo.dados) return '';
    if (cache.chave === logo.dados) return cache.url;

    var bytes = paraBytes(logo);
    var bytesPorLinha = logo.largura / 8;
    var tela = document.createElement('canvas');
    tela.width = logo.largura;
    tela.height = logo.altura;
    var ctx = tela.getContext('2d');
    var imagem = ctx.createImageData(logo.largura, logo.altura);

    for (var y = 0; y < logo.altura; y++) {
      for (var x = 0; x < logo.largura; x++) {
        var aceso = bytes[y * bytesPorLinha + (x >> 3)] & (0x80 >> (x & 7));
        var i = (y * logo.largura + x) * 4;
        var cor = aceso ? 0 : 255;
        imagem.data[i] = imagem.data[i + 1] = imagem.data[i + 2] = cor;
        imagem.data[i + 3] = 255;
      }
    }
    ctx.putImageData(imagem, 0, 0);

    cache = { chave: logo.dados, url: tela.toDataURL('image/png') };
    return cache.url;
  }

  /* Quantos KB a imagem ocupa guardada */
  function tamanhoKb(logo) {
    if (!logo || !logo.dados) return 0;
    return Math.round(logo.dados.length / 1024);
  }

  return {
    doArquivo: doArquivo,
    paraBytes: paraBytes,
    paraDataUrl: paraDataUrl,
    tamanhoKb: tamanhoKb,
    LARGURA_MAXIMA: LARGURA_MAXIMA
  };
})();
