package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/dat-G/MLServer_Dash/backend/internal/config"
	"github.com/dat-G/MLServer_Dash/backend/internal/docker"
	"github.com/dat-G/MLServer_Dash/backend/internal/models"
	"github.com/dat-G/MLServer_Dash/backend/internal/monitor"
)

// RootHandler 根端点处理器
func RootHandler(c *gin.Context) {
	cfg := config.Get()

	c.JSON(http.StatusOK, models.RootResponse{
		Message: cfg.App.AppName + " API",
		Version: "1.0.0",
		Endpoints: map[string]string{
			"system":        "/api/system",
			"docker":        "/api/docker",
			"docker_action": "/api/docker/{container_id}/action",
		},
	})
}

// SystemInfoHandler 系统信息处理器
func SystemInfoHandler(c *gin.Context) {
	systemInfo := monitor.GetSystemInfo()
	c.JSON(http.StatusOK, systemInfo)
}

// DockerListHandler Docker容器列表处理器
func DockerListHandler(c *gin.Context) {
	// 即使 Docker 不可用也返回空数组，避免前端报错
	containers := docker.GetContainers()
	c.JSON(http.StatusOK, containers)
}

// DockerActionHandler 容器操作处理器
func DockerActionHandler(c *gin.Context) {
	if !docker.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"detail": "Docker is not available",
		})
		return
	}

	containerID := c.Param("container_id")
	action := c.DefaultQuery("action", "")

	if action == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"detail": "action query parameter is required",
		})
		return
	}

	response := docker.ContainerAction(containerID, action)
	if !response.Success {
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	c.JSON(http.StatusOK, response)
}

// HealthCheckHandler 健康检查处理器
func HealthCheckHandler(c *gin.Context) {
	c.JSON(http.StatusOK, models.HealthResponse{
		Status:          "healthy",
		Timestamp:       time.Now(),
		DockerAvailable: docker.IsAvailable(),
		GPUAvailable:    monitor.IsGPUAvailable(),
	})
}
