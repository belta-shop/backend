# INIT Node and pnpm
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# Install Production Dependencies
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod

# Build App
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
WORKDIR /app
COPY . .
RUN pnpm build

# Add dist and prod-deps to final image
FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
EXPOSE 5006
CMD [ "pnpm", "start" ]