package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// pongWait 等待 pong 响应的时间
	pongWait = 60 * time.Second
	// pingPeriod 发送 ping 的时间间隔（必须小于 pongWait）
	pingPeriod = 54 * time.Second
	// writeWait 写入消息的超时时间
	writeWait = 10 * time.Second
)

// Client 表示 WebSocket 客户端连接
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan Message
}

// NewClient 创建一个新的客户端
func NewClient(hub *Hub, conn *websocket.Conn) *Client {
	return &Client{
		hub:  hub,
		conn: conn,
		send: make(chan Message, 256),
	}
}

// ReadPump 从 WebSocket 连接读取消息
// 客户端可以发送 ping 消息保持连接
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	// 配置 pong 处理器
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
	}
}

// WritePump 将消息写入 WebSocket 连接
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub 关闭了通道
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// 序列化消息
			data, err := json.Marshal(message)
			if err != nil {
				log.Printf("Failed to marshal message: %v", err)
				continue
			}

			err = c.conn.WriteMessage(websocket.TextMessage, data)
			if err != nil {
				log.Printf("Failed to write message: %v", err)
				return
			}

		case <-ticker.C:
			// 发送 ping 消息保持连接
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
