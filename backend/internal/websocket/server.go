package websocket

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Hub 全局 hub 实例，由 main.go 初始化
var HubInstance *Hub

// upgrader 用于将 HTTP 连接升级为 WebSocket
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// 允许所有来源，生产环境应该检查 Origin
		return true
	},
}

// InitHub 初始化 WebSocket hub
func InitHub() {
	HubInstance = NewHub()
	go HubInstance.Run()
	log.Println("WebSocket Hub initialized")
}

// HandleWebSocket 处理 WebSocket 连接请求
func HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade to WebSocket: %v", err)
		return
	}

	if HubInstance == nil {
		log.Println("WebSocket Hub not initialized")
		conn.Close()
		return
	}

	client := NewClient(HubInstance, conn)

	// 注册客户端
	HubInstance.register <- client

	// 启动读写 goroutine
	go client.WritePump()
	go client.ReadPump()
}
