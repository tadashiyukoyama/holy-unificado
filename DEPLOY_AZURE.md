# Deploy rápido no Azure (App Service)

## 1) Azure Database for PostgreSQL (Flexible Server)
- Crie um servidor Postgres.
- Crie um database (ex.: `holywater`).
- Pegue a connection string.

## 2) App Service (Linux / Node 20)
- Criar Web App (Linux, Node 20).
- Em Configuration -> Application settings, adicione:

DATABASE_URL = postgres://...
PG_SSL = true
JWT_SECRET = (chave forte)
RUN_MIGRATIONS = true

(opcional)
OPENAI_API_KEY = ...
OPENAI_MODEL = gpt-4o-mini

## 3) GitHub Actions (deploy)
No GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret:

AZURE_WEBAPP_NAME = nome do App Service
AZURE_WEBAPP_PUBLISH_PROFILE = (baixar no Portal: App Service -> Get publish profile)
DATABASE_URL = (mesma string)
JWT_SECRET = (mesma chave)

Depois faça push na branch main.
