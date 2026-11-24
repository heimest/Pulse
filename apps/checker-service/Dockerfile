FROM node:24-bookworm-slim AS base
WORKDIR /app

FROM base AS builder
RUN npm install --global pnpm@12.11.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/checker-service/package.json apps/checker-service/package.json
RUN pnpm install --frozen-lockfile
COPY apps/checker-service/tsconfig.json apps/checker-service/tsconfig.json
COPY apps/checker-service/src apps/checker-service/src
RUN pnpm --filter @pulse/checker-service build \
    && pnpm --filter @pulse/checker-service --prod deploy --legacy /out

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=builder /out/package.json ./package.json
COPY --from=builder /out/node_modules ./node_modules
COPY --from=builder /out/dist ./dist
USER node
EXPOSE 3001
CMD ["node", "dist/server.js"]
