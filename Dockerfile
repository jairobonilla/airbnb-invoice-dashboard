# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Compile backend and generate Prisma client
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./
RUN npm ci
COPY backend/ ./backend/
COPY prisma/ ./prisma/
RUN npx prisma generate --config prisma.config.ts
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
# Copy node_modules from build stage (includes generated Prisma client)
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /frontend/dist ./frontend/dist
COPY prisma/ ./prisma/
EXPOSE 8080
CMD ["node", "dist/main.js"]
