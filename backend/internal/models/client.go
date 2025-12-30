package models

// ClientMetricsReport is sent by a client to report metrics
type ClientMetricsReport struct {
	ServerID string      `json:"server_id,omitempty"` // Optional, will be generated if not provided
	System   SystemInfo  `json:"system"`
}

// RemoteClient represents a registered remote client
type RemoteClient struct {
	ServerID    string      `json:"server_id"`
	Hostname    string      `json:"hostname"`
	Platform    string      `json:"platform"`
	Arch        string      `json:"arch"`
	Status      string      `json:"status"` // online, offline
	LastSeen    int64       `json:"last_seen"` // Unix timestamp
	Metrics     *SystemInfo `json:"metrics,omitempty"`
}
