FROM node:24-bookworm-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530 AS builder
WORKDIR /app
RUN npm install --global pnpm@12.11.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json apps/frontend/package.json
RUN pnpm install --frozen-lockfile
COPY apps/frontend apps/frontend
RUN pnpm --filter @pulse/frontend build

FROM nginx:1.29-alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de AS runtime
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
