FROM node:20-alpine

# Install pnpm 10 (matches the lockfile)
RUN npm install -g pnpm@10.26.1

WORKDIR /app

# Copy everything (needed for monorepo workspace resolution)
COPY . .

# Install all workspace deps from the monorepo root
RUN pnpm install --no-frozen-lockfile

# Build the API server
RUN pnpm --filter @workspace/api-server run build

WORKDIR /app/artifacts/api-server

EXPOSE 3000

CMD ["node", "dist/index.mjs"]
