@echo off
setlocal enabledelayedexpansion

echo Building MLServer Client...

REM Set output directory
set OUTPUT_DIR=..\backend\internal\embed\binaries
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo Building Windows AMD64...
set GOOS=windows
set GOARCH=amd64
set CGO_ENABLED=0
go build -o "%OUTPUT_DIR%\mlserver-client-windows-amd64.exe" -ldflags="-s -w" .
if errorlevel 1 (
    echo Build failed for Windows AMD64
    exit /b 1
)

echo.
echo All builds completed successfully!
echo Binaries are in: %OUTPUT_DIR%
