# Holy Water • Reservas (Azure)

Painel web (React + Vite) + API (Node/Express) em um único serviço (mesmo host).  
Inclui:

- Mapa do salão com mesas arrastáveis (drag da mesa)
- Drag & drop: arrastar cliente da fila ou reserva e soltar na mesa
- Reservas / Fila / Clientes / Cupons / Eventos / Configurações
- Suporte (tools + varredura + checklist + chat com OpenAI opcional)

## Rodar local

Pré-requisitos: Node 20+, Docker.

```bash
docker compose up -d
cp .env.example .env
npm install
npm run dev
```

Abra: http://localhost:3000

Login padrão (seed automático):
- admin@local / admin123

## Build + start (prod)

```bash
npm run build
npm start
```

## Banco de dados

- Postgres via `DATABASE_URL`
- Migrações: quando `RUN_MIGRATIONS=true`, o servidor executa `drizzle` automaticamente no startup.

## Deploy no Azure via GitHub

Arquitetura simples: **1 App Service (Linux / Node)** servindo API + Web.

1. Crie um App Service (Linux / Node 20).
2. Configure variáveis de ambiente (Configuration -> Application settings):
   - DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB
   - PG_SSL=true
   - JWT_SECRET=uma-chave-forte
   - RUN_MIGRATIONS=true
   - (opcional) OPENAI_API_KEY=...
3. Em **Deployment Center**, conecte o GitHub repo.

Dica: em App Service, habilite build durante deploy:
- `SCM_DO_BUILD_DURING_DEPLOYMENT=true`

### Azure Database for PostgreSQL
Use connection string com SSL (Azure exige).  
Se você já usa `sslmode=require` na URL, mantenha também `PG_SSL=true`.

## WhatsApp
Endpoints existem, mas a integração está behind feature flag:
- WHATSAPP_ENABLED=false (default)
Quando Meta liberar e você quiser integrar, a base já está separada em `/api/whatsapp/*`.
