package handlers

import (
	"net/http"

	"github.com/dat-G/MLServer_Dash/backend/internal/models"
	"github.com/dat-G/MLServer_Dash/backend/internal/storage"
	"github.com/gin-gonic/gin"
)

var serverStorage = storage.GetServerStorage()

// GetServers 获取服务器列表
func GetServers(c *gin.Context) {
	servers := serverStorage.GetAll()
	c.JSON(http.StatusOK, models.ServerList{
		Servers: servers,
	})
}

// AddServer 添加服务器
func AddServer(c *gin.Context) {
	var req models.AddServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id := serverStorage.Add(models.Server{
		Name: req.Name,
		Host: req.Host,
		Port: req.Port,
	})

	c.JSON(http.StatusCreated, gin.H{
		"id":      id,
		"message": "Server added successfully",
	})
}

// UpdateServer 更新服务器
func UpdateServer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Server ID is required"})
		return
	}

	var req models.UpdateServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	server := models.Server{
		Name: req.Name,
		Host: req.Host,
		Port: req.Port,
	}

	if !serverStorage.Update(id, server) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Server updated successfully",
	})
}

// DeleteServer 删除服务器
func DeleteServer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Server ID is required"})
		return
	}

	// 不允许删除本地服务器
	if id == "local" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete local server"})
		return
	}

	if !serverStorage.Delete(id) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Server deleted successfully",
	})
}

// CheckServerStatus 检查服务器状态
func CheckServerStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Server ID is required"})
		return
	}

	serverStorage.CheckStatus(id)

	if server, ok := serverStorage.GetByID(id); ok {
		c.JSON(http.StatusOK, server)
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
	}
}

// CheckAllServerStatus 检查所有服务器状态
func CheckAllServerStatus(c *gin.Context) {
	serverStorage.CheckAllStatus()
	servers := serverStorage.GetAll()
	c.JSON(http.StatusOK, models.ServerList{
		Servers: servers,
	})
}

// RefreshServer 刷新服务器状态（检查端口是否可达）
func RefreshServer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Server ID is required"})
		return
	}

	serverStorage.CheckStatus(id)

	if server, ok := serverStorage.GetByID(id); ok {
		c.JSON(http.StatusOK, gin.H{
			"status":  server.Status,
			"message": "Server status refreshed",
		})
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
	}
}

// SetServerStatus 手动设置服务器状态（用于内部使用）
func SetServerStatus(id string, status string) {
	if server, ok := serverStorage.GetByID(id); ok {
		server.Status = status
		serverStorage.Update(id, *server)
	}
}

// GetServerCount 获取服务器数量
func GetServerCount() int {
	return len(serverStorage.GetAll())
}
