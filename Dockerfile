FROM node:18-alpine AS base

WORKDIR /app

RUN apk add --no-cache python3 make g++ git

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/admin/package.json ./apps/admin/
COPY apps/web/package.json ./apps/web/
COPY packages ./packages

RUN pnpm install

COPY . .

FROM base AS admin-build
RUN pnpm run build --filter=admin

FROM base AS web-build
RUN pnpm run build --filter=web

FROM nginx:alpine AS admin
COPY --from=admin-build /app/apps/admin/dist /usr/share/nginx/admin
COPY ./apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM nginx:alpine AS web
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/web
COPY ./apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]