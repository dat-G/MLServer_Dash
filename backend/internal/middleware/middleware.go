package middleware

import (
	"github.com/dat-G/MLServer_Dash/backend/internal/config"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupConfig 中间件配置
func SetupConfig(cfg *config.Config) gin.HandlersChain {
	// CORS配置
	corsConfig := cors.Config{
		AllowOrigins:     cfg.Server.CORSOrigins,
		AllowMethods:     cfg.Server.CORSMethods,
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}

	return gin.HandlersChain{
		cors.New(corsConfig),
	}
}
