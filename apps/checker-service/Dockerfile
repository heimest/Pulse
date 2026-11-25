FROM node:25-bookworm-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370 AS base
WORKDIR /app

FROM base AS builder
RUN npm install --global pnpm@12.11.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/checker-service/package.json apps/checker-service/package.json
RUN pnpm install --frozen-lockfile
COPY packages/contracts/proto packages/contracts/proto
COPY apps/checker-service/tsconfig.json apps/checker-service/tsconfig.json
COPY apps/checker-service/src apps/checker-service/src
RUN pnpm --filter @pulse/checker-service build \
    && pnpm --filter @pulse/checker-service --prod deploy --legacy /out \
    && cp packages/contracts/proto/pulse.proto /out/pulse.proto

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=builder /out/package.json ./package.json
COPY --from=builder /out/node_modules ./node_modules
COPY --from=builder /out/dist ./dist
COPY --from=builder /out/pulse.proto ./pulse.proto
USER node
EXPOSE 3001 50051
CMD ["node", "dist/server.js"]
