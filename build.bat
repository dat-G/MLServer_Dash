@echo off
setlocal enabledelayedexpansion

REM ========================================
REM   MLServer_Dash 构建脚本 (Windows)
REM ========================================

echo.
echo ========================================
echo   MLServer_Dash 构建脚本
echo ========================================
echo.

REM 检查 npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm 未找到，请先安装 Node.js
    echo   下载地址: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
    exit /b 1
)

REM 检查 go
where go >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] go 未找到，请先安装 Go
    echo   下载地址: https://go.dev/dl/
    exit /b 1
)

echo [INFO] 依赖检查通过
echo.

REM ========================================
REM [1/4] 构建前端
REM ========================================
echo ========================================
echo [INFO] [1/4] 构建前端...
echo ========================================

cd frontend

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo [WARNING] node_modules 未找到，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] 前端依赖安装失败
        cd ..
        exit /b 1
    )
)

call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] 前端构建失败
    cd ..
    exit /b 1
)

cd ..
echo [SUCCESS] 前端构建完成
echo.

REM ========================================
REM [2/4] 复制前端到后端嵌入目录
REM ========================================
echo ========================================
echo [INFO] [2/4] 复制前端到后端嵌入目录...
echo ========================================

if exist "backend\internal\embed\dist" (
    rmdir /s /q "backend\internal\embed\dist"
)

xcopy /s /e /i /y "frontend\dist" "backend\internal\embed\dist" >nul
if %errorlevel% neq 0 (
    echo [ERROR] 复制前端文件失败
    exit /b 1
)

echo [SUCCESS] 前端文件已复制到 backend\internal\embed\dist
echo.

REM ========================================
REM [3/4] 下载 Go 依赖
REM ========================================
echo ========================================
echo [INFO] [3/4] 下载 Go 依赖...
echo ========================================

cd backend
go mod download
if %errorlevel% neq 0 (
    echo [ERROR] Go 依赖下载失败
    cd ..
    exit /b 1
)

echo [SUCCESS] Go 依赖下载完成
cd ..
echo.

REM ========================================
REM [4/4] 构建后端
REM ========================================
echo ========================================
echo [INFO] [4/4] 构建后端...
echo ========================================

cd backend

REM 获取时间戳（用于版本信息）
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/: " %%a in ('time /t') do (set mytime=%%a%%b)
set TIMESTAMP=%mydate%-%mytime%

REM 构建参数
set LDFLAGS=-s -w -X main.Version=%TIMESTAMP%
set OUTPUT_NAME=..\mlserver-dash-backend.exe

echo [INFO] 构建目标: windows/amd64
echo [INFO] 输出文件: %OUTPUT_NAME%

go build -o %OUTPUT_NAME% -ldflags "%LDFLAGS%" ./cmd/main.go
if %errorlevel% neq 0 (
    echo [ERROR] 后端构建失败
    cd ..
    exit /b 1
)

cd ..
echo [SUCCESS] 后端构建完成
echo.

REM ========================================
REM 构建完成
REM ========================================
echo ========================================
echo [SUCCESS] 构建成功！
echo ========================================
echo.
echo 输出文件: mlserver-dash-backend.exe
echo.
echo 运行方式:
echo   mlserver-dash-backend.exe
echo.
echo 或使用配置文件:
echo   mlserver-dash-backend.exe -config config.json
echo.
echo 访问地址: http://localhost:8000
echo ========================================

endlocal
