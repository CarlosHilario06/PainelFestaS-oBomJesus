/* ===========================================================
   impressora.js - Impressora térmica Bluetooth (ESC/POS)
   Usa Web Bluetooth (Chrome no Windows/Android).
   =========================================================== */
var Impressora = (function () {

  /* Serviços BLE usados pelas impressorinhas térmicas mais comuns */
  var SERVICOS = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Goojprt / MTP / genéricas
    '0000ff00-0000-1000-8000-00805f9b34fb',
    '0000ffe0-0000-1000-8000-00805f9b34fb', // módulos HM-10
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip / ISSC
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    '0000fee7-0000-1000-8000-00805f9b34fb'
  ];

  var dispositivo = null;
  var caracteristica = null;
  var aoMudarEstado = function () {};

  /* ---------- Tabelas de acentuação ---------- */
  var CP860 = {
    'Ç':0x80,'ü':0x81,'é':0x82,'â':0x83,'ã':0x84,'à':0x85,'Á':0x86,'ç':0x87,
    'ê':0x88,'Ê':0x89,'è':0x8A,'Í':0x8B,'Ô':0x8C,'ì':0x8D,'Ã':0x8E,'Â':0x8F,
    'É':0x90,'À':0x91,'È':0x92,'ô':0x93,'õ':0x94,'ò':0x95,'Ú':0x96,'ù':0x97,
    'Ì':0x98,'Õ':0x99,'Ü':0x9A,'¢':0x9B,'£':0x9C,'Ù':0x9D,'Ó':0x9F,
    'á':0xA0,'í':0xA1,'ó':0xA2,'ú':0xA3,'ñ':0xA4,'Ñ':0xA5,'ª':0xA6,'º':0xA7,
    'º':0xA7,'¿':0xA8,'Ò':0xA9
  };

  var CP850 = {
    'Ç':0x80,'ü':0x81,'é':0x82,'â':0x83,'ä':0x84,'à':0x85,'å':0x86,'ç':0x87,
    'ê':0x88,'ë':0x89,'è':0x8A,'ï':0x8B,'î':0x8C,'ì':0x8D,'Ä':0x8E,'Å':0x8F,
    'É':0x90,'æ':0x91,'Æ':0x92,'ô':0x93,'ö':0x94,'ò':0x95,'û':0x96,'ù':0x97,
    'ÿ':0x98,'Ö':0x99,'Ü':0x9A,'ø':0x9B,'£':0x9C,'Ø':0x9D,'ƒ':0x9F,
    'á':0xA0,'í':0xA1,'ó':0xA2,'ú':0xA3,'ñ':0xA4,'Ñ':0xA5,'ª':0xA6,'º':0xA7,
    'Á':0xB5,'Â':0xB6,'À':0xB7,'ã':0xC6,'Ã':0xC7,'Ê':0xD2,'Ë':0xD3,'È':0xD4,
    'Í':0xD6,'Î':0xD7,'Ï':0xD8,'Ì':0xDE,'Ó':0xE0,'Ô':0xE2,'Ò':0xE3,'õ':0xE4,
    'Õ':0xE5,'Ú':0xE9,'Û':0xEA,'Ù':0xEB,'§':0xF5
  };

  /* Comando ESC t n - seleciona a tabela de caracteres da impressora */
  var SELETOR = { cp860: 3, cp850: 2 };

  function semAcento(txt) {
    return txt.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* Converte o texto do cupom em bytes que a impressora entende */
  function paraBytes(texto, codepage) {
    var tabela = codepage === 'cp850' ? CP850 : (codepage === 'cp860' ? CP860 : null);
    if (!tabela) texto = semAcento(texto);
    var saida = [];
    for (var i = 0; i < texto.length; i++) {
      var ch = texto[i];
      var cod = ch.charCodeAt(0);
      if (cod < 128) {
        saida.push(cod);
      } else if (tabela && tabela[ch] !== undefined) {
        saida.push(tabela[ch]);
      } else {
        var alt = semAcento(ch);
        saida.push(alt.charCodeAt(0) < 128 ? alt.charCodeAt(0) : 0x3F); // "?"
      }
    }
    return saida;
  }

  /* ---------- Comandos ESC/POS ---------- */
  var ESQUERDA = [0x1B, 0x61, 0x00];
  var CENTRO   = [0x1B, 0x61, 0x01];
  var DOBRADO  = [0x1D, 0x21, 0x11];   // largura e altura em dobro
  var NORMAL   = [0x1D, 0x21, 0x00];
  var NEGRITO  = [0x1B, 0x45, 0x01];
  var SEM_NEGRITO = [0x1B, 0x45, 0x00];
  var CORTAR   = [0x1D, 0x56, 0x42, 0x00];

  function repetir(caractere, vezes) {
    return new Array(vezes + 1).join(caractere);
  }

  /* Traduz um bloco do cupom nos bytes que a impressora entende */
  function bytesDoBloco(bloco, cfg) {
    var L = cfg.largura || 32;
    var b = [];
    function escrever(txt) {
      b = b.concat(paraBytes(String(txt), cfg.codepage));
      b.push(0x0A);
    }

    switch (bloco.t) {
      case 'centro':
        b = b.concat(CENTRO); escrever(bloco.v); b = b.concat(ESQUERDA);
        break;

      case 'negrito':
        b = b.concat(CENTRO, NEGRITO); escrever(bloco.v);
        b = b.concat(SEM_NEGRITO, ESQUERDA);
        break;

      case 'grande':
        b = b.concat(CENTRO, DOBRADO); escrever(bloco.v);
        b = b.concat(NORMAL, ESQUERDA);
        break;

      case 'txt':
        escrever(String(bloco.v).slice(0, L));
        break;

      case 'ld':
        var e = String(bloco.e), d = String(bloco.d);
        var sobra = L - d.length;
        if (e.length > sobra - 1) e = e.slice(0, Math.max(0, sobra - 1));
        escrever(e + repetir(' ', Math.max(1, L - e.length - d.length)) + d);
        break;

      case 'linha':
        escrever(repetir(bloco.c || '-', L));
        break;

      case 'tracejado':
        escrever(repetir('- ', Math.floor(L / 2)).slice(0, L));
        break;

      case 'branco':
        for (var i = 0; i < (bloco.n || 1); i++) b.push(0x0A);
        break;

      case 'corte':
        /* Espaço para destacar. Com serrinha automática, corta de vez. */
        b.push(0x0A, 0x0A, 0x0A);
        if (cfg.cortar) b = b.concat(CORTAR);
        else b.push(0x0A);
        break;
    }
    return b;
  }

  /* Monta o pacote completo de um documento (lista de blocos) */
  function montarPacote(blocos, cfg) {
    var bytes = [0x1B, 0x40];                       // ESC @ = reiniciar
    if (SELETOR[cfg.codepage]) {
      bytes.push(0x1B, 0x74, SELETOR[cfg.codepage]); // ESC t n = acentuação
    }
    bytes = bytes.concat(ESQUERDA);
    blocos.forEach(function (bloco) {
      bytes = bytes.concat(bytesDoBloco(bloco, cfg));
    });
    return new Uint8Array(bytes);
  }

  /* ---------- Conexão ---------- */
  function suportado() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
  }

  function conectada() {
    return !!(caracteristica && dispositivo && dispositivo.gatt && dispositivo.gatt.connected);
  }

  function nomeDispositivo() {
    return dispositivo ? (dispositivo.name || 'Impressora') : '';
  }

  function conectar() {
    if (!suportado()) {
      return Promise.reject(new Error(
        'Este navegador não permite Bluetooth. Use o Google Chrome (Windows ou Android).'
      ));
    }
    return navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: SERVICOS
    }).then(function (dev) {
      dispositivo = dev;
      dev.addEventListener('gattserverdisconnected', function () {
        caracteristica = null;
        aoMudarEstado();
      });
      return dev.gatt.connect();
    }).then(function (servidor) {
      return servidor.getPrimaryServices();
    }).then(function (servicos) {
      return procurarCaracteristica(servicos, 0);
    }).then(function (car) {
      if (!car) throw new Error('Não achei o canal de impressão neste aparelho. Ele é uma impressora térmica Bluetooth?');
      caracteristica = car;
      aoMudarEstado();
      return nomeDispositivo();
    });
  }

  /* Procura, entre todos os serviços, uma característica onde dê pra escrever */
  function procurarCaracteristica(servicos, indice) {
    if (indice >= servicos.length) return Promise.resolve(null);
    return servicos[indice].getCharacteristics().then(function (cars) {
      for (var i = 0; i < cars.length; i++) {
        var c = cars[i];
        if (c.properties.write || c.properties.writeWithoutResponse) return c;
      }
      return procurarCaracteristica(servicos, indice + 1);
    }).catch(function () {
      return procurarCaracteristica(servicos, indice + 1);
    });
  }

  function desconectar() {
    if (dispositivo && dispositivo.gatt && dispositivo.gatt.connected) {
      dispositivo.gatt.disconnect();
    }
    dispositivo = null;
    caracteristica = null;
    aoMudarEstado();
  }

  /* ---------- Envio ---------- */
  /* O Bluetooth aceita poucos bytes por vez: enviamos em pedaços */
  function enviarPedacos(dados, posicao) {
    if (posicao >= dados.length) return Promise.resolve();
    var tamanho = 180;
    var pedaco = dados.slice(posicao, posicao + tamanho);
    var escrever = caracteristica.writeValueWithoutResponse
      ? caracteristica.writeValueWithoutResponse(pedaco)
      : caracteristica.writeValue(pedaco);
    return escrever.then(function () {
      return new Promise(function (r) { setTimeout(r, 30); });
    }).then(function () {
      return enviarPedacos(dados, posicao + tamanho);
    });
  }

  function imprimir(blocos, vias) {
    var cfg = DB.config();
    var quantas = vias || 1;
    if (!conectada()) {
      return Promise.reject(new Error('Impressora não conectada.'));
    }
    var pacote = montarPacote(blocos, cfg);
    var fila = Promise.resolve();
    for (var i = 0; i < quantas; i++) {
      fila = fila.then(function () { return enviarPedacos(pacote, 0); });
    }
    return fila;
  }

  /* ---------- Plano B: impressão pelo navegador ---------- */
  function imprimirPeloNavegador(blocos) {
    var area = document.getElementById('areaImpressaoNavegador');
    area.innerHTML = Cupom.paraHtml(blocos);
    window.print();
  }

  function aoMudar(fn) { aoMudarEstado = fn; }

  return {
    suportado: suportado,
    conectada: conectada,
    conectar: conectar,
    desconectar: desconectar,
    imprimir: imprimir,
    imprimirPeloNavegador: imprimirPeloNavegador,
    nomeDispositivo: nomeDispositivo,
    aoMudar: aoMudar
  };
})();
