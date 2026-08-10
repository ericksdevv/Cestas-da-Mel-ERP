# Cestas da Mel ERP — Backend

API REST para o ERP Cestas da Mel. O backend centraliza autenticação, cadastros, estoque de produtos e materiais, composição e montagem de cestas, vendas, compras, despesas, caixa, alertas e relatórios. O painel React e o aplicativo React Native devem consumir a mesma API.

## Tecnologias

- Java 21
- Spring Boot 3.4
- Spring Web, Data JPA, Validation e Security
- JWT com BCrypt
- PostgreSQL 16
- Flyway
- Maven Wrapper
- JUnit/H2 para testes

## Executar localmente

Pré-requisitos: Java 21 e Docker Desktop (ou PostgreSQL 16 instalado).

```bash
docker compose up -d
./mvnw spring-boot:run
```

No Windows PowerShell:

```powershell
docker compose up -d
.\mvnw.cmd spring-boot:run
```

A API ficará em `http://localhost:8080/api`. Na primeira execução o Flyway cria todas as tabelas. Não é necessário executar SQL manualmente.

Para executar os testes:

```powershell
.\mvnw.cmd test
```

## Configuração

| Variável | Padrão | Finalidade |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5433/cestas_da_mel` | conexão PostgreSQL |
| `DB_USERNAME` | `postgres` | usuário do banco |
| `DB_PASSWORD` | `postgres` | senha do banco |
| `JWT_SECRET` | valor apenas de desenvolvimento | chave JWT (mínimo 32 caracteres) |
| `JWT_EXPIRATION_MINUTES` | `720` | validade do token |
| `CORS_ALLOWED_ORIGINS` | localhost 3000 e 5173 | origens web separadas por vírgula |
| `SERVER_PORT` | `8080` | porta HTTP |

Em produção, defina uma chave JWT aleatória forte e credenciais próprias para o banco. Datas e horas são recebidas e devolvidas em ISO-8601/UTC, por exemplo `2026-08-10T15:30:00Z`.

## Autenticação

Somente cadastro e login são públicos. Todos os usuários autenticados têm acesso total, sem papéis ou permissões complexas.

```http
POST /api/auth/register
Content-Type: application/json

{"name":"Administrador","email":"admin@cestasdamel.com","password":"senha123"}
```

```http
POST /api/auth/login
Content-Type: application/json

{"email":"admin@cestasdamel.com","password":"senha123"}
```

Use o token retornado nas demais chamadas:

```http
Authorization: Bearer SEU_TOKEN
```

## Endpoints

| Método e rota | Função |
|---|---|
| `POST /auth/register`, `POST /auth/login` | usuários e login |
| `GET /users`, `GET /users/me` | usuários cadastrados e usuário atual |
| `GET/POST /products`, `PUT /products/{id}` | cadastro e consulta de produtos |
| `POST /products/{id}/adjust-stock` | ajuste manual de estoque |
| `GET/POST /materials`, `PUT /materials/{id}` | cadastro e consulta de materiais |
| `POST /materials/{id}/adjust-stock` | ajuste manual de estoque |
| `GET/POST /baskets`, `GET/PUT /baskets/{id}` | modelos e composição de cestas |
| `POST /baskets/{id}/assemble` | montagem e baixa dos componentes |
| `GET/POST /sales` | histórico e registro de vendas |
| `GET/POST /purchases` | histórico e registro de compras |
| `GET/POST /expenses` | histórico e registro de despesas |
| `GET /financial-transactions` | fluxo de caixa |
| `GET /financial-transactions/balance` | saldo acumulado |
| `POST /financial-transactions` | lançamento manual de caixa |
| `GET /stock-movements?productId={id}` | histórico de produtos |
| `GET /material-movements?materialId={id}` | histórico de materiais |
| `GET /alerts/stock` | produtos/materiais baixos ou esgotados |
| `GET /dashboard` | indicadores atuais e últimos lançamentos |
| `GET /reports/monthly?year=2026&month=8` | resumo financeiro mensal |

As respostas de produtos e materiais incluem `status`: `OK`, `LOW` ou `OUT_OF_STOCK`. O estado `LOW` ocorre quando a quantidade é maior que zero e menor ou igual ao estoque mínimo.

## Exemplos de payload

### Produto e material

```json
{
  "name": "Chocolate 90g",
  "description": "Chocolate ao leite",
  "unit": "UNIT",
  "minimumStock": 5,
  "purchasePrice": 4.50,
  "salePrice": 8.00,
  "active": true
}
```

Unidades aceitas: `UNIT`, `KG`, `G`, `L`, `ML`, `M`, `CM`, `PACKAGE`, `BOX`.

### Modelo de cesta

```json
{
  "name": "Cesta Carinho",
  "description": "Modelo pequeno",
  "salePrice": 89.90,
  "active": true,
  "products": [{"id": 1, "quantity": 2}],
  "materials": [{"id": 1, "quantity": 1}]
}
```

Montagem:

```json
{"quantity": 3, "notes": "Produção da manhã"}
```

### Venda

```json
{
  "soldAt": "2026-08-10T15:30:00Z",
  "paymentMethod": "PIX",
  "observations": "Retirada no balcão",
  "items": [
    {"type": "PRODUCT", "referenceId": 1, "quantity": 2},
    {"type": "BASKET", "referenceId": 1, "quantity": 1, "unitPrice": 85.00}
  ]
}
```

Formas de pagamento: `CASH`, `PIX`, `CREDIT_CARD`, `DEBIT_CARD`, `BANK_TRANSFER`, `OTHER`. Se `unitPrice` não for enviado, é usado o preço atual do cadastro. A operação baixa produtos ou cestas montadas e cria uma entrada no caixa.

### Compra

```json
{
  "establishment": "Atacadista Central",
  "purchasedAt": "2026-08-10T12:00:00Z",
  "observations": "Nota fiscal 123",
  "items": [
    {"type": "PRODUCT", "referenceId": 1, "quantity": 20, "unitCost": 4.20},
    {"type": "MATERIAL", "referenceId": 1, "quantity": 10, "unitCost": 3.50}
  ]
}
```

A compra aumenta o estoque, atualiza o custo atual e cria uma saída no caixa.

### Despesa e ajuste

```json
{
  "description": "Conta de energia",
  "category": "UTILIDADES",
  "occurredAt": "2026-08-10T12:00:00Z",
  "amount": 180.50,
  "observations": "Competência agosto"
}
```

```json
{"quantity": -2, "notes": "Avaria identificada no inventário"}
```

No ajuste, quantidade positiva adiciona e negativa remove estoque. Estoque negativo nunca é permitido.

## Regras e integração com frontend

- Vendas, compras, despesas e montagens usam transações de banco: qualquer falha desfaz a operação inteira.
- Linhas de estoque são bloqueadas durante alterações concorrentes para evitar venda duplicada do mesmo saldo.
- Vendas preservam nome e preço praticado; compras preservam nome e custo, mantendo o histórico mesmo após edição do cadastro.
- Cestas são vendidas a partir da quantidade já montada. A montagem consome automaticamente produtos e materiais definidos na composição.
- Listas usam JSON direto e enums em texto, adequados para clientes TypeScript. Centralize a URL e o token JWT no cliente.
- Erros seguem o formato `{ timestamp, status, error, message, path, fields }`; `fields` detalha erros de validação.

## Estrutura

```text
src/main/java/com/cestasdamel/erp/
├── config/       segurança, JWT e CORS
├── controller/   endpoints REST
├── dto/          contratos de entrada e saída
├── exception/    erros de negócio e tratamento global
├── model/        entidades JPA e enums
├── repository/   acesso ao banco
└── service/      regras e transações
```

As migrations ficam em `src/main/resources/db/migration`. Novas mudanças de banco devem ser adicionadas como `V2__descricao.sql`, `V3__descricao.sql` etc.; não edite uma migration já aplicada em produção.
