//go:build windows

package install

import (
	"fmt"
	"os"
	"os/exec"
	"time"

	"golang.org/x/sys/windows"
)

// InstallService installs the client as a system service
func InstallService(serverURL string) error {
	return installWindowsService(serverURL)
}

// UninstallService uninstalls the system service
func UninstallService() error {
	return uninstallWindowsService()
}

// installWindowsService installs using Windows native sc command
func installWindowsService(serverURL string) error {
	// Check if running as administrator
	if !isWindowsAdmin() {
		return fmt.Errorf("ERROR: Administrator privileges required.\nPlease right-click Command Prompt and select 'Run as administrator'")
	}

	// Get the current executable path
	execPath, err := os.Executable()
	if err != nil {
		return err
	}

	serviceName := "MLServerClient"
	displayName := "MLServer Monitoring Client"

	// Build the service start command
	startCommand := fmt.Sprintf(`"%s" -server_url %s`, execPath, serverURL)

	// Check if service already exists
	checkCmd := exec.Command("cmd", "/c", fmt.Sprintf("sc query \"%s\"", serviceName))
	if checkCmd.Run() == nil {
		fmt.Printf("Service '%s' already exists. Removing...\n", serviceName)
		// Stop the service first
		exec.Command("cmd", "/c", fmt.Sprintf("sc stop \"%s\"", serviceName)).Run()
		// Delete the old service
		exec.Command("cmd", "/c", fmt.Sprintf("sc delete \"%s\"", serviceName)).Run()
		// Wait for deletion to complete
		for i := 0; i < 10; i++ {
			var cmd exec.Cmd
			cmd.Path = "cmd"
			cmd.Args = []string{"cmd", "/c", fmt.Sprintf("sc query \"%s\"", serviceName)}
			if cmd.Run() != nil {
				break
			}
			time.Sleep(500 * time.Millisecond)
		}
	}

	// Create service using sc command
	// Using cmd /c to ensure proper argument passing
	fmt.Printf("Creating service '%s'...\n", serviceName)

	createCmd := fmt.Sprintf(`sc create "%s" binPath= "%s" start= auto DisplayName= "%s"`,
		serviceName, startCommand, displayName)

	cmd := exec.Command("cmd", "/c", createCmd)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("ERROR: Failed to create service\n%s", string(output))
	}

	// Set service description
	exec.Command("cmd", "/c", fmt.Sprintf("sc description \"%s\" \"MLServer monitoring client - reports system metrics to backend server\"", serviceName)).Run()

	// Start the service
	fmt.Printf("Starting service '%s'...\n", serviceName)
	startCmd := exec.Command("cmd", "/c", fmt.Sprintf("sc start \"%s\"", serviceName))
	if _, err := startCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("ERROR: Failed to start service\n%s", err)
	}

	fmt.Printf("\nService '%s' installed and started successfully!\n", serviceName)
	fmt.Printf("\nCommands to manage the service:\n")
	fmt.Printf("  Check status:  sc query %s\n", serviceName)
	fmt.Printf("  Stop service:  sc stop %s\n", serviceName)
	fmt.Printf("  Uninstall:    mlserver-client.exe -uninstall\n")

	return nil
}

func uninstallWindowsService() error {
	// Check if running as administrator
	if !isWindowsAdmin() {
		return fmt.Errorf("ERROR: Administrator privileges required.\nPlease right-click Command Prompt and select 'Run as administrator'")
	}

	serviceName := "MLServerClient"

	fmt.Printf("Stopping service '%s'...\n", serviceName)
	// Stop the service
	_ = exec.Command("cmd", "/c", fmt.Sprintf("sc stop \"%s\"", serviceName)).Run()

	fmt.Printf("Deleting service '%s'...\n", serviceName)
	// Delete the service
	if err := exec.Command("cmd", "/c", fmt.Sprintf("sc delete \"%s\"", serviceName)).Run(); err != nil {
		return fmt.Errorf("ERROR: Failed to delete service\n%s", err)
	}

	fmt.Printf("\nService '%s' uninstalled successfully.\n", serviceName)

	return nil
}

// isWindowsAdmin checks if the current process has administrator privileges on Windows
func isWindowsAdmin() bool {
	var sid *windows.SID
	err := windows.AllocateAndInitializeSid(
		&windows.SECURITY_NT_AUTHORITY,
		2,
		windows.SECURITY_BUILTIN_DOMAIN_RID,
		windows.DOMAIN_ALIAS_RID_ADMINS,
		0, 0, 0, 0, 0, 0,
		&sid,
	)
	if err != nil {
		return false
	}
	defer windows.FreeSid(sid)

	token := windows.Token(0)
	member, err := token.IsMember(sid)
	if err != nil {
		return false
	}

	return member
}
