package models

// Server 服务器配置
type Server struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Host   string `json:"host"`
	Port   int    `json:"port"`
	Status string `json:"status"` // "online" | "offline"
}

// ServerList 服务器列表响应
type ServerList struct {
	Servers []Server `json:"servers"`
}

// AddServerRequest 添加服务器请求
type AddServerRequest struct {
	Name string `json:"name" binding:"required"`
	Host string `json:"host" binding:"required"`
	Port int    `json:"port" binding:"required,min=1,max=65535"`
}

// UpdateServerRequest 更新服务器请求
type UpdateServerRequest struct {
	Name string `json:"name" binding:"required"`
	Host string `json:"host" binding:"required"`
	Port int    `json:"port" binding:"required,min=1,max=65535"`
}
