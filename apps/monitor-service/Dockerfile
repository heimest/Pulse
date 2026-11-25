FROM node:24-bookworm-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530 AS base
WORKDIR /app

FROM base AS builder
RUN npm install --global pnpm@12.11.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/monitor-service/package.json apps/monitor-service/package.json
RUN pnpm install --frozen-lockfile
COPY packages/contracts/proto packages/contracts/proto
COPY apps/monitor-service/tsconfig.json apps/monitor-service/tsconfig.json
COPY apps/monitor-service/src apps/monitor-service/src
RUN pnpm --filter @pulse/monitor-service build \
    && pnpm --filter @pulse/monitor-service --prod deploy --legacy /out \
    && cp packages/contracts/proto/pulse.proto /out/pulse.proto

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=builder /out/package.json ./package.json
COPY --from=builder /out/node_modules ./node_modules
COPY --from=builder /out/dist ./dist
COPY --from=builder /out/pulse.proto ./pulse.proto
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
