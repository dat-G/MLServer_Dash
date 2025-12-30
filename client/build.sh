#!/bin/bash

echo "Building MLServer Client..."

# Set output directory
OUTPUT_DIR="../backend/internal/embed/binaries"
mkdir -p "$OUTPUT_DIR"

echo "Building Linux AMD64..."
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o "$OUTPUT_DIR/mlserver-client-linux-amd64" -ldflags="-s -w" .
if [ $? -ne 0 ]; then
    echo "Build failed for Linux AMD64"
    exit 1
fi

echo "Building macOS AMD64..."
GOOS=darwin GOARCH=amd64 CGO_ENABLED=0 go build -o "$OUTPUT_DIR/mlserver-client-darwin-amd64" -ldflags="-s -w" .
if [ $? -ne 0 ]; then
    echo "Build failed for macOS AMD64"
    exit 1
fi

echo "Building macOS ARM64..."
GOOS=darwin GOARCH=arm64 CGO_ENABLED=0 go build -o "$OUTPUT_DIR/mlserver-client-darwin-arm64" -ldflags="-s -w" .
if [ $? -ne 0 ]; then
    echo "Build failed for macOS ARM64"
    exit 1
fi

echo ""
echo "All builds completed successfully!"
echo "Binaries are in: $OUTPUT_DIR"
