# Caixa da Festa — São Bom Jesus

Sistema simples de caixa (PDV) para as festas da igreja: você cadastra os
produtos uma vez, e na hora do pedido é só **clicar no produto → Finalizar →
o cupom sai na impressora Bluetooth**.

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

### 2. Conectar a impressora

1. Ligue a impressora e deixe o Bluetooth do computador ligado.
2. Clique em **Conectar impressora** (no alto da tela, à direita).
3. Escolha a impressora na janelinha do Chrome e clique em *Parear*.
4. Na aba **Ajustes**, clique em **Imprimir teste** para conferir.

Quando a bolinha ficar verde, está pronto.

### 3. Na hora do pedido

1. Clique nos produtos — cada clique soma 1 unidade.
2. Ajuste quantidades com os botões **−** e **+**.
3. Escolha o pagamento: Dinheiro, PIX, Cartão ou Ficha.
4. No dinheiro, digite quanto a pessoa entregou — **o troco aparece sozinho**
   (ou toque nos atalhos R$ 10, R$ 20, R$ 50...).
5. Clique em **Finalizar e imprimir**.

Atalho: digite o nome no campo de busca e aperte **Enter** — ele já adiciona.

### 4. No fim da noite

Aba **Vendas**:

- veja quanto entrou no total, por forma de pagamento e o que mais vendeu;
- **Imprimir fechamento** tira o resumo do caixa em papel, com linha para
  assinatura de quem conferiu;
- **Exportar planilha (CSV)** baixa tudo para abrir no Excel;
- dá para **cancelar** um pedido errado (sai do total) e reimprimir a **2ª via**.

### 5. Backup — importante!

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
| Vias por pedido | 2 vias imprime uma para o cliente e uma para a barraca entregar |
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
e você reimprime pela aba Vendas em "2ª via".

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
assets/js/cupom.js      o desenho do cupom em texto
assets/js/caixa.js      a tela de venda
assets/js/produtos.js   o cadastro
assets/js/vendas.js     relatórios, fechamento e CSV
assets/js/ajustes.js    configurações e backup
assets/js/app.js        junta tudo
sw.js / manifest.json   fazem funcionar offline e instalar como aplicativo
```

Todo valor em dinheiro é guardado em **centavos** (número inteiro), justamente
para o caixa nunca fechar com diferença de um centavo por arredondamento.
