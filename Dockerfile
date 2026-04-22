# ============================================
# Stage 1: Build frontend (Svelte SPA)
# ============================================
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY shared/ /app/shared/
COPY frontend/ ./
RUN npm run build

# ============================================
# Stage 2: Backend production dependencies
# ============================================
FROM node:22-alpine AS backend-deps

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# ============================================
# Stage 3: Build backend (TypeScript → JS)
# ============================================
FROM node:22-alpine AS backend-build

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY shared/ /app/shared/
COPY backend/ ./
RUN npm run build

# ============================================
# Stage 4: Production image
# ============================================
FROM node:22-alpine AS production

WORKDIR /app/backend

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/data ./data
COPY --from=backend-build /app/backend/package.json ./
COPY --from=backend-build /app/shared /app/shared
COPY --from=frontend-build /app/frontend/dist ./public

USER nodejs

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
