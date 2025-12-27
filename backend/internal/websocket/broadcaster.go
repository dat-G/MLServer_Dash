package websocket

import (
	"log"
	"time"

	"github.com/dat-G/MLServer_Dash/backend/internal/config"
	"github.com/dat-G/MLServer_Dash/backend/internal/docker"
	"github.com/dat-G/MLServer_Dash/backend/internal/monitor"
)

// StartBroadcasters 启动广播器
func StartBroadcasters(cfg *config.Config) {
	// 从配置获取轮询间隔，默认 2000ms
	interval := time.Duration(cfg.Server.PollInterval) * time.Millisecond

	// 启动系统信息广播器
	go broadcastSystemInfo(interval)

	// 启动 Docker 信息广播器
	go broadcastDockerInfo(interval)

	log.Printf("Broadcasters started with interval: %v", interval)
}

// broadcastSystemInfo 定期广播系统信息
func broadcastSystemInfo(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// 立即发送一次
	if HubInstance != nil && HubInstance.ClientCount() > 0 {
		systemInfo := monitor.GetSystemInfo()
		systemInfo.WSClients = HubInstance.ClientCount()
		HubInstance.BroadcastSystem(systemInfo)
	}

	for range ticker.C {
		if HubInstance == nil {
			continue
		}

		if HubInstance.ClientCount() == 0 {
			// 没有客户端连接，跳过数据收集
			continue
		}

		systemInfo := monitor.GetSystemInfo()
		systemInfo.WSClients = HubInstance.ClientCount()
		HubInstance.BroadcastSystem(systemInfo)
	}
}

// broadcastDockerInfo 定期广播 Docker 容器信息
func broadcastDockerInfo(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// 立即发送一次
	if HubInstance != nil && HubInstance.ClientCount() > 0 {
		containers := docker.GetContainers()
		HubInstance.BroadcastDocker(containers)
	}

	for range ticker.C {
		if HubInstance == nil {
			continue
		}

		if HubInstance.ClientCount() == 0 {
			// 没有客户端连接，跳过数据收集
			continue
		}

		containers := docker.GetContainers()
		HubInstance.BroadcastDocker(containers)
	}
}
