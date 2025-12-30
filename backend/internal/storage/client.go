package storage

import (
	"sync"
	"time"

	"github.com/dat-G/MLServer_Dash/backend/internal/models"
)

var (
	clientInstance *ClientStorage
	clientOnce     sync.Once
)

// ClientStorage stores remote client information
type ClientStorage struct {
	clients map[string]*models.RemoteClient
	mu      sync.RWMutex
}

// GetClientStorage gets the client storage instance (singleton)
func GetClientStorage() *ClientStorage {
	clientOnce.Do(func() {
		clientInstance = &ClientStorage{
			clients: make(map[string]*models.RemoteClient),
		}
	})
	return clientInstance
}

// Add adds a new client
func (s *ClientStorage) Add(client models.RemoteClient) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.clients[client.ServerID] = &client
}

// GetByID gets a client by ID
func (s *ClientStorage) GetByID(id string) (*models.RemoteClient, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	client, ok := s.clients[id]
	if !ok {
		return nil, false
	}
	// Return a copy
	copy := *client
	return &copy, true
}

// GetAll gets all clients
func (s *ClientStorage) GetAll() []models.RemoteClient {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.RemoteClient, 0, len(s.clients))
	for _, client := range s.clients {
		result = append(result, *client)
	}
	return result
}

// UpdateMetrics updates a client's metrics
func (s *ClientStorage) UpdateMetrics(serverID string, metrics models.SystemInfo) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	client, ok := s.clients[serverID]
	if !ok {
		return false
	}

	client.Metrics = &metrics
	client.LastSeen = time.Now().Unix()
	client.Status = "online"
	return true
}

// SetStatus sets a client's status
func (s *ClientStorage) SetStatus(serverID string, status string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	client, ok := s.clients[serverID]
	if !ok {
		return false
	}

	client.Status = status
	return true
}

// Delete deletes a client
func (s *ClientStorage) Delete(serverID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.clients[serverID]; !ok {
		return false
	}

	delete(s.clients, serverID)
	return true
}

// CheckOfflineClients marks clients as offline if they haven't reported in 30 seconds
func (s *ClientStorage) CheckOfflineClients() []string {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().Unix()
	var offlineClients []string

	for id, client := range s.clients {
		if client.Status == "online" && (now-client.LastSeen) > 30 {
			client.Status = "offline"
			offlineClients = append(offlineClients, id)
		}
	}

	return offlineClients
}
