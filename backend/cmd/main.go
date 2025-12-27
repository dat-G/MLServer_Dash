package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/dat-G/MLServer_Dash/backend/internal/config"
	"github.com/dat-G/MLServer_Dash/backend/internal/docker"
	"github.com/dat-G/MLServer_Dash/backend/internal/monitor"
	"github.com/dat-G/MLServer_Dash/backend/internal/router"
	ws "github.com/dat-G/MLServer_Dash/backend/internal/websocket"
)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化 GPU 监控
	monitor.InitGPU()
	defer monitor.Shutdown()

	// 初始化 Docker
	if err := docker.Init(); err != nil {
		log.Printf("Docker not available: %v", err)
	}
	defer docker.Close()

	// 初始化 WebSocket Hub
	ws.InitHub()

	// 启动广播器
	ws.StartBroadcasters(cfg)

	// 设置路由
	app := router.Setup(cfg)

	// 启动信息
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Printf("%s starting...", cfg.App.AppName)
	log.Printf("Web UI: http://%s", addr)
	log.Printf("API: http://%s/api", addr)
	log.Printf("WebSocket: ws://%s/api/ws", addr)
	if cfg.App.GithubURL != "" {
		log.Printf("GitHub: %s", cfg.App.GithubURL)
	}
	log.Println()

	// 启动服务器
	go func() {
		if err := app.Run(addr); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
}
