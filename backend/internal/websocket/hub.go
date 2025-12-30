package websocket

import (
	"sync"
)

// Message 表示要广播的消息
type Message struct {
	Type string      `json:"type"` // "system" or "docker"
	Data interface{} `json:"data"`
}

// Hub 维护活跃客户端集合并广播消息
type Hub struct {
	// 注册的客户端
	clients map[*Client]bool

	// 注册客户端的请求
	register chan *Client

	// 注销客户端的请求
	unregister chan *Client

	// 广播消息
	broadcast chan Message

	mu sync.RWMutex
}

// NewHub 创建一个新的 Hub 实例
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Message),
	}
}

// Run 启动 hub 的主循环
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					// 客户端缓冲区已满，关闭连接
					delete(h.clients, client)
					close(client.send)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastSystem 广播系统信息
func (h *Hub) BroadcastSystem(data interface{}) {
	h.broadcast <- Message{
		Type: "system",
		Data: data,
	}
}

// BroadcastDocker 广播 Docker 容器信息
func (h *Hub) BroadcastDocker(data interface{}) {
	h.broadcast <- Message{
		Type: "docker",
		Data: data,
	}
}

// BroadcastClient 广播客户端更新
func (h *Hub) BroadcastClient(serverID string, data interface{}) {
	h.broadcast <- Message{
		Type: "client",
		Data: map[string]interface{}{
			"server_id": serverID,
			"metrics":   data,
		},
	}
}

// ClientCount 返回当前连接的客户端数量
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
