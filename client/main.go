package main

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/dat-G/MLServer_Dash/client/internal/collector"
	"github.com/dat-G/MLServer_Dash/client/internal/install"
)

const (
	Version      = "1.0.0"
	clientIDFile = ".mlserver-client-id"
)

var (
	serverURL     string
	installFlag   bool
	uninstallFlag bool
	versionFlag   bool
	interval      time.Duration
	clientID      string // Unique persistent ID for this client
)

func init() {
	flag.StringVar(&serverURL, "server_url", "", "Backend server URL (e.g., http://localhost:8000)")
	flag.BoolVar(&installFlag, "install", false, "Install as system service")
	flag.BoolVar(&uninstallFlag, "uninstall", false, "Uninstall system service")
	flag.BoolVar(&versionFlag, "version", false, "Show version information")
	flag.DurationVar(&interval, "interval", 5*time.Second, "Metrics reporting interval")
}

func main() {
	flag.Parse()

	if versionFlag {
		fmt.Printf("MLServer Client v%s\n", Version)
		fmt.Printf("Platform: %s/%s\n", runtime.GOOS, runtime.GOARCH)
		os.Exit(0)
	}

	if installFlag {
		if serverURL == "" {
			log.Fatal("server_url is required for installation")
		}
		if err := installService(); err != nil {
			log.Fatalf("Failed to install service: %v", err)
		}
		fmt.Println("Service installed successfully")
		os.Exit(0)
	}

	if uninstallFlag {
		if err := uninstallService(); err != nil {
			log.Fatalf("Failed to uninstall service: %v", err)
		}
		fmt.Println("Service uninstalled successfully")
		os.Exit(0)
	}

	// Load or generate client ID
	var err error
	clientID, err = loadOrGenerateClientID()
	if err != nil {
		log.Fatalf("Failed to initialize client ID: %v", err)
	}

	// Validate server URL
	if serverURL == "" {
		log.Fatal("server_url is required (use -server_url flag)")
	}

	// Initialize GPU monitoring
	collector.InitGPU()

	// Start metrics collection loop
	log.Printf("Starting metrics collection (interval: %v)", interval)
	log.Printf("Reporting to: %s", serverURL)
	log.Printf("Client ID: %s", clientID)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Report immediately on start
	reportMetrics()

	for range ticker.C {
		reportMetrics()
	}
}

// reportMetrics collects and sends system metrics to the backend
func reportMetrics() {
	metrics := collector.CollectMetrics()

	req := collector.MetricsReport{
		ServerID: clientID,
		System:   metrics,
	}

	body, err := json.Marshal(req)
	if err != nil {
		log.Printf("Failed to marshal metrics: %v", err)
		return
	}

	url := fmt.Sprintf("%s/api/client/metrics", serverURL)
	resp, err := http.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		log.Printf("Failed to report metrics: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Metrics report failed: status %d", resp.StatusCode)
	}
}

// loadOrGenerateClientID loads the existing client ID or generates a new one
func loadOrGenerateClientID() (string, error) {
	// Try to load from home directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return generateClientID()
	}

	idPath := filepath.Join(homeDir, clientIDFile)

	// Try to read existing ID
	if data, err := os.ReadFile(idPath); err == nil && len(data) > 0 {
		id := strings.TrimSpace(string(data))
		if id != "" {
			return id, nil
		}
	}

	// Generate new ID
	id, err := generateClientID()
	if err != nil {
		return "", err
	}

	// Save to file
	if err := os.WriteFile(idPath, []byte(id), 0600); err != nil {
		log.Printf("Warning: Failed to save client ID file: %v", err)
	}

	return id, nil
}

// generateClientID generates a new unique client ID
func generateClientID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		// Fallback to hostname + timestamp if crypto/rand fails
		hostname, _ := os.Hostname()
		if hostname == "" {
			hostname = "unknown"
		}
		return fmt.Sprintf("%s-%d", hostname, time.Now().Unix()), nil
	}
	return hex.EncodeToString(bytes), nil
}

// installService installs the client as a system service
func installService() error {
	return install.InstallService(serverURL)
}

// uninstallService uninstalls the client as a system service
func uninstallService() error {
	return install.UninstallService()
}
