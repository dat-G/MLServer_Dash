# ============================================
# 阶段 1: 构建前端
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# 复制前端源码（从项目根目录的 frontend/）
COPY frontend/package*.json ./
COPY frontend/vite.config.js ./
COPY frontend/index.html ./
COPY frontend/src ./src
COPY frontend/postcss.config.js ./
COPY frontend/tailwind.config.js ./

# 安装依赖并构建
RUN npm ci
RUN npm run build

# ============================================
# 阶段 2: 构建客户端（跨平台）
# ============================================
FROM golang:1.24-alpine AS client-builder

WORKDIR /client

# 安装构建依赖
RUN apk add --no-cache git gcc musl-dev

# 复制 client go mod 文件
COPY client/go.mod ./
RUN go mod download

# 复制 client 源代码
COPY client/*.go ./
COPY client/internal ./internal

# 构建跨平台客户端
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o mlserver-client-linux-amd64 -ldflags="-s -w" .
RUN CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -o mlserver-client-darwin-amd64 -ldflags="-s -w" .
RUN CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -o mlserver-client-darwin-arm64 -ldflags="-s -w" .

# ============================================
# 阶段 3: 构建后端（嵌入前端和客户端）
# ============================================
FROM golang:1.24-alpine AS backend-builder

WORKDIR /build

# 安装构建依赖
RUN apk add --no-cache git gcc musl-dev

# 复制 go mod 文件
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# 复制后端源代码
COPY backend/cmd ./cmd
COPY backend/internal ./internal

# 从前端构建阶段复制 dist 到嵌入目录
COPY --from=frontend-builder /frontend/dist ./internal/embed/dist

# 从客户端构建阶段复制二进制文件到嵌入目录
RUN mkdir -p ./internal/embed/binaries
COPY --from=client-builder /client/mlserver-client-linux-amd64 ./internal/embed/binaries/
COPY --from=client-builder /client/mlserver-client-darwin-amd64 ./internal/embed/binaries/
COPY --from=client-builder /client/mlserver-client-darwin-arm64 ./internal/embed/binaries/

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -o mlserver-dash-backend ./cmd/main.go

# ============================================
# 阶段 4: 运行镜像
# ============================================
FROM alpine:latest

WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache ca-certificates tzdata

# 从构建阶段复制二进制文件
COPY --from=backend-builder /build/mlserver-dash-backend .

# 暴露端口
EXPOSE 8000

# 运行应用
CMD ["./mlserver-dash-backend"]
