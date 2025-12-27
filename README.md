# MLServer_Dash

<div align="center">

![MLServer_Dash](https://img.shields.io/badge/MLServer_Dash-v1.0.0-blue?style=for-the-badge)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go)
![React](https://img.shields.io/badge/React-18+-cyan?style=for-the-badge&logo=react)
![Gin](https://img.shields.io/badge/Gin-Latest-00ADD8?style=for-the-badge&logo=go)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**现代化实时服务器监控面板，专为深度学习服务器监控而设计**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [配置说明](#-配置说明) • [API 文档](#-api-文档)

</div>

---

## 简介

<div align="center">

![Dashboard Preview](./preview.png)

</div>

**MLServer_Dash** 是一款专为机器学习工作站和生产服务器设计的综合服务器监控解决方案。它采用赛博辉光风格的界面，提供实时的系统资源可视化，包括 CPU、内存、磁盘、网络和 NVIDIA GPU 指标。

## ✨ 功能特性

### 硬件监控
- **CPU 监控** ⚡ - 实时显示每核心利用率，支持多核/多线程展示
- **内存监控** 🧠 - 显示内存使用情况和型号信息
- **物理磁盘监控** 💾 - 智能检测物理磁盘，显示型号和容量
- **NVIDIA GPU 监控** 🎮 - 支持利用率、温度、功耗/TDP、显存等指标
- **网络监控** 🌐 - 双折线图展示上传/下载速度，显示网卡型号和 IP 地址

### 容器管理
- **Docker 管理** 🐳 - 查看运行中的容器，支持启动/停止/重启操作

### 用户体验
- **响应式设计** 📱 - 完美适配桌面和移动设备
- **赛博朋克主题** 🌃 - 炫酷的霓虹灯风格界面
- **零配置启动** 🚀 - 开箱即用，自动检测系统硬件

## 🛠 技术栈

### 后端
| 技术 | 说明 |
|------|------|
| ![Gin](https://img.shields.io/badge/Gin-Latest-00ADD8?style=flat-square) | 高性能 Web 框架 |
| ![gopsutil](https://img.shields.io/badge/gopsutil-latest-blue?style=flat-square) | 跨平台系统监控 |
| ![go-nvml](https://img.shields.io/badge/go--nvml-latest-green?style=flat-square) | NVIDIA GPU 监控 |
| ![docker](https://img.shields.io/badge/docker-latest-blue?style=flat-square) | Docker 容器管理 |

### 前端
| 技术 | 说明 |
|------|------|
| ![React](https://img.shields.io/badge/React-18+-cyan?style=flat-square) | UI 框架 |
| ![Vite](https://img.shields.io/badge/Vite-Latest-purple?style=flat-square) | 新一代前端工具 |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=flat-square) | 原子化 CSS 框架 |
| ![lucide-react](https://img.shields.io/badge/lucide-latest-orange?style=flat-square) | 图标库 |
| ![Canvas](https://img.shields.io/badge/Canvas-API-FF6B6B?style=flat-square) | 自定义折线图 |

## 📋 前置要求

### 手动安装方式
- **Go**: 1.21 或更高版本
- **Node.js**: 16.x 或更高版本

### Docker 安装方式
- **Docker**: 20.x 或更高版本
- **Docker Compose**: v2.x 或更高版本

### 可选项
- **NVIDIA GPU** - 用于 GPU 监控
- **NVIDIA Container Toolkit** - 用于 Docker 中的 GPU 监控

## 🚀 快速开始

### 方式一：使用预编译二进制文件（推荐）

下载对应平台的二进制文件，与 `config.json` 放在同一目录：

```bash
# Windows
mlserver-dash-backend.exe

# Linux/macOS
./mlserver-dash-backend
```

访问地址：`http://localhost:8000`

---

### 方式二：从源码构建

#### Windows
```bash
build.bat
```

#### Linux/macOS
```bash
chmod +x build.sh
./build.sh
```

运行编译后的可执行文件：
```bash
./mlserver-dash-backend
```

访问地址：`http://localhost:8000`

---

### 方式三：Docker Compose

```bash
# 克隆仓库
git clone https://github.com/dat-G/MLServer_Dash.git
cd MLServer_Dash

# (可选) 配置端口
cp .env.example .env
# 编辑 .env 文件自定义端口

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问地址：`http://localhost:8000`

> **注意**: Docker 中使用 GPU 监控需要安装 [NVIDIA Container Toolkit](https://github.com/NVIDIA/nvidia-docker)

## ⚙️ 配置说明

所有配置集中在项目根目录的 `config.json` 文件中：

```json
{
  "app": {
    "appName": "MLServer_Dash",
    "githubUrl": "https://github.com/dat-G/MLServer_Dash"
  },
  "server": {
    "host": "0.0.0.0",
    "port": 8000,
    "corsOrigins": ["*"],
    "corsMethods": ["GET", "POST", "PUT", "DELETE"],
    "pollInterval": 2000,
    "historySize": 30
  }
}
```

### 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `app.appName` | string | `"MLServer_Dash"` | 应用名称（用于界面和 API） |
| `app.githubUrl` | string | GitHub URL | 项目仓库链接 |
| `server.host` | string | `"0.0.0.0"` | 服务绑定地址 |
| `server.port` | number | `8000` | 服务端口 |
| `server.corsOrigins` | array | `["*"]` | 允许的 CORS 来源（`["*"]` 表示允许所有） |
| `server.pollInterval` | number | `2000` | 前端轮询间隔（毫秒） |
| `server.historySize` | number | `30` | 图表历史数据点数量 |

## 📡 API 文档

### 基础地址
```
http://localhost:8000
```

### 接口列表

#### 获取系统信息
```http
GET /api/system
```

返回完整的系统指标信息。

**响应示例：**
```json
{
  "hostname": "ml-server-01",
  "os": "Linux 6.14.0-37-generic",
  "distro": {
    "name": "Ubuntu 24.04 LTS",
    "id": "ubuntu"
  },
  "cpu": {
    "brand": "AMD Ryzen 9 7950X 16-Core Processor",
    "percent": 25.4,
    "cores": 16,
    "threads": 32,
    "per_core_percent": [20.5, 18.2, 22.1, ...]
  },
  "memory": {
    "total": 68719476736,
    "used": 34359738368,
    "percent": 50.0,
    "model": "Kingston Fury Beast"
  },
  "gpu": [
    {
      "name": "NVIDIA GeForce RTX 4090",
      "utilization": 75.0,
      "temperature": 65,
      "power_usage": 350,
      "power_limit": 450,
      "enforced_power_limit": 450,
      "power_default_limit": 450
    }
  ],
  "network": [
    {
      "name": "eth0",
      "speed_up": 1024000,
      "speed_down": 2048000
    }
  ]
}
```

#### 获取 Docker 容器
```http
GET /api/docker
```

返回运行中的 Docker 容器列表。

#### 容器操作
```http
POST /api/docker/{container_id}/action?action={action}
```

控制 Docker 容器。

**参数：**
- `container_id` (路径) - 容器 ID 或名称
- `action` (查询) - 操作类型: `start` | `stop` | `restart`

#### 健康检查
```http
GET /api/health
```

检查 API 健康状态和可用功能。

## 📁 项目结构

```
MLServer_Dash/
├── backend/
│   ├── cmd/
│   │   └── main.go          # 应用入口
│   ├── internal/
│   │   ├── config/          # 配置管理
│   │   ├── docker/          # Docker 管理
│   │   ├── embed/           # 嵌入的前端静态文件
│   │   ├── handlers/        # HTTP 处理器
│   │   ├── middleware/      # 中间件
│   │   ├── models/          # 数据模型
│   │   ├── monitor/         # 系统监控
│   │   └── router/          # 路由设置
│   ├── Dockerfile           # 多阶段构建（前端+后端）
│   ├── go.mod               # Go 模块
│   ├── Makefile             # 构建脚本
│   └── .dockerignore        # Docker 构建排除
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # React 主组件
│   │   └── main.jsx        # 入口文件
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── config.json              # 统一配置文件
├── docker-compose.yml       # Docker Compose 编排
├── build.bat                # Windows 构建脚本
├── build.sh                 # Linux/macOS 构建脚本
├── .env.example            # 环境变量模板
├── LICENSE                 # MIT 许可证
├── preview.png             # 预览图
└── README.md
```

## 💻 开发指南

### 开发模式（前后端分离）

```bash
# 终端 1: 启动后端
cd backend
go run ./cmd/main.go

# 终端 2: 启动前端
cd frontend
npm install
npm run dev
```

前端开发服务器：`http://localhost:5173`
后端 API：`http://localhost:8000`

### 生产构建

#### Windows
```bash
build.bat
```

#### Linux/macOS
```bash
chmod +x build.sh
./build.sh
```

生成的可执行文件包含完整应用，直接运行即可。

### 使用 Makefile

```bash
cd backend
make build-embed    # 构建嵌入前端的完整版本
make run           # 运行开发服务器
make clean         # 清理构建文件
```

### 代码规范
- **Go**: 遵循 Effective Go，使用 `gofmt` 格式化
- **JavaScript/React**: 遵循 Airbnb 规范
- **提交信息**: 使用约定式提交 (`feat:`, `fix:`, `docs:` 等)

## 🌐 部署

### 单文件部署（推荐）

```bash
# 构建
build.bat          # Windows
./build.sh         # Linux/macOS

# 部署（将以下文件复制到目标服务器）
# - mlserver-dash-backend (可执行文件)
# - config.json (配置文件)

# 运行
./mlserver-dash-backend
```

### Systemd 服务 (Linux)

创建 `/etc/systemd/system/mlserver-dash.service`：

```ini
[Unit]
Description=MLServer_Dash
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/mlserver-dash
ExecStart=/opt/mlserver-dash/mlserver-dash-backend
Restart=always

[Install]
WantedBy=multi-user.target
```

启用并启动：
```bash
sudo systemctl enable mlserver-dash
sudo systemctl start mlserver-dash
```

## 🔧 故障排除

### GPU 不显示
- 验证 NVIDIA 驱动: `nvidia-smi`
- 确保 NVIDIA 驱动已正确安装
- 检查后端日志是否有 NVML 相关错误

### Docker 容器不显示
- 检查 Docker 服务: `systemctl status docker`
- 添加用户到 docker 组: `sudo usermod -aG docker $USER`
- 重新登录使组权限生效

### CORS 错误
- 更新 `config.json` 中的 `corsOrigins`
- 生产环境建议指定具体来源而非 `["*"]`

### 端口被占用
```bash
# Linux/macOS
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## 🤝 贡献

欢迎贡献代码！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Gin](https://gin-gonic.com/) - Web 框架
- [gopsutil](https://github.com/shirou/gopsutil) - 系统监控库
- [go-nvml](https://github.com/NVIDIA/go-nvml) - NVIDIA GPU 监控
- [React](https://react.dev/) - UI 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [lucide](https://lucide.dev/) - 图标库

---

<div align="center">

**为 ML 和 DevOps 社区精心打造**

[⬆ 返回顶部](#mlserver_dash)

</div>
