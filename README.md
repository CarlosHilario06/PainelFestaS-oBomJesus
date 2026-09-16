# Caixa da Festa — São Bom Jesus

Sistema simples de caixa (PDV) para as festas da igreja: você cadastra os
produtos uma vez, e na hora do pedido é só **clicar no produto → Finalizar →
saem as fichas na impressora Bluetooth**, uma para cada item, para a pessoa
destacar e entregar em cada barraquinha.

Funciona no navegador, **sem internet** depois de aberto e **sem mensalidade**.
Os dados ficam guardados no próprio aparelho.

---

## Como abrir

**Jeito mais fácil:** dê dois cliques no arquivo `index.html`. Ele abre no
navegador e já funciona.

> Use o **Google Chrome**. É ele que permite conversar com a impressora
> Bluetooth. No Edge também funciona. Firefox e Safari **não** imprimem
> por Bluetooth.

**Para acessar de vários aparelhos (celular do caixa 1, caixa 2...):**
publique a pasta no GitHub Pages — em *Settings → Pages → Branch: main* —
e abra o endereço que o GitHub gerar. Assim dá até para "instalar" no celular
pelo menu do Chrome em *Adicionar à tela inicial*.

---

## O dia a dia da festa

### 1. Antes da festa — cadastrar os produtos

Aba **Produtos**: escreva o nome, o preço, a categoria (Lanches, Bebidas,
Doces...) e um ícone. Clique em **Salvar produto**.

Já deixei 12 produtos de exemplo cadastrados. Edite ou apague à vontade.

### 2. Colocar a imagem na ficha (opcional)

Aba **Ajustes → Imagem da ficha → Escolher imagem**. O sistema converte o
desenho para preto e branco e mostra como vai sair. Desenho de traço (contorno)
fica bem melhor que foto. Os controles de **tamanho** e **contraste** ajustam
se sair muito apagado ou muito borrado.

### 3. Ordem dos produtos

Na aba **Produtos**, as setas ↑ ↓ mudam a posição. Vale deixar a ordem da tela
igual à das barracas — quem opera acha por reflexo.

### 4. Conectar a impressora

1. Ligue a impressora e deixe o Bluetooth do computador ligado.
2. Clique em **Conectar impressora** (no alto da tela, à direita).
3. Escolha a impressora na janelinha do Chrome e clique em *Parear*.
4. Na aba **Ajustes**, clique em **Imprimir teste** para conferir.

Quando a bolinha ficar verde, está pronto.

### 5. Na hora do pedido

1. Clique nos produtos — cada clique soma 1 unidade.
2. Ajuste quantidades com os botões **−** e **+**.
3. Escolha o pagamento: Dinheiro, PIX, Cartão ou Ficha.
4. No dinheiro, digite quanto a pessoa entregou — **o troco aparece sozinho**
   (ou toque nos atalhos R$ 10, R$ 20, R$ 50...).
5. Clique em **Finalizar e imprimir**.

Saem as **fichas destacáveis**, uma por item. Quem comprou 2 cachorros-quentes
e 1 refrigerante recebe 3 fichas: entrega cada uma na barraquinha certa.
Cada ficha traz o nome do produto em letra grande, o preço, o número do
pedido e a contagem (1/3, 2/3, 3/3), com linha pontilhada para destacar.

### Atalhos de teclado (no computador)

O caixa já abre com o cursor na busca. Dá pra fechar uma venda inteira sem
tirar a mão do teclado:

| Atalho | O que faz |
|---|---|
| digitar o nome + `Enter` | adiciona o produto |
| `3 pastel` + `Enter` | adiciona **3** pastéis de uma vez (`3x pastel` também vale) |
| `Enter` com a busca vazia | finaliza a venda |
| `Ctrl` + `Enter` | finaliza de qualquer lugar da tela |
| `F2` | volta o cursor para a busca |
| `Esc` | limpa a busca |

### No celular

O pedido fica numa **barra fixa no rodapé**: o total e o botão de finalizar
estão sempre à vista, sem precisar rolar a tela. Toque na barra para abrir e
conferir os itens.

### Errou? Desfaz

Logo depois de finalizar, o aviso na tela traz um botão **Desfazer** por alguns
segundos: o pedido some do caixa, o número volta a valer e os itens voltam para
a tela para você corrigir. O botão *Limpar* também pode ser desfeito.

> Em *Ajustes* dá para trocar o que sai ao finalizar: **fichas** (padrão),
> **só o cupom** da compra, ou **cupom + fichas**. O botão **Ver como fica**
> mostra na tela, sem gastar papel.

### 6. No fim da noite

Aba **Vendas**:

- veja quanto entrou no total, por forma de pagamento e o que mais vendeu;
- **Imprimir fechamento** tira o resumo do caixa em papel, com linha para
  assinatura de quem conferiu;
- **Exportar planilha (CSV)** baixa tudo para abrir no Excel;
- dá para **cancelar** um pedido errado (sai do total) e **reimprimir** as
  fichas de um pedido, caso alguma se perca ou o papel acabe no meio.

### 7. Backup — importante!

Os dados ficam **neste navegador, neste computador**. Se limparem o histórico
do Chrome, some tudo.

No fim da festa, vá em **Ajustes → Baixar backup**. Guarde o arquivo. Para
voltar depois, é **Restaurar backup**.

---

## Ajustes que valem conhecer

| Ajuste | Para que serve |
|---|---|
| Nome da festa / linha extra / rodapé | O que sai impresso no alto e no pé do cupom |
| Largura do cupom | 58 mm (padrão, bobina pequena) ou 80 mm (impressora de balcão) |
| Acentuação | Se sair "cora????o" no papel, troque para CP850 ou "Sem acentos" |
| Imagem da ficha | A figura do São Bom Jesus (ou o brasão) impressa no alto de cada ficha |
| O que imprimir ao finalizar | Fichas destacáveis (padrão), só o cupom, ou os dois |
| Corte de papel | Só ligue se a sua impressora tiver serrinha automática |
| Plano B do navegador | Se o Bluetooth falhar, abre a janela normal de impressão |

---

## Se der problema

**"Este navegador não tem Bluetooth"** — abra no Google Chrome.

**A impressora não aparece na lista** — desligue e ligue a impressora, confira
se ela não está pareada em outro celular e tente de novo. Impressoras que só
funcionam por USB ou por Wi-Fi não aparecem aqui.

**Imprime com símbolos estranhos no lugar dos acentos** — Ajustes →
Acentuação → teste **CP850**; se continuar, use **Sem acentos**.

**Caiu a conexão no meio da festa** — clique no botão da impressora lá em cima
para reconectar. **Nenhuma venda se perde**: elas são salvas antes de imprimir,
e você reimprime as fichas pela aba Vendas, no botão "Reimprimir".

**As fichas saem grudadas / cortam no lugar errado** — se a sua impressora tem
serrinha automática, ligue *Corte de papel* em Ajustes. Se não tem, ela deixa
uma linha pontilhada e um espaço para destacar à mão.

**Acabou a bateria do computador / fechou sem querer** — abra de novo. Está
tudo lá, inclusive a numeração dos pedidos.

---

## Para quem for mexer no código

Não tem instalação, nem build, nem servidor. É HTML, CSS e JavaScript puro.

```
index.html              a tela
assets/css/style.css    a aparência
assets/js/db.js         onde os dados são guardados (localStorage)
assets/js/impressora.js Bluetooth + ESC/POS (a conversa com a impressora)
assets/js/cupom.js      monta as fichas, o cupom e o fechamento
assets/js/logo.js       converte a imagem em pontinhos para a térmica
assets/js/caixa.js      a tela de venda
assets/js/produtos.js   o cadastro
assets/js/vendas.js     relatórios, fechamento e CSV
assets/js/ajustes.js    configurações e backup
assets/js/app.js        junta tudo
sw.js / manifest.json   fazem funcionar offline e instalar como aplicativo
```

Todo valor em dinheiro é guardado em **centavos** (número inteiro), justamente
para o caixa nunca fechar com diferença de um centavo por arredondamento.

O que vai para o papel não é texto solto: `cupom.js` devolve uma lista de
**blocos** (`grande`, `negrito`, `linha`, `corte`...) e quem imprime traduz
cada bloco — em comandos ESC/POS na impressora Bluetooth, ou em HTML na
pré-visualização e na impressão pelo navegador. Assim as duas saídas nunca
saem diferentes uma da outra.
