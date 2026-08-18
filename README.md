# Cestas da Mel ERP

Sistema de gestão para estoque, materiais, produção de cestas, vendas e fluxo financeiro. O aplicativo funciona no navegador e no Expo Go, consumindo uma API Spring Boot com persistência PostgreSQL.

## Funcionalidades

- cadastro e edição de produtos com estoque contado em unidades;
- categorias próprias e persistentes para organizar produtos e materiais;
- peso ou volume opcional por embalagem, como chocolate de 90 g ou perfume de 100 ml;
- foto opcional pela câmera ou galeria, armazenada permanentemente no PostgreSQL;
- cadastro e edição de materiais em unidade, peso, volume ou comprimento, com medida opcional por embalagem;
- exclusão segura de produtos, materiais e cestas sem apagar o histórico de vendas e movimentações;
- composição de modelos de cesta usando produtos e materiais cadastrados;
- produção de cestas com baixa automática dos componentes;
- venda manual de produtos e cestas prontas, com forma de pagamento;
- baixa automática do estoque e aviso de item baixo ou esgotado;
- cancelamento de venda com devolução ao estoque e estorno financeiro;
- registro de compras, gastos, entradas e saídas manuais;
- leitura de nota fiscal por foto com IA, conferência humana, associação ao estoque e criação opcional de categorias e itens;
- caixa atual, indicadores diários, semanais e mensais e históricos detalhados de entrada, saída e estoque resultante;
- gráficos semanais e mensais de entradas, saídas e resultado no caixa;
- períodos ligados ao calendário real da empresa: o dia, a semana e o mês mudam automaticamente sem apagar o histórico anterior;
- atualização automática das telas após produtos, ajustes, compras e vendas;
- tema claro e escuro em todas as telas, com preferência salva no aparelho;
- formulários responsivos e ações de edição compatíveis com navegador e Expo Go;
- navegação minimalista por abas, com menos botões e caixas concorrendo pela atenção;
- login JWT e criação segura do primeiro acesso.

## Estrutura

```text
backend/   API REST em Java 21, Spring Boot, JPA, Flyway e PostgreSQL
frontend/  aplicativo Expo 54, React Native, TypeScript e React Query
```

## Requisitos

- Java 21;
- Docker Desktop;
- Node.js 20 ou superior;
- Expo Go compatível com o SDK 54.

Use Java 21 no backend. Versões de desenvolvimento mais novas do Java podem apresentar falhas internas do compilador no Windows.

## Início rápido — um único comando

Abra um terminal na pasta principal do projeto e execute:

```powershell
.\iniciar.cmd
```

Esse comando abre o Docker Desktop quando necessário, inicia PostgreSQL e API em Java 21 dentro do Docker, aguarda o sistema ficar pronto e abre o Expo com o QR Code. Na primeira execução, a construção da API pode demorar alguns minutos; as próximas utilizam o cache do Docker.

Para encerrar o banco e a API:

```powershell
.\parar.cmd
```

O Expo permanece no terminal principal e pode ser encerrado com `Ctrl+C`.

## Configuração segura

Nenhuma senha real ou chave JWT fica no repositório. Use [`backend/.env.example`](backend/.env.example) apenas como referência e defina valores próprios no terminal.

Para habilitar a leitura de notas, adicione `OPENROUTER_API_KEY` ao arquivo local `backend/.env.local`. A chave é enviada somente ao contêiner da API e nunca é incluída no Expo, no navegador ou no APK. O modelo gratuito padrão é `openrouter/free` e pode ser alterado com `OPENROUTER_MODEL`.

No PowerShell:

```powershell
cd backend
$env:POSTGRES_PASSWORD = "escolha-uma-senha-forte"
docker compose up -d

$env:DB_USERNAME = "cestas_app"
$env:DB_PASSWORD = $env:POSTGRES_PASSWORD
$env:JWT_SECRET = "gere-uma-chave-aleatoria-com-mais-de-32-caracteres"
$env:CORS_ALLOWED_ORIGINS = "http://localhost:8081,http://127.0.0.1:8081"
.\mvnw.cmd spring-boot:run
```

A API ficará em `http://localhost:8080/api` e o diagnóstico público em `http://localhost:8080/api/health`.

Em outro terminal:

```powershell
cd frontend
npm ci
npx expo start --lan
```

Pressione `w` para abrir no navegador ou leia o QR Code com o Expo Go. Durante o desenvolvimento, o app identifica automaticamente o endereço do computador informado pelo Expo. Se a rede exigir configuração manual, copie `frontend/.env.example` para `frontend/.env.local` e informe a URL local da API. Arquivos `.env.local` não são enviados ao GitHub.

## Primeiro acesso

Em um banco novo, escolha **Configurar primeiro acesso** na tela de login e crie o administrador. Depois que o primeiro usuário existe, novos cadastros só podem ser feitos por uma sessão administrativa autenticada. Bancos já existentes preservam seus usuários e senhas.

## Testes

Backend:

```powershell
cd backend
.\mvnw.cmd test
```

Frontend:

```powershell
cd frontend
npm run typecheck
npm run export:web
npm run export:android
```

A suíte de integração percorre autenticação, categorias, catálogo, conteúdo das embalagens, imagens, ajustes, composição e edição de cesta, produção, vendas, cancelamento, compras, gastos, caixa, relatórios diários/semanais/mensais, alertas e históricos.

Produtos, materiais, categorias, estoques, cestas, vendas, compras, gastos, movimentações e lançamentos do caixa são gravados no PostgreSQL. Os painéis são calculados diretamente desses registros; não usam números fixos ou dados simulados.

## Segurança

- senhas armazenadas somente como hash BCrypt;
- JWT com chave obrigatória fornecida por variável de ambiente;
- cadastro público permitido apenas para o primeiro administrador;
- rotas do ERP protegidas por autenticação;
- CORS limitado às origens configuradas;
- sessão no cofre seguro do dispositivo e apenas durante a aba no navegador;
- respostas internas não expõem stack trace, credenciais ou detalhes do banco.
- chave da OpenAI mantida apenas no backend; imagens de notas não são incluídas em logs nem persistidas pelo fluxo de análise.
