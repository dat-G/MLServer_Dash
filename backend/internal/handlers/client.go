package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/dat-G/MLServer_Dash/backend/internal/models"
	"github.com/dat-G/MLServer_Dash/backend/internal/storage"
	embedfs "github.com/dat-G/MLServer_Dash/backend/internal/embed"
	"github.com/dat-G/MLServer_Dash/backend/internal/websocket"
)

// ClientDownloadHandler serves the client binary for download
func ClientDownloadHandler(c *gin.Context) {
	// Get User-Agent for platform detection
	userAgent := c.GetHeader("User-Agent")

	// Get the appropriate binary
	binary, filename, err := embedfs.ClientBinary(userAgent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get client binary: " + err.Error(),
		})
		return
	}

	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, "application/octet-stream", binary)
}

// ClientMetricsHandler handles metrics reports from clients
func ClientMetricsHandler(c *gin.Context) {
	var req models.ClientMetricsReport
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	// Client must provide a server_id
	if req.ServerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "server_id is required",
		})
		return
	}

	clientStorage := storage.GetClientStorage()

	// Try to update metrics with the server ID
	if !clientStorage.UpdateMetrics(req.ServerID, req.System) {
		// Client doesn't exist, add it
		// Detect platform from User-Agent
		userAgent := c.GetHeader("User-Agent")
		platform, _ := detectPlatform(userAgent)

		client := models.RemoteClient{
			ServerID: req.ServerID,
			Hostname: req.System.Hostname,
			Platform: platform,
			Status:   "online",
			LastSeen: time.Now().Unix(),
			Metrics:  &req.System,
		}
		clientStorage.Add(client)
	}

	// Broadcast metrics via WebSocket (for client-specific updates)
	if websocket.HubInstance != nil {
		websocket.HubInstance.BroadcastClient(req.ServerID, req.System)
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "received",
	})
}

// GetClientsHandler returns all registered clients
func GetClientsHandler(c *gin.Context) {
	clientStorage := storage.GetClientStorage()
	clients := clientStorage.GetAll()

	c.JSON(http.StatusOK, gin.H{
		"clients": clients,
	})
}

// detectPlatform detects the platform from User-Agent string
func detectPlatform(userAgent string) (string, bool) {
	ua := userAgent
	switch {
	case contains(ua, "windows"):
		return "windows", true
	case contains(ua, "linux"):
		return "linux", true
	case contains(ua, "darwin") || contains(ua, "macos"):
		return "macos", true
	default:
		return "unknown", false
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || indexOf(s, substr) >= 0))
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}