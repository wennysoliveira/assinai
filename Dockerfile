# =============================================================
# assinAI — Dockerfile para EasyPanel / self-hosted
# =============================================================
# Estágio 1: Builder — instala deps e compila frontend + backend
# =============================================================
FROM node:22-slim AS builder

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copia arquivos de configuração do workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copia código-fonte de todas as libs e artifacts
COPY lib/           ./lib/
COPY artifacts/api-server/         ./artifacts/api-server/
COPY artifacts/subscriptions-app/  ./artifacts/subscriptions-app/

# Instala todas as dependências do workspace
RUN pnpm install --no-frozen-lockfile

# Compila o frontend (Vite)
# BASE_PATH=/ para deploy self-hosted (sem sub-caminho)
ENV BASE_PATH=/
ENV PORT=3000
ENV NODE_ENV=production
RUN pnpm --filter @workspace/subscriptions-app run build

# Compila o backend (esbuild → bundle único)
RUN pnpm --filter @workspace/api-server run build

# =============================================================
# Estágio 2: Produção — imagem mínima com apenas os artefatos
# =============================================================
FROM node:22-slim AS production

WORKDIR /app

# Backend compilado (bundle único — sem node_modules necessário)
COPY --from=builder /app/artifacts/api-server/dist ./dist

# Frontend compilado (arquivos estáticos servidos pelo Express)
COPY --from=builder /app/artifacts/subscriptions-app/dist/public ./public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
