#!/bin/bash

# 启动脚本 - 同时启动后端和前端服务

set -e

# 从config.json读取应用名称
APP_NAME=$(python3 -c "import json; print(json.load(open('config.json'))['app']['appName'])" 2>/dev/null || echo "MLServer_Dash")

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
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_info "=========================================="
print_info "   $APP_NAME - 启动脚本"
print_info "=========================================="
echo ""

# ==================== 后端启动 ====================

print_info "检查后端依赖..."

# 检查Python
if ! command_exists python3; then
    print_error "未找到 Python3，请先安装 Python 3.8+"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "backend/venv" ]; then
    print_warning "后端虚拟环境不存在，正在创建..."
    cd backend
    python3 -m venv venv
    cd ..
    print_success "虚拟环境创建完成"
fi

# 激活虚拟环境并安装依赖
print_info "安装后端依赖..."
source backend/venv/bin/activate
pip install -q -r backend/requirements.txt
print_success "后端依赖安装完成"

# 启动后端
print_info "启动后端服务 (http://localhost:8000)..."
cd backend
python main.py &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 2

# 检查后端是否启动成功
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "后端启动失败"
    exit 1
fi

print_success "后端服务已启动 (PID: $BACKEND_PID)"

# ==================== 前端启动 ====================

print_info "检查前端依赖..."

# 检查Node.js
if ! command_exists node; then
    print_error "未找到 Node.js，请先安装 Node.js 18+"
    kill $BACKEND_PID
    exit 1
fi

# 检查npm
if ! command_exists npm; then
    print_error "未找到 npm，请先安装 npm"
    kill $BACKEND_PID
    exit 1
fi

# 检查node_modules
if [ ! -d "frontend/node_modules" ]; then
    print_warning "前端依赖未安装，正在安装..."
    print_info "这可能需要几分钟时间，请耐心等待..."
    cd frontend
    npm install
    cd ..
    print_success "前端依赖安装完成"
fi

# 启动前端
print_info "启动前端服务 (http://localhost:5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# 等待前端启动
sleep 2

# 检查前端是否启动成功
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "前端启动失败"
    kill $BACKEND_PID
    exit 1
fi

print_success "前端服务已启动 (PID: $FRONTEND_PID)"

# ==================== 启动完成 ====================

echo ""
print_info "=========================================="
print_success "   $APP_NAME 启动完成！"
print_info "=========================================="
echo ""
echo -e "${GREEN}后端 API:${NC}   http://localhost:8000"
echo -e "${GREEN}前端界面:${NC}   http://localhost:5173"
echo -e "${GREEN}API 文档:${NC}   http://localhost:8000/docs"
echo ""
print_info "按 Ctrl+C 停止所有服务"

# 捕获退出信号
cleanup() {
    print_info "正在停止服务..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    print_success "所有服务已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 保持脚本运行
wait
