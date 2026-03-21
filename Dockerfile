# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend .
RUN npm run build

# ── Stage 2: Build backend ───────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend .
RUN npm run build

# ── Stage 3: Production image ────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Backend compiled output + dependencies
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json ./

# Frontend build placed where Express expects it
# __dirname = /app/dist, ../frontend/dist = /app/frontend/dist
COPY --from=frontend-builder /frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV FRONTEND_DIST_PATH=/app/frontend/dist

EXPOSE 5000
CMD ["node", "dist/server.js"]
