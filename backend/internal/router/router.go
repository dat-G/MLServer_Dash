package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/dat-G/MLServer_Dash/backend/internal/config"
	embedfs "github.com/dat-G/MLServer_Dash/backend/internal/embed"
	"github.com/dat-G/MLServer_Dash/backend/internal/handlers"
	"github.com/dat-G/MLServer_Dash/backend/internal/middleware"
)

// Setup 配置并返回 Gin 路由引擎
func Setup(cfg *config.Config) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()

	// 应用中间件
	router.Use(middleware.SetupConfig(cfg)...)
	router.Use(gin.Recovery())

	// API 路由
	setupAPIRoutes(router)

	// 前端静态文件路由
	setupFrontendRoutes(router)

	return router
}

// setupAPIRoutes 设置 API 路由
func setupAPIRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		api.GET("/system", handlers.SystemInfoHandler)
		api.GET("/docker", handlers.DockerListHandler)
		api.POST("/docker/:container_id/action", handlers.DockerActionHandler)
		api.GET("/health", handlers.HealthCheckHandler)
	}
}

// setupFrontendRoutes 设置前端静态文件路由（嵌入的 SPA）
func setupFrontendRoutes(router *gin.Engine) {
	frontendFS := embedfs.FS()
	fileServer := http.FileServer(frontendFS)

	// 静态资源路由
	router.GET("/assets/*filepath", func(c *gin.Context) {
		fileServer.ServeHTTP(c.Writer, c.Request)
	})

	// 根路径
	router.GET("/", func(c *gin.Context) {
		c.Request.URL.Path = "/"
		fileServer.ServeHTTP(c.Writer, c.Request)
	})

	// SPA fallback - 所有其他路由返回 index.html
	router.NoRoute(func(c *gin.Context) {
		c.Request.URL.Path = "/"
		fileServer.ServeHTTP(c.Writer, c.Request)
	})
}
