FROM node:24-bookworm-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530 AS base
WORKDIR /app

FROM base AS builder
RUN npm install --global pnpm@12.11.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/composition-service/package.json apps/composition-service/package.json
RUN pnpm install --frozen-lockfile
COPY apps/composition-service/tsconfig.json apps/composition-service/tsconfig.json
COPY apps/composition-service/src apps/composition-service/src
RUN pnpm --filter @pulse/composition-service build \
    && pnpm --filter @pulse/composition-service --prod deploy --legacy /out

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=builder /out/package.json ./package.json
COPY --from=builder /out/node_modules ./node_modules
COPY --from=builder /out/dist ./dist
USER node
EXPOSE 3002
CMD ["node", "dist/server.js"]
