//go:build linux

package install

import (
	"fmt"
	"os"
	"os/exec"
)

// InstallService installs the client as a system service
func InstallService(serverURL string) error {
	return installLinuxService(serverURL)
}

// UninstallService uninstalls the system service
func UninstallService() error {
	return uninstallLinuxService()
}

// installLinuxService installs using systemd
func installLinuxService(serverURL string) error {
	// Check if running as root
	if os.Geteuid() != 0 {
		return fmt.Errorf("this command requires root privileges. Please run with sudo")
	}

	// Get the current executable path
	execPath, err := os.Executable()
	if err != nil {
		return err
	}

	// Create systemd service file
	serviceContent := fmt.Sprintf(`[Unit]
Description=MLServer Monitoring Client
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
ExecStart=%s -server_url %s
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
`, execPath, serverURL)

	// Write service file
	servicePath := "/etc/systemd/system/mlserver-client.service"
	if err := os.WriteFile(servicePath, []byte(serviceContent), 0644); err != nil {
		return fmt.Errorf("failed to write service file: %w", err)
	}

	// Reload systemd
	cmd := exec.Command("systemctl", "daemon-reload")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to reload systemd: %w", err)
	}

	// Enable and start service
	cmd = exec.Command("systemctl", "enable", "mlserver-client.service")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to enable service: %w", err)
	}

	cmd = exec.Command("systemctl", "start", "mlserver-client.service")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to start service: %w", err)
	}

	return nil
}

func uninstallLinuxService() error {
	if os.Geteuid() != 0 {
		return fmt.Errorf("this command requires root privileges. Please run with sudo")
	}

	// Stop and disable service
	cmd := exec.Command("systemctl", "stop", "mlserver-client.service")
	_ = cmd.Run()

	cmd = exec.Command("systemctl", "disable", "mlserver-client.service")
	_ = cmd.Run()

	// Remove service file
	servicePath := "/etc/systemd/system/mlserver-client.service"
	if err := os.Remove(servicePath); err != nil {
		return fmt.Errorf("failed to remove service file: %w", err)
	}

	// Reload systemd
	cmd = exec.Command("systemctl", "daemon-reload")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to reload systemd: %w", err)
	}

	return nil
}
