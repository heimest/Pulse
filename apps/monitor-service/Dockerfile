FROM node:24-bookworm-slim AS base
WORKDIR /app

FROM base AS builder
RUN npm install --global pnpm@12.11.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/monitor-service/package.json apps/monitor-service/package.json
RUN pnpm install --frozen-lockfile
COPY apps/monitor-service/tsconfig.json apps/monitor-service/tsconfig.json
COPY apps/monitor-service/src apps/monitor-service/src
RUN pnpm --filter @pulse/monitor-service build \
    && pnpm --filter @pulse/monitor-service --prod deploy --legacy /out

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=builder /out/package.json ./package.json
COPY --from=builder /out/node_modules ./node_modules
COPY --from=builder /out/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
