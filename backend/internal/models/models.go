package models

import "time"

// GPUMemory GPU显存信息
type GPUMemory struct {
	Total      uint64  `json:"total"`
	Used       uint64  `json:"used"`
	Free       uint64  `json:"free"`
	Percent    float64 `json:"percent"`
	TotalHuman string  `json:"total_human"`
	UsedHuman  string  `json:"used_human"`
}

// GPUInfo GPU信息
type GPUInfo struct {
	Name               string     `json:"name"`
	Memory             GPUMemory  `json:"memory"`
	Utilization        float64    `json:"utilization"`
	Temperature        int        `json:"temperature"`
	PowerUsage         int        `json:"power_usage"`          // 当前功耗 (W)
	PowerLimit         int        `json:"power_limit"`          // 功率限制 (W)
	EnforcedPowerLimit int        `json:"enforced_power_limit"` // 强制功率限制 (W)
	PowerDefaultLimit  int        `json:"power_default_limit"`  // 默认功率限制 (W)
}

// CPUInfo CPU信息
type CPUInfo struct {
	Brand           string    `json:"brand"`
	Percent         float64   `json:"percent"`
	Cores           int       `json:"cores"`
	Threads         int       `json:"threads"`
	PerCorePercent  []float64 `json:"per_core_percent"`
}

// MemoryInfo 内存信息
type MemoryInfo struct {
	Total      uint64  `json:"total"`
	Used       uint64  `json:"used"`
	Free       uint64  `json:"free"`
	Percent    float64 `json:"percent"`
	TotalHuman string  `json:"total_human"`
	UsedHuman  string  `json:"used_human"`
	FreeHuman  string  `json:"free_human"`
	Model      string  `json:"model,omitempty"`
}

// DiskInfo 磁盘信息
type DiskInfo struct {
	Name       string  `json:"name"`
	Total      uint64  `json:"total"`
	Used       uint64  `json:"used"`
	Free       uint64  `json:"free"`
	Percent    float64 `json:"percent"`
	TotalHuman string  `json:"total_human"`
	UsedHuman  string  `json:"used_human"`
	FreeHuman  string  `json:"free_human"`
}

// NetworkInterface 网络接口信息
type NetworkInterface struct {
	Name      string  `json:"name"`
	Model     string  `json:"model,omitempty"`
	Speed     *int    `json:"speed,omitempty"`
	IPv4      string  `json:"ipv4,omitempty"`
	IPv6      string  `json:"ipv6,omitempty"`
	BytesSent uint64  `json:"bytes_sent"`
	BytesRecv uint64  `json:"bytes_recv"`
	PacketsSent uint64 `json:"packets_sent"`
	PacketsRecv uint64 `json:"packets_recv"`
	ErrorsIn  int     `json:"errors_in"`
	ErrorsOut int     `json:"errors_out"`
	DropsIn   int     `json:"drops_in"`
	DropsOut  int     `json:"drops_out"`
	SpeedUp   *float64 `json:"speed_up,omitempty"`
	SpeedDown *float64 `json:"speed_down,omitempty"`
}

// DistroInfo 发行版信息
type DistroInfo struct {
	Name string `json:"name,omitempty"`
	ID   string `json:"id,omitempty"`
}

// SystemInfo 系统信息
type SystemInfo struct {
	Hostname   string             `json:"hostname"`
	OS         string             `json:"os"`
	Distro     *DistroInfo        `json:"distro,omitempty"`
	CPU        CPUInfo            `json:"cpu"`
	Memory     MemoryInfo         `json:"memory"`
	Disks      []DiskInfo         `json:"disks"`
	Uptime     int                `json:"uptime"`
	GPU        []GPUInfo          `json:"gpu,omitempty"`
	Network    []NetworkInterface `json:"network,omitempty"`
	WSClients  int                `json:"ws_clients,omitempty"` // WebSocket 连接数
}

// DockerContainer Docker容器信息
type DockerContainer struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Image  string `json:"image"`
	Status string `json:"status"`
	Ports  string `json:"ports"`
	State  string `json:"state"`
}

// ActionResponse 操作响应
type ActionResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// HealthResponse 健康检查响应
type HealthResponse struct {
	Status          string    `json:"status"`
	Timestamp       time.Time `json:"timestamp"`
	DockerAvailable bool      `json:"docker_available"`
	GPUAvailable    bool      `json:"gpu_available"`
}

// RootResponse 根端点响应
type RootResponse struct {
	Message  string            `json:"message"`
	Version  string            `json:"version"`
	Endpoints map[string]string `json:"endpoints"`
}
