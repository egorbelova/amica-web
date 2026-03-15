FROM node:25-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Corepack is unavailable in this base image; install pnpm directly.
RUN npm install -g pnpm@latest

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch --frozen-lockfile --prefer-offline

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --unsafe-perm --prefer-offline

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm run build:ignore

FROM fholzer/nginx-brotli:latest

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]