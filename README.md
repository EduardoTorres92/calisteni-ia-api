# Calisteni IA - Bootcamp Treinos API

API REST para gerenciamento de treinos e planos de exercícios, com autenticação integrada.

## 🛠️ Tecnologias

- **Runtime:** Node.js 24+
- **Framework:** Fastify 5
- **Banco de dados:** PostgreSQL (Neon)
- **ORM:** Prisma 7
- **Autenticação:** Better Auth (email/senha)
- **Documentação:** Scalar (OpenAPI)
- **Validação:** Zod + fastify-type-provider-zod
- **Linguagem:** TypeScript

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) >= 24.x
- [pnpm](https://pnpm.io/) (gerenciador de pacotes)
- Conta no [Neon](https://neon.tech/) (ou PostgreSQL local)

## 🚀 Instalação

```bash
# Clone o repositório
git clone https://github.com/EduardoTorres92/calisteni-ia.git
cd calisteni-ia

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais
```

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta do servidor (padrão: 3000) |
| `DATABASE_URL` | URL de conexão PostgreSQL (Neon ou local) |
| `BETTER_AUTH_SECRET` | Chave secreta para autenticação (mín. 32 caracteres) |
| `BETTER_AUTH_URL` | URL base da API (ex: `http://localhost:3000`) |

Para gerar um secret seguro:
```bash
npx @better-auth/cli secret
```

## 📦 Executando o Projeto

```bash
# Desenvolvimento (com hot reload)
pnpm dev

# A API estará disponível em http://localhost:3000
```

## 🗄️ Banco de Dados

```bash
# Aplicar migrações
pnpm prisma migrate dev

# Gerar cliente Prisma (após alterar o schema)
pnpm prisma generate
```

## 📚 Documentação da API

Acesse a documentação interativa em:

- **http://localhost:3000/docs**

Inclui:
- **Coach API** – Rotas da aplicação (Swagger/OpenAPI)
- **Auth API** – Rotas de autenticação (Better Auth)

## 📁 Estrutura do Projeto

```
├── prisma/
│   ├── schema.prisma      # Schema do banco
│   └── migrations/        # Migrações
├── src/
│   ├── index.ts           # Entrada da aplicação
│   ├── lib/
│   │   └── auth.ts        # Configuração Better Auth
│   └── generated/
│       └── prisma/        # Cliente Prisma gerado
├── prisma.config.ts       # Config Prisma 7
└── package.json
```

## 🔐 Autenticação

Autenticação via **Better Auth** com email e senha. Endpoints em `/api/auth/*`:

- `POST /api/auth/sign-up/email` – Cadastro
- `POST /api/auth/sign-in/email` – Login
- Entre outros (ver docs em `/docs`)

## 📝 Convenção de Commits

O projeto usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` – Nova funcionalidade
- `fix:` – Correção de bug
- `docs:` – Documentação
- `chore:` – Tarefas diversas

## 📄 Licença

ISC
