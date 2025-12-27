#!/bin/bash

echo "========================================"
echo "Building MLServer_Dash Embedded"
echo "========================================"
echo

echo "[1/3] Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "Frontend build failed!"
    exit 1
fi
cd ..
echo "Frontend build complete!"
echo

echo "[2/3] Copying frontend to backend..."
rm -rf backend/internal/embed/dist
cp -r frontend/dist backend/internal/embed/dist
if [ $? -ne 0 ]; then
    echo "Failed to copy frontend!"
    exit 1
fi
echo "Frontend copied successfully!"
echo

echo "[3/3] Building backend..."
cd backend
go build -o ../mlserver-dash-backend ./cmd/main.go
if [ $? -ne 0 ]; then
    echo "Backend build failed!"
    exit 1
fi
cd ..
echo "Backend build complete!"
echo

echo "========================================"
echo "Build successful!"
echo "Output: mlserver-dash-backend"
echo "========================================"
