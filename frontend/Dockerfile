FROM oven/bun:latest AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Accept VITE_API_BASE_URL as an argument and expose it to the Vite build
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN bun run build

# Serve with Nginx
FROM nginx:alpine AS run

# Copy the custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built app to Nginx's web root
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Fallback: Serve with Bun (Uncomment the lines below and comment Nginx section above to use)
# FROM oven/bun:latest AS run
# WORKDIR /app
# COPY --from=build /app/dist ./dist
# RUN bun add -g serve
# EXPOSE 3000
# CMD ["serve", "-s", "dist", "-l", "3000"]
