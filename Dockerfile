# Docker Panel - Production Dockerfile
FROM node:20-alpine AS builder

# 安装编译 better-sqlite3 需要的工具
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖
RUN npm ci

# 复制源码
COPY . .

# 创建数据目录（构建时需要）
RUN mkdir -p data

# 构建
RUN npm run build

# --- 生产镜像 ---
FROM node:20-alpine AS runner

# 安装运行时依赖
RUN apk add --no-cache wget

WORKDIR /app

# 复制构建产物和必要文件
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 创建数据目录
RUN mkdir -p data

EXPOSE 3000

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
