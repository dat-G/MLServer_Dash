package embedfs

import (
	"embed"
	"fmt"
	"io/fs"
	"strings"
)

//go:embed binaries
var clientFS embed.FS

// ClientBinary returns the client binary for the specified platform and architecture
func ClientBinary(userAgent string) ([]byte, string, error) {
	// Detect platform from User-Agent
	platform, arch := detectPlatform(userAgent)

	var filename string
	var outputName string

	switch platform {
	case "windows":
		if arch == "arm64" {
			filename = "binaries/mlserver-client-windows-arm64.exe"
		} else {
			filename = "binaries/mlserver-client-windows-amd64.exe"
		}
		outputName = "mlserver-client.exe"
	case "linux":
		if arch == "arm64" {
			filename = "binaries/mlserver-client-linux-arm64"
		} else {
			filename = "binaries/mlserver-client-linux-amd64"
		}
		outputName = "mlserver-client"
	case "darwin":
		if arch == "arm64" {
			filename = "binaries/mlserver-client-darwin-arm64"
		} else {
			filename = "binaries/mlserver-client-darwin-amd64"
		}
		outputName = "mlserver-client"
	default:
		return nil, "", fmt.Errorf("unsupported platform: %s", platform)
	}

	data, err := clientFS.ReadFile(filename)
	if err != nil {
		return nil, "", fmt.Errorf("binary not found: %s", filename)
	}

	return data, outputName, nil
}

// detectPlatform detects the platform from User-Agent string
func detectPlatform(userAgent string) (platform, arch string) {
	ua := strings.ToLower(userAgent)

	// Detect platform
	if strings.Contains(ua, "windows") {
		platform = "windows"
	} else if strings.Contains(ua, "macintosh") || strings.Contains(ua, "mac os x") || strings.Contains(ua, "macos") {
		platform = "darwin"
	} else if strings.Contains(ua, "linux") {
		platform = "linux"
	} else {
		// Default to windows for empty/unknown User-Agent (common for curl)
		platform = "windows"
	}

	// Detect architecture
	if strings.Contains(ua, "arm64") || strings.Contains(ua, "aarch64") {
		arch = "arm64"
	} else {
		arch = "amd64"
	}

	return platform, arch
}

// ClientFS returns the raw filesystem for client binaries
func ClientFS() fs.FS {
	fsys, err := fs.Sub(clientFS, "binaries")
	if err != nil {
		panic(err)
	}
	return fsys
}
