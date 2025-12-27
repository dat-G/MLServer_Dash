@echo off
echo ========================================
echo Building MLServer_Dash Embedded
echo ========================================
echo.

echo [1/3] Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    exit /b 1
)
cd ..
echo Frontend build complete!
echo.

echo [2/3] Copying frontend to backend...
if exist "backend\internal\embed\dist" rmdir /s /q "backend\internal\embed\dist"
xcopy /s /e /i /y "frontend\dist" "backend\internal\embed\dist"
if %errorlevel% neq 0 (
    echo Failed to copy frontend!
    exit /b 1
)
echo Frontend copied successfully!
echo.

echo [3/3] Building backend...
cd backend
go build -o ..\mlserver-dash-backend.exe ./cmd/main.go
if %errorlevel% neq 0 (
    echo Backend build failed!
    exit /b 1
)
cd ..
echo Backend build complete!
echo.

echo ========================================
echo Build successful!
echo Output: mlserver-dash-backend.exe
echo ========================================
