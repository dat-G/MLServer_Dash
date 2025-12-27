#!/bin/bash

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 未找到，请先安装"
        return 1
    fi
    return 0
}

# 获取版本信息
get_version() {
    if [ -f "backend/go.mod" ]; then
        grep "go 1\." backend/go.mod | sed 's/go //'
    else
        echo "unknown"
    fi
}

echo "========================================"
echo "  MLServer_Dash 构建脚本"
echo "========================================"
echo

# 获取 Go 版本
GO_VERSION=$(get_version)
print_info "要求的 Go 版本: ${GO_VERSION}"

# 检查依赖
print_info "检查构建依赖..."
MISSING_DEPS=0

if ! check_command "npm"; then
    MISSING_DEPS=1
fi

if ! check_command "go"; then
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "缺少必要的依赖，请先安装后再试"
    echo "  - npm: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm"
    echo "  - go: https://go.dev/dl/"
    exit 1
fi

print_success "依赖检查通过"
echo

# 步骤 1: 构建前端
echo "========================================"
print_info "[1/4] 构建前端..."
echo "========================================"

cd frontend

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    print_warning "node_modules 未找到，正在安装依赖..."
    if ! npm install; then
        print_error "前端依赖安装失败"
        exit 1
    fi
fi

if ! npm run build; then
    print_error "前端构建失败"
    exit 1
fi

cd ..
print_success "前端构建完成"
echo

# 步骤 2: 复制前端到后端
echo "========================================"
print_info "[2/4] 复制前端到后端嵌入目录..."
echo "========================================"

rm -rf backend/internal/embed/dist
if ! cp -r frontend/dist backend/internal/embed/dist; then
    print_error "复制前端文件失败"
    exit 1
fi

print_success "前端文件已复制到 backend/internal/embed/dist"
echo

# 步骤 3: 下载 Go 依赖
echo "========================================"
print_info "[3/4] 下载 Go 依赖..."
echo "========================================"

cd backend
if ! go mod download; then
    print_error "Go 依赖下载失败"
    exit 1
fi

print_success "Go 依赖下载完成"
cd ..
echo

# 步骤 4: 构建后端
echo "========================================"
print_info "[4/4] 构建后端..."
echo "========================================"

cd backend

# 获取操作系统信息
GOOS=$(go env GOOS)
GOARCH=$(go env GOARCH)
OUTPUT_NAME="../mlserver-dash-backend"

# 添加可执行文件后缀（Windows）
if [ "$GOOS" = "windows" ]; then
    OUTPUT_NAME="../mlserver-dash-backend.exe"
fi

# 构建参数
LDFLAGS="-s -w -X main.Version=$(date +%Y%m%d-%H%M%S)"
BUILD_FLAGS="-o $OUTPUT_NAME -ldflags '$LDFLAGS' ./cmd/main.go"

print_info "构建目标: ${GOOS}/${GOARCH}"
print_info "输出文件: ${OUTPUT_NAME}"

if eval "go build $BUILD_FLAGS"; then
    cd ..
    print_success "后端构建完成"
else
    cd ..
    print_error "后端构建失败"
    exit 1
fi
echo

# 构建完成
echo "========================================"
print_success "构建成功！"
echo "========================================"
echo
echo "输出文件: ${OUTPUT_NAME}"
echo
echo "运行方式:"
echo "  ./${OUTPUT_NAME}"
echo
echo "或使用配置文件:"
echo "  ./${OUTPUT_NAME} -config config.json"
echo
echo "访问地址: http://localhost:8000"
echo "========================================"
