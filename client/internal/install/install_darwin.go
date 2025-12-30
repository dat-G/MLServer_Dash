//go:build darwin

package install

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// InstallService installs the client as a system service
func InstallService(serverURL string) error {
	return installMacOSService(serverURL)
}

// UninstallService uninstalls the system service
func UninstallService() error {
	return uninstallMacOSService()
}

// installMacOSService installs using launchd
func installMacOSService(serverURL string) error {
	// Get the current executable path
	execPath, err := os.Executable()
	if err != nil {
		return err
	}

	// Create launchd plist file
	plistContent := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mlserver.client</string>
    <key>ProgramArguments</key>
    <array>
        <string>%s</string>
        <string>-server_url</string>
        <string>%s</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/mlserver-client.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/mlserver-client.err</string>
</dict>
</plist>
`, execPath, serverURL)

	// Write plist file
	plistPath := "/Library/LaunchDaemons/com.mlserver.client.plist"
	if err := os.WriteFile(plistPath, []byte(plistContent), 0644); err != nil {
		return fmt.Errorf("failed to write plist file: %w", err)
	}

	// Load the service
	cmd := exec.Command("launchctl", "load", plistPath)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to load service: %w", err)
	}

	// Start the service
	cmd = exec.Command("launchctl", "start", "com.mlserver.client")
	if err := cmd.Run(); err != nil {
		// Service might already be running, ignore error
		if !strings.Contains(err.Error(), "already running") {
			return fmt.Errorf("failed to start service: %w", err)
		}
	}

	return nil
}

func uninstallMacOSService() error {
	plistPath := "/Library/LaunchDaemons/com.mlserver.client.plist"

	// Unload the service
	cmd := exec.Command("launchctl", "unload", plistPath)
	if err := cmd.Run(); err != nil {
		// Service might not be loaded, ignore error
		if !strings.Contains(err.Error(), "not found") {
			return fmt.Errorf("failed to unload service: %w", err)
		}
	}

	// Remove plist file
	if err := os.Remove(plistPath); err != nil {
		return fmt.Errorf("failed to remove plist file: %w", err)
	}

	return nil
}
