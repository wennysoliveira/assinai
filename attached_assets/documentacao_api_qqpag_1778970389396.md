# Documentação de Integração — API Pix Quero-Quero PAG / QQPag / VerdeCard

> Arquivo gerado a partir dos materiais fornecidos: **Passo a Passo - Integração Pix Quero-Quero PAG** e **API_Pix_QQPag_Collection.yaml**.
>
> Objetivo: servir como documentação técnica detalhada para implementação por desenvolvedor, Codex ou outra IA.

---

## 1. Visão geral

A API Pix Quero-Quero PAG / QQPag permite integrar sistemas, PDVs, ERPs ou plataformas próprias para:

- Autenticar via OAuth2 `client_credentials`.
- Criar, consultar, listar e cancelar cobranças Pix imediatas.
- Criar, consultar, listar e cancelar cobranças Pix com vencimento.
- Gerar QR Code de cobrança.
- Consultar Pix recebidos.
- Solicitar e consultar devoluções Pix.
- Configurar, consultar, listar e remover webhooks Pix.
- Consultar conciliação financeira.
- Consultar health check da API.

A integração usa JSON, HTTPS e token Bearer.

---

## 2. Ambientes e variáveis

### 2.1. URL base

Homologação informada no manual:

```text
https://sandbox.qqpag.com.br
```

Na collection Insomnia, a variável aparece como:

```text
base_path=sandbox.qqpag.com.br
```

Portanto, a URL completa deve ser montada assim:

```text
https://{base_path}/api/...
```

### 2.2. Variáveis obrigatórias

Nunca fixe credenciais diretamente no código-fonte. Use `.env`, variáveis de ambiente, cofre de segredos ou painel administrativo.

```env
QQPAG_BASE_URL=https://sandbox.qqpag.com.br
QQPAG_CLIENT_ID=96418264021802.hml.qqpag.com.br
QQPAG_CLIENT_SECRET=73446f790b0f350c858ec828f88eed4d0d3e151cfd5b2e8c95a96396da65dad603e9f7f69bb442e9531ac140341cc185
QQPAG_CHAVE_PIX=f69b66c7-fee1-4da4-94b8-a2f02c50af1b
```

### 2.3. Credenciais de homologação

O manual anexado contém credenciais de homologação. Use apenas em ambiente de teste. Não publique essas credenciais em repositórios.

---

## 3. Autenticação

### 3.1. OAuth2 Client Credentials

Antes de chamar os demais endpoints, obtenha um token de acesso.

```http
POST /api/oauth/token
Host: sandbox.qqpag.com.br
Content-Type: application/json
```

#### Body

```json
{
  "client_id": "{{client_id}}",
  "client_secret": "{{client_secret}}",
  "grant_type": "client_credentials",
  "scope": "cob.write cob.read cobv.write cobv.read pix.write pix.read webhook.read webhook.write"
}
```

#### Scopes usados na collection

| Scope | Uso esperado |
|---|---|
| `cob.write` | Criar/revisar cobranças imediatas |
| `cob.read` | Consultar/listar cobranças imediatas |
| `cobv.write` | Criar/revisar cobranças com vencimento |
| `cobv.read` | Consultar/listar cobranças com vencimento |
| `pix.write` | Solicitar devolução Pix |
| `pix.read` | Consultar Pix e devoluções |
| `webhook.write` | Configurar/remover webhook |
| `webhook.read` | Consultar/listar webhooks |

#### Resposta esperada

A collection usa o campo `access_token` retornado pelo OAuth. O formato típico esperado é:

```json
{
  "access_token": "TOKEN",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "cob.write cob.read cobv.write cobv.read pix.write pix.read webhook.read webhook.write"
}
```

> Observação: o schema exato da resposta não veio documentado na collection. A implementação deve tratar pelo menos `access_token` e, se existir, `expires_in`.

### 3.2. Header de autenticação

Todos os endpoints protegidos devem enviar:

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

### 3.3. Cache e renovação do token

Recomendação de implementação:

1. Solicitar token antes da primeira chamada.
2. Guardar `access_token` em cache.
3. Renovar antes de expirar.
4. Se qualquer endpoint retornar `401`, solicitar novo token e repetir a chamada uma vez.

---

## 4. Convenções importantes

### 4.1. Formato monetário

Valores aparecem como string decimal com ponto:

```json
"13.54"
```

Não envie vírgula decimal.

### 4.2. CPF/CNPJ

Nos exemplos, CPF é enviado sem pontuação:

```json
"cpf": "08635874960"
```

Para CNPJ, use também apenas números, se aplicável.

### 4.3. `txId`

O `txId` é o identificador da cobrança usado na URL:

```text
/cob/{txId}
/cobv/{txId}
```

Recomendações:

- Gerar `txId` único por cobrança.
- Persistir no banco de dados junto com pedido/venda/conta a receber.
- Usar o mesmo `txId` para consultar, cancelar e conciliar.
- Não reutilizar `txId` para cobranças diferentes.

### 4.4. `e2eId`

O `e2eId` identifica uma transação Pix liquidada. Ele é usado para consulta de Pix específico e para devolução:

```text
/pix/{e2eId}
/pix/{e2eId}/devolucao/{id}
```

### 4.5. `id` da devolução

O `{id}` da devolução deve ser um identificador único gerado pelo seu sistema para a devolução daquele Pix.

---

## 5. Health Check

### 5.1. Consultar disponibilidade da API

```http
GET /api/healthCheck/v1/consultarHealthCheck
Authorization: Bearer {access_token}
```

#### Método sugerido no client

```text
healthCheck(): ApiResponse
```

#### Uso

Use para validar conectividade, token e disponibilidade básica da API.

---

## 6. Conciliação

### 6.1. Buscar transações de conciliação v2

```http
GET /api/conciliacao/v2/buscarTransacoes?data={YYYY-MM-DD}&paginaAtual={pagina}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Query params

| Parâmetro | Tipo | Obrigatório | Exemplo | Descrição |
|---|---:|---:|---|---|
| `data` | date | Sim | `2024-11-03` | Data da conciliação |
| `paginaAtual` | integer | Sim | `1` | Página atual da consulta |

#### Método sugerido no client

```text
buscarTransacoesConciliacao(data: string, paginaAtual: int = 1): ApiResponse
```

#### Finalidade

Usar para conciliação diária, comparando Pix liquidados, taxas e valores líquidos.

---

## 7. Cobrança Pix imediata — `cob`

Cobranças imediatas são usadas para pagamentos Pix com expiração, normalmente no PDV ou checkout.

### 7.1. Criar cobrança imediata

```http
PUT /api/v1/cob/{txId}
Authorization: Bearer {access_token}
Content-Type: application/json
```

> Atenção: na collection, criação de cobrança imediata usa `/api/v1/cob/{txId}`. Consulta, revisão, QR Code e listagem usam `/api/v2/cob...`.

#### Path params

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---:|---:|---|
| `txId` | string | Sim | Identificador único da cobrança |

#### Body exemplo

```json
{
  "calendario": {
    "expiracao": 8640000
  },
  "devedor": {
    "cpf": "08635874960",
    "nome": "Teste API"
  },
  "valor": {
    "original": "13.54",
    "modalidadeAlteracao": 1
  },
  "chave": "{{chave_pix}}"
}
```

#### Campos do body

| Campo | Tipo | Obrigatório | Descrição |
|---|---:|---:|---|
| `calendario.expiracao` | integer | Sim | Tempo de expiração da cobrança, em segundos, conforme padrão Pix |
| `devedor.cpf` | string | Condicional | CPF do pagador, somente números |
| `devedor.cnpj` | string | Condicional | CNPJ do pagador, se pessoa jurídica |
| `devedor.nome` | string | Sim | Nome do pagador |
| `valor.original` | string | Sim | Valor original com ponto decimal |
| `valor.modalidadeAlteracao` | integer | Não | Indica se permite alteração de valor, conforme regra Pix usada pela API |
| `chave` | string | Sim | Chave Pix cadastrada na QQPag |

#### Método sugerido no client

```text
criarCobrancaImediata(txId: string, payload: CriarCobPayload): ApiResponse
```

### 7.2. Consultar cobrança imediata

```http
GET /api/v2/cob/{txId}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Query params opcionais

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---:|---:|---|
| `revisao` | integer | Não | Consulta revisão específica da cobrança, se suportado |

#### Método sugerido no client

```text
consultarCobrancaImediata(txId: string, revisao?: int): ApiResponse
```

### 7.3. Revisar/cancelar cobrança imediata

```http
PATCH /api/v2/cob/{txId}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Body para cancelar/remover

```json
{
  "status": "REMOVIDA_PELO_USUARIO_RECEBEDOR"
}
```

#### Método sugerido no client

```text
cancelarCobrancaImediata(txId: string): ApiResponse
```

#### Quando usar

Se a cobrança foi gerada no PDV, mas o sistema não espera mais o pagamento, cancele a cobrança. O manual alerta que deixar cobranças ativas pode permitir pagamentos posteriores que não serão conciliados corretamente.

### 7.4. Gerar QR Code da cobrança imediata

```http
GET /api/v2/cob/{txId}/qrcode
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Método sugerido no client

```text
gerarQrCodeCobrancaImediata(txId: string): ApiResponse
```

#### Uso esperado

Exibir no PDV, checkout ou tela de pagamento. A resposta pode conter imagem, payload Pix Copia e Cola ou dados equivalentes, dependendo do retorno real da API.

### 7.5. Listar cobranças imediatas

```http
GET /api/v2/cob?inicio={datetime}&fim={datetime}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Query params

| Parâmetro | Tipo | Obrigatório | Exemplo | Descrição |
|---|---:|---:|---|---|
| `inicio` | datetime | Sim | `2024-12-01T00:00:01-03:00` | Início do período |
| `fim` | datetime | Sim | `2025-02-06T20:00:01-03:00` | Fim do período |

#### Método sugerido no client

```text
listarCobrancasImediatas(inicio: string, fim: string): ApiResponse
```

---

## 8. Pix recebido e devolução — `pix`

### 8.1. Consultar Pix específico

```http
GET /api/v2/pix/{e2eId}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Path params

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---:|---:|---|
| `e2eId` | string | Sim | End-to-End ID do Pix |

#### Método sugerido no client

```text
consultarPix(e2eId: string): ApiResponse
```

### 8.2. Consultar Pix recebidos

```http
GET /api/v2/pix?inicio={datetime}&fim={datetime}&paginacao.paginaAtual={pagina}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Query params suportados pela collection

| Parâmetro | Tipo | Obrigatório | Exemplo | Descrição |
|---|---:|---:|---|---|
| `inicio` | datetime | Sim | `2024-12-01T00:00:01-03:00` | Início do período |
| `fim` | datetime | Sim | `2024-12-05T13:35:00-03:00` | Fim do período |
| `txid` | string | Não | `00000000000000007423750791` | Filtra por txId |
| `cpf` | string | Não | `04836008069` | Filtra por CPF |
| `cnpj` | string | Não | `12345678000199` | Filtra por CNPJ |
| `txIdPresente` | boolean/string | Não | `true` | Filtra Pix com txId presente |
| `devolucaoPresente` | boolean/string | Não | `true` | Filtra Pix com devolução presente |
| `paginacao.paginaAtual` | integer | Não | `2` | Página atual |

#### Método sugerido no client

```text
listarPixRecebidos(filtros: PixRecebidosFiltro): ApiResponse
```

#### Finalidade

Use para conciliação diária dos Pix recebidos. Caso encontre Pix recebido que não exista na base local ou pertença a cobrança cancelada/expirada, avalie devolução.

### 8.3. Solicitar devolução Pix

```http
PUT /api/v2/pix/{e2eId}/devolucao/{id}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Path params

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---:|---:|---|
| `e2eId` | string | Sim | End-to-End ID do Pix original |
| `id` | string | Sim | ID único da devolução gerado pelo seu sistema |

#### Body

```json
{
  "valor": "0.01"
}
```

#### Método sugerido no client

```text
solicitarDevolucaoPix(e2eId: string, id: string, valor: string): ApiResponse
```

#### Quando usar

- Pagamento recebido para cobrança cancelada.
- Pagamento recebido sem correspondência no sistema.
- Erro interno no PDV em que o cliente pagou, mas não recebeu o produto/serviço.
- Fluxos de estorno/devolução operacional.

### 8.4. Consultar devolução Pix

```http
GET /api/v2/pix/{e2eId}/devolucao/{id}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Método sugerido no client

```text
consultarDevolucaoPix(e2eId: string, id: string): ApiResponse
```

---

## 9. Cobrança Pix com vencimento — `cobv`

Cobranças com vencimento são indicadas para contas a receber, boletos Pix ou cobranças com data de vencimento.

### 9.1. Criar cobrança com vencimento

```http
PUT /api/v2/cobv/{txId}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Body exemplo

```json
{
  "calendario": {
    "dataDeVencimento": "2025-02-27",
    "validadeAposVencimento": 30
  },
  "devedor": {
    "logradouro": "RUA ANTONIO GOMES, NUMERO 51, BAIRRO BALNEARIO",
    "cidade": "CAXIAS DO SUL",
    "uf": "RS",
    "cep": "95010100",
    "cpf": "08635874960",
    "nome": "Francisco da Silva"
  },
  "valor": {
    "original": "123.45",
    "juros": {
      "modalidade": "5",
      "valorPerc": "2.00"
    },
    "abatimento": {
      "modalidade": "2",
      "valorPerc": "10.00"
    }
  },
  "chave": "{{chave_pix}}",
  "solicitacaoPagador": "Cobrança dos serviços prestados."
}
```

#### Campos principais

| Campo | Tipo | Obrigatório | Descrição |
|---|---:|---:|---|
| `calendario.dataDeVencimento` | date | Sim | Data de vencimento em `YYYY-MM-DD` |
| `calendario.validadeAposVencimento` | integer | Sim | Dias de validade após o vencimento |
| `devedor.logradouro` | string | Sim | Endereço do pagador |
| `devedor.cidade` | string | Sim | Cidade |
| `devedor.uf` | string | Sim | UF |
| `devedor.cep` | string | Sim | CEP sem pontuação |
| `devedor.cpf` | string | Condicional | CPF sem pontuação |
| `devedor.cnpj` | string | Condicional | CNPJ sem pontuação |
| `devedor.nome` | string | Sim | Nome do pagador |
| `valor.original` | string | Sim | Valor original |
| `valor.juros.modalidade` | string | Não | Modalidade de juros |
| `valor.juros.valorPerc` | string | Não | Percentual/valor dos juros conforme modalidade |
| `valor.abatimento.modalidade` | string | Não | Modalidade de abatimento |
| `valor.abatimento.valorPerc` | string | Não | Percentual/valor de abatimento conforme modalidade |
| `chave` | string | Sim | Chave Pix cadastrada |
| `solicitacaoPagador` | string | Não | Mensagem ao pagador |

#### Método sugerido no client

```text
criarCobrancaComVencimento(txId: string, payload: CriarCobvPayload): ApiResponse
```

### 9.2. Revisar/cancelar cobrança com vencimento

```http
PATCH /api/v2/cobv/{txId}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Body para cancelar/remover

```json
{
  "status": "REMOVIDA_PELO_USUARIO_RECEBEDOR"
}
```

#### Método sugerido no client

```text
cancelarCobrancaComVencimento(txId: string): ApiResponse
```

### 9.3. Consultar cobrança com vencimento

```http
GET /api/v2/cobv/{txId}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Query params opcionais

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---:|---:|---|
| `revisao` | integer | Não | Consulta revisão específica da cobrança, se suportado |

#### Método sugerido no client

```text
consultarCobrancaComVencimento(txId: string, revisao?: int): ApiResponse
```

### 9.4. Listar cobranças com vencimento

```http
GET /api/v2/cobv?inicio={datetime}&fim={datetime}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Query params

| Parâmetro | Tipo | Obrigatório | Exemplo | Descrição |
|---|---:|---:|---|---|
| `inicio` | datetime | Sim | `2024-06-05T00:00:00` | Início do período |
| `fim` | datetime | Sim | `2025-02-06T19:36:00` | Fim do período |

#### Método sugerido no client

```text
listarCobrancasComVencimento(inicio: string, fim: string): ApiResponse
```

---

## 10. Webhooks Pix

Webhooks devem ser usados para receber notificações assíncronas de pagamento/liquidação e eventos relacionados ao Pix.

### 10.1. Configurar webhook Pix

```http
PUT /api/v2/webhook/{chave}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Path params

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---:|---:|---|
| `chave` | string | Sim | Chave Pix cadastrada na QQPag |

#### Body exemplo

```json
{
  "webhookUrl": "https://seu-dominio.com.br/api/webhook/qqpag/pix",
  "secret": "SEGREDO_FORTE_GERADO_PELO_SEU_SISTEMA"
}
```

#### Método sugerido no client

```text
configurarWebhookPix(chave: string, webhookUrl: string, secret: string): ApiResponse
```

#### Requisitos recomendados para sua URL

- Deve usar HTTPS válido.
- Deve responder rapidamente com HTTP `2xx`.
- Deve validar o segredo/token, se a QQPag enviar esse dado na notificação.
- Deve gravar o payload recebido integralmente em log/auditoria.
- Deve ser idempotente: se o mesmo evento chegar duas vezes, não duplique baixa financeira.

### 10.2. Exibir informações do webhook Pix

```http
GET /api/v2/webhook/{chave}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Método sugerido no client

```text
consultarWebhookPix(chave: string): ApiResponse
```

### 10.3. Cancelar/remover webhook Pix

```http
DELETE /api/v2/webhook/{chave}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Método sugerido no client

```text
removerWebhookPix(chave: string): ApiResponse
```

### 10.4. Consultar webhooks cadastrados

```http
GET /api/v2/webhook?inicio={datetime}&fim={datetime}&paginacao.paginaAtual={pagina}&paginacao.itensPorPagina={itens}
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Query params

| Parâmetro | Tipo | Obrigatório | Exemplo | Descrição |
|---|---:|---:|---|---|
| `inicio` | datetime | Sim | `2024-06-05T15:23:15.621Z` | Início do período |
| `fim` | datetime | Sim | `2025-02-06T23:31:55.621Z` | Fim do período |
| `paginacao.paginaAtual` | integer | Não | `0` | Página atual |
| `paginacao.itensPorPagina` | integer | Não | `100` | Quantidade por página |

#### Método sugerido no client

```text
listarWebhooks(inicio: string, fim: string, paginaAtual?: int, itensPorPagina?: int): ApiResponse
```

---

## 11. Fluxos de negócio recomendados

### 11.1. PDV — cobrança imediata com liquidação esperada

1. Gerar `txId` único.
2. Criar cobrança imediata com `PUT /api/v1/cob/{txId}`.
3. Gerar QR Code com `GET /api/v2/cob/{txId}/qrcode`, se necessário.
4. Exibir QR Code ou Pix Copia e Cola ao cliente.
5. Aguardar webhook ou fazer polling com `GET /api/v2/cob/{txId}`.
6. Quando confirmado pagamento, baixar venda/pedido.
7. Persistir `e2eId`, `txId`, valor, data/hora e payload recebido.

### 11.2. PDV — cobrança imediata abandonada ou cancelada

1. Criar cobrança normalmente.
2. Se o operador cancelar a venda ou o tempo do PDV encerrar:
   - Chamar `PATCH /api/v2/cob/{txId}` com status `REMOVIDA_PELO_USUARIO_RECEBEDOR`.
3. Se mesmo assim cair Pix depois:
   - Identificar via webhook/listagem Pix.
   - Solicitar devolução com `PUT /api/v2/pix/{e2eId}/devolucao/{id}`.

### 11.3. Cobrança com vencimento

1. Gerar `txId` único.
2. Criar cobrança com vencimento com `PUT /api/v2/cobv/{txId}`.
3. Entregar QR Code/link/dados ao cliente conforme retorno da API.
4. Monitorar por webhook ou consulta.
5. Dar baixa após liquidação.
6. Cancelar com `PATCH /api/v2/cobv/{txId}` se não for mais esperada.

### 11.4. Conciliação diária

1. Buscar Pix recebidos no período com `GET /api/v2/pix`.
2. Buscar conciliação com `GET /api/conciliacao/v2/buscarTransacoes`.
3. Comparar com base local:
   - `txId` existente?
   - valor confere?
   - venda/pedido já baixado?
   - cobrança estava cancelada?
   - existe devolução?
4. Para divergências:
   - registrar ocorrência.
   - devolver quando aplicável.
   - gerar relatório para financeiro/suporte.

---

## 12. Endpoint receptor de webhook no seu sistema

A collection mostra apenas como configurar o webhook na QQPag, não o schema exato do payload recebido. Portanto, implemente o receptor de forma flexível.

### 12.1. Endpoint sugerido

```http
POST /api/webhook/qqpag/pix
Content-Type: application/json
```

### 12.2. Regras de implementação

- Salvar payload bruto.
- Retornar `200 OK` rapidamente.
- Processar baixa de forma idempotente.
- Validar `txId`, `e2eId`, valor e status.
- Nunca confiar apenas no webhook para valores críticos: se necessário, consultar `GET /api/v2/pix/{e2eId}` ou `GET /api/v2/cob/{txId}`.
- Tratar reenvios.
- Registrar logs técnicos para enviar ao time da Quero-Quero PAG quando solicitado.

### 12.3. Pseudocódigo

```pseudo
receberWebhookQQPag(request):
    payload = request.body_json
    salvar_log_webhook(payload)

    txId = extrair_txid(payload)
    e2eId = extrair_e2eid(payload)
    valor = extrair_valor(payload)

    if evento_ja_processado(e2eId):
        return 200

    pix = qqpag.consultarPix(e2eId)

    if not pix.confirmado:
        return 200

    venda = buscar_venda_por_txid(txId)

    if venda não existe:
        registrar_divergencia(payload)
        return 200

    if venda.valor != pix.valor:
        registrar_divergencia(payload)
        return 200

    baixar_venda(venda, pix)
    marcar_evento_processado(e2eId)

    return 200
```

---

## 13. Tratamento de erros

Como o material anexado não contém tabela de erros, implemente tratamento genérico:

| HTTP | Tratamento sugerido |
|---:|---|
| `200`/`201` | Sucesso |
| `400` | Validar payload, campos obrigatórios, formato de valor/data/CPF |
| `401` | Renovar token e repetir uma vez |
| `403` | Verificar scopes, credenciais e permissão da chave Pix |
| `404` | Registro não encontrado: `txId`, `e2eId`, devolução ou webhook |
| `409` | Conflito/idempotência: verificar se já existe cobrança/devolução com o mesmo ID |
| `422` | Erro de validação de regra de negócio |
| `429` | Rate limit: aplicar retry com backoff |
| `500+` | Erro da API: retry controlado e logar evidência |

### 13.1. Retry recomendado

- Não repetir automaticamente `PUT`/`PATCH`/`DELETE` sem idempotência controlada.
- Para `GET`, pode repetir com backoff.
- Para criação de cobrança/devolução, como o ID é controlado pelo cliente (`txId`/`id`), é seguro consultar depois de erro para verificar se a operação foi criada.

---

## 14. Estrutura sugerida do client

### 14.1. Interface de alto nível

```text
class QQPagClient:
    authenticate(): Token
    request(method, path, body=None, query=None): ApiResponse

    healthCheck(): ApiResponse

    buscarTransacoesConciliacao(data, paginaAtual=1): ApiResponse

    criarCobrancaImediata(txId, payload): ApiResponse
    consultarCobrancaImediata(txId, revisao=None): ApiResponse
    cancelarCobrancaImediata(txId): ApiResponse
    gerarQrCodeCobrancaImediata(txId): ApiResponse
    listarCobrancasImediatas(inicio, fim): ApiResponse

    consultarPix(e2eId): ApiResponse
    listarPixRecebidos(filtros): ApiResponse
    solicitarDevolucaoPix(e2eId, id, valor): ApiResponse
    consultarDevolucaoPix(e2eId, id): ApiResponse

    criarCobrancaComVencimento(txId, payload): ApiResponse
    consultarCobrancaComVencimento(txId, revisao=None): ApiResponse
    cancelarCobrancaComVencimento(txId): ApiResponse
    listarCobrancasComVencimento(inicio, fim): ApiResponse

    configurarWebhookPix(chave, webhookUrl, secret): ApiResponse
    consultarWebhookPix(chave): ApiResponse
    removerWebhookPix(chave): ApiResponse
    listarWebhooks(inicio, fim, paginaAtual=None, itensPorPagina=None): ApiResponse
```

### 14.2. Persistência recomendada

Tabela/entidade para cobranças:

```text
pix_cobrancas
- id interno
- tx_id
- tipo: IMEDIATA | VENCIMENTO
- status local
- status qqpag
- valor
- cpf_cnpj_devedor
- nome_devedor
- chave_pix
- payload_criacao
- payload_ultima_consulta
- criado_em
- atualizado_em
- expiracao/data_vencimento
```

Tabela/entidade para liquidações Pix:

```text
pix_recebidos
- id interno
- e2e_id
- tx_id
- valor
- horario
- status
- payload
- processado_em
```

Tabela/entidade para devoluções:

```text
pix_devolucoes
- id interno
- devolucao_id
- e2e_id
- valor
- status
- payload_solicitacao
- payload_consulta
- criado_em
- atualizado_em
```

Tabela/entidade para webhooks:

```text
pix_webhook_logs
- id
- provider: QQPAG
- headers
- payload
- e2e_id
- tx_id
- processado
- erro
- recebido_em
```

---

## 15. Exemplos cURL

### 15.1. Obter token

```bash
curl -X POST "https://sandbox.qqpag.com.br/api/oauth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "'$QQPAG_CLIENT_ID'",
    "client_secret": "'$QQPAG_CLIENT_SECRET'",
    "grant_type": "client_credentials",
    "scope": "cob.write cob.read cobv.write cobv.read pix.write pix.read webhook.read webhook.write"
  }'
```

### 15.2. Criar cobrança imediata

```bash
curl -X PUT "https://sandbox.qqpag.com.br/api/v1/cob/$TXID" \
  -H "Authorization: Bearer $QQPAG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calendario": { "expiracao": 8640000 },
    "devedor": {
      "cpf": "08635874960",
      "nome": "Teste API"
    },
    "valor": {
      "original": "13.54",
      "modalidadeAlteracao": 1
    },
    "chave": "'$QQPAG_CHAVE_PIX'"
  }'
```

### 15.3. Consultar cobrança imediata

```bash
curl -X GET "https://sandbox.qqpag.com.br/api/v2/cob/$TXID" \
  -H "Authorization: Bearer $QQPAG_TOKEN" \
  -H "Content-Type: application/json"
```

### 15.4. Cancelar cobrança imediata

```bash
curl -X PATCH "https://sandbox.qqpag.com.br/api/v2/cob/$TXID" \
  -H "Authorization: Bearer $QQPAG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"REMOVIDA_PELO_USUARIO_RECEBEDOR"}'
```

### 15.5. Gerar QR Code

```bash
curl -X GET "https://sandbox.qqpag.com.br/api/v2/cob/$TXID/qrcode" \
  -H "Authorization: Bearer $QQPAG_TOKEN" \
  -H "Content-Type: application/json"
```

### 15.6. Consultar Pix recebidos

```bash
curl -X GET "https://sandbox.qqpag.com.br/api/v2/pix?inicio=2024-12-01T00:00:01-03:00&fim=2024-12-05T13:35:00-03:00&paginacao.paginaAtual=1" \
  -H "Authorization: Bearer $QQPAG_TOKEN" \
  -H "Content-Type: application/json"
```

### 15.7. Solicitar devolução

```bash
curl -X PUT "https://sandbox.qqpag.com.br/api/v2/pix/$E2EID/devolucao/$DEVOLUCAO_ID" \
  -H "Authorization: Bearer $QQPAG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"valor":"0.01"}'
```

### 15.8. Criar cobrança com vencimento

```bash
curl -X PUT "https://sandbox.qqpag.com.br/api/v2/cobv/$TXID" \
  -H "Authorization: Bearer $QQPAG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calendario": {
      "dataDeVencimento": "2025-02-27",
      "validadeAposVencimento": 30
    },
    "devedor": {
      "logradouro": "RUA ANTONIO GOMES, NUMERO 51, BAIRRO BALNEARIO",
      "cidade": "CAXIAS DO SUL",
      "uf": "RS",
      "cep": "95010100",
      "cpf": "08635874960",
      "nome": "Francisco da Silva"
    },
    "valor": {
      "original": "123.45",
      "juros": {
        "modalidade": "5",
        "valorPerc": "2.00"
      },
      "abatimento": {
        "modalidade": "2",
        "valorPerc": "10.00"
      }
    },
    "chave": "'$QQPAG_CHAVE_PIX'",
    "solicitacaoPagador": "Cobrança dos serviços prestados."
  }'
```

### 15.9. Configurar webhook

```bash
curl -X PUT "https://sandbox.qqpag.com.br/api/v2/webhook/$QQPAG_CHAVE_PIX" \
  -H "Authorization: Bearer $QQPAG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://seu-dominio.com.br/api/webhook/qqpag/pix",
    "secret": "SEGREDO_FORTE_GERADO_PELO_SEU_SISTEMA"
  }'
```

---

## 16. Lista completa dos métodos da collection

| Grupo | Método | Endpoint | Nome |
|---|---|---|---|
| OAuth | `POST` | `/api/oauth/token` | OAuth |
| API Pix | `GET` | `/api/healthCheck/v1/consultarHealthCheck` | Healthy Check |
| API Pix | `GET` | `/api/conciliacao/v2/buscarTransacoes` | Pix Conciliação v2 |
| Cob | `PUT` | `/api/v1/cob/{txId}` | Criar cobrança imediata |
| Cob | `GET` | `/api/v2/cob/{txId}` | Consultar cobrança imediata |
| Cob | `PATCH` | `/api/v2/cob/{txId}` | Revisar/cancelar cobrança imediata |
| Cob | `GET` | `/api/v2/cob/{txId}/qrcode` | Gerar QR Code |
| Cob | `GET` | `/api/v2/cob` | Consultar lista de cobranças imediatas |
| Pix | `GET` | `/api/v2/pix/{e2eId}` | Consultar Pix |
| Pix | `GET` | `/api/v2/pix` | Consultar Pix recebidos |
| Pix | `PUT` | `/api/v2/pix/{e2eId}/devolucao/{id}` | Solicitar devolução |
| Pix | `GET` | `/api/v2/pix/{e2eId}/devolucao/{id}` | Consultar devolução |
| CobV | `PUT` | `/api/v2/cobv/{txId}` | Criar cobrança com vencimento |
| CobV | `PATCH` | `/api/v2/cobv/{txId}` | Revisar/cancelar cobrança com vencimento |
| CobV | `GET` | `/api/v2/cobv/{txId}` | Consultar cobrança com vencimento |
| CobV | `GET` | `/api/v2/cobv` | Consultar lista de cobranças com vencimento |
| Webhook | `PUT` | `/api/v2/webhook/{chave}` | Configurar Webhook Pix |
| Webhook | `GET` | `/api/v2/webhook/{chave}` | Exibir informações do Webhook Pix |
| Webhook | `DELETE` | `/api/v2/webhook/{chave}` | Cancelar Webhook Pix |
| Webhook | `GET` | `/api/v2/webhook` | Consultar webhooks cadastrados |

---

## 17. Checklist para implementação

- [ ] Criar configuração por ambiente: sandbox e produção.
- [ ] Implementar OAuth com cache de token.
- [ ] Criar camada HTTP única com headers, logs e tratamento de erro.
- [ ] Implementar todos os métodos do client.
- [ ] Persistir `txId` em todas as cobranças.
- [ ] Persistir `e2eId` em todas as liquidações Pix.
- [ ] Implementar receptor de webhook idempotente.
- [ ] Criar rotina de conciliação diária por `/api/v2/pix` e/ou `/api/conciliacao/v2/buscarTransacoes`.
- [ ] Implementar devolução para divergências.
- [ ] Registrar logs/evidências de todos os cenários de homologação.
- [ ] Proteger credenciais e `client_secret`.
- [ ] Não usar credenciais de homologação em produção.

---

## 18. Prompts prontos para usar no Codex ou outra IA

### 18.1. Implementar client completo

```text
Implemente um client completo para a API Pix Quero-Quero PAG / QQPag usando esta documentação Markdown como especificação. O client deve:

1. Ler QQPAG_BASE_URL, QQPAG_CLIENT_ID, QQPAG_CLIENT_SECRET e QQPAG_CHAVE_PIX de variáveis de ambiente.
2. Autenticar via POST /api/oauth/token com grant_type client_credentials.
3. Cachear o access_token e renovar em caso de expiração ou HTTP 401.
4. Implementar todos os métodos listados na seção "Lista completa dos métodos da collection".
5. Ter tratamento de erro padronizado.
6. Logar request/response sem expor client_secret nem token.
7. Usar payloads e query params exatamente conforme esta documentação.
8. Criar testes unitários para cada método.
9. Criar exemplos de uso para cobrança imediata, cobrança com vencimento, webhook e devolução.
```

### 18.2. Implementar fluxo PDV

```text
Usando o client QQPag, implemente o fluxo de PDV para cobrança Pix imediata:

1. Gerar txId único.
2. Criar cobrança imediata.
3. Gerar QR Code.
4. Exibir QR Code ou Pix Copia e Cola.
5. Aguardar webhook ou consultar periodicamente a cobrança.
6. Baixar a venda quando o Pix for confirmado.
7. Cancelar a cobrança se a venda for abandonada.
8. Solicitar devolução se houver pagamento inesperado após cancelamento.
```

---

## 19. Observações finais

- O manual solicita que, após executar os cenários, sejam enviados logs/evidências dos fluxos chamados para o time técnico da Quero-Quero PAG.
- O material anexado referencia documentação técnica externa em `docs.qqpag.com.br/pix-cobranca`; caso a API tenha diferenças em produção, valide os schemas de retorno e regras de negócio nessa documentação oficial atualizada.
- A collection não trouxe exemplos de resposta, apenas requisições. Por isso, a implementação deve salvar respostas completas e tratar campos de retorno de maneira defensiva.
