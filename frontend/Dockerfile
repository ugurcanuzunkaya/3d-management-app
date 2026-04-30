FROM oven/bun:latest as build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Serve with a simple static server or use Nginx
FROM oven/bun:latest as run

WORKDIR /app

COPY --from=build /app/dist ./dist
RUN bun add -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
