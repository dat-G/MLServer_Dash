.PHONY: build build-embed run clean test docker-build docker-run

# 变量
BINARY_NAME=../mlserver-dash-backend
GO=go
GOFLAGS=-v

# 构建（仅后端，不嵌入前端）
build:
	$(GO) build $(GOFLAGS) -o $(BINARY_NAME) ./cmd/main.go

# 构建嵌入前端的完整版本
build-embed:
	@echo "Building frontend..."
	cd ../frontend && npm run build
	@echo "Copying frontend to backend..."
	rm -rf internal/embed/dist
	cp -r ../frontend/dist internal/embed/dist
	@echo "Building backend with embedded frontend..."
	$(GO) build $(GOFLAGS) -o $(BINARY_NAME) ./cmd/main.go
	@echo "Build complete: $(BINARY_NAME)"

# 运行
run:
	$(GO) run ./cmd/main.go

# 清理
clean:
	$(GO) clean
	rm -f $(BINARY_NAME)
	rm -rf internal/embed/dist

# 测试
test:
	$(GO) test -v ./...

# 下载依赖
deps:
	$(GO) mod download
	$(GO) mod tidy

# 构建 Docker 镜像
docker-build:
	docker build -t mlserver-dash-backend:latest .

# 运行 Docker 容器
docker-run:
	docker run -p 8000:8000 --rm mlserver-dash-backend:latest

# 格式化代码
fmt:
	$(GO) fmt ./...

# 代码检查
vet:
	$(GO) vet ./...
