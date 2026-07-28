# Multi-Stage Dockerfile for React/Vite Frontend

# Stage 1: Build & Development environment
FROM node:20-alpine as development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage 2: Production Build
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 3: Production Nginx Server
FROM nginx:1.25-alpine as production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ../infrastructure/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
