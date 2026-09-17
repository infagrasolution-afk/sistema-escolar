# =============================================================================
# DOCKERFILE MULTI-STAGE FOR REACT FRONTEND
# =============================================================================

# --- STAGE 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

# --- STAGE 2: Serve con Nginx ---
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
