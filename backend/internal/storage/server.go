package storage

import (
	"net"
	"strconv"
	"sync"
	"time"

	"github.com/dat-G/MLServer_Dash/backend/internal/models"
)

var (
	instance *ServerStorage
	once     sync.Once
)

// ServerStorage 服务器存储
type ServerStorage struct {
	servers map[string]*models.Server
	mu      sync.RWMutex
}

// GetServerStorage 获取服务器存储实例（单例）
func GetServerStorage() *ServerStorage {
	once.Do(func() {
		instance = &ServerStorage{
			servers: make(map[string]*models.Server),
		}
		// 添加默认的本机服务器
		instance.addDefaultServers()
	})
	return instance
}

// addDefaultServers 添加默认服务器
func (s *ServerStorage) addDefaultServers() {
	s.servers["local"] = &models.Server{
		ID:     "local",
		Name:   "Localhost",
		Host:   "localhost",
		Port:   8000,
		Status: "online",
	}
}

// GetAll 获取所有服务器
func (s *ServerStorage) GetAll() []models.Server {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.Server, 0, len(s.servers))
	for _, server := range s.servers {
		result = append(result, *server)
	}
	return result
}

// GetByID 根据 ID 获取服务器
func (s *ServerStorage) GetByID(id string) (*models.Server, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	server, ok := s.servers[id]
	if !ok {
		return nil, false
	}
	// 返回副本
	copy := *server
	return &copy, true
}

// Add 添加服务器
func (s *ServerStorage) Add(server models.Server) string {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 生成 ID
	id := generateID()
	server.ID = id
	server.Status = "offline"

	s.servers[id] = &server
	return id
}

// Update 更新服务器
func (s *ServerStorage) Update(id string, server models.Server) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.servers[id]; !exists {
		return false
	}

	server.ID = id
	// 保持原有状态
	server.Status = s.servers[id].Status
	s.servers[id] = &server
	return true
}

// Delete 删除服务器
func (s *ServerStorage) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.servers[id]; !exists {
		return false
	}
	delete(s.servers, id)
	return true
}

// CheckStatus 检查服务器状态
func (s *ServerStorage) CheckStatus(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	server, exists := s.servers[id]
	if !exists {
		return
	}

	// 检查连接
	address := net.JoinHostPort(server.Host, strconv.FormatInt(int64(server.Port), 10))
	conn, err := net.DialTimeout("tcp", address, 2*time.Second)
	if err != nil {
		server.Status = "offline"
	} else {
		conn.Close()
		server.Status = "online"
	}
}

// CheckAllStatus 检查所有服务器状态
func (s *ServerStorage) CheckAllStatus() {
	s.mu.RLock()
	ids := make([]string, 0, len(s.servers))
	for id := range s.servers {
		ids = append(ids, id)
	}
	s.mu.RUnlock()

	for _, id := range ids {
		s.CheckStatus(id)
	}
}

// generateID 生成唯一 ID
func generateID() string {
	return "srv-" + time.Now().Format("20060102150405")
}
