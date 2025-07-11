package main

import (
	"log"
	"net/http"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 设置Gin模式
	gin.SetMode(gin.ReleaseMode)
	
	r := gin.Default()

	// CORS配置
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:5173"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// 静态文件服务 - 用于下载存档
	r.Static("/downloads", "./downloads")
	
	// 初始化服务
	saveService := NewSaveService()
	
	// API路由组
	api := r.Group("/api")
	{
		// 路径管理
		api.GET("/current-path", saveService.GetCurrentPath)
		api.POST("/set-path", saveService.SetPath)
		api.GET("/validate-path", saveService.ValidatePath)
		api.GET("/path-info", saveService.GetPathInfo)
		
		// 存档管理
		api.GET("/saves", saveService.GetSaves)
		api.GET("/saves/:id", saveService.GetSaveDetails)
		api.DELETE("/saves/:id", saveService.DeleteSave)
		api.POST("/saves/import", saveService.ImportSave)
		api.GET("/saves/:id/export", saveService.ExportSave)
		api.POST("/saves/batch-export", saveService.BatchExport)
		api.DELETE("/saves/batch-delete", saveService.BatchDelete)
		
		// 冲突处理
		api.POST("/saves/compare", saveService.CompareSaves)
		api.POST("/saves/resolve-conflict", saveService.ResolveConflict)
		
		// 操作日志
		api.GET("/logs", saveService.GetLogs)
		
		// 健康检查
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})
	}

	// 启动服务器
	log.Println("服务器启动在端口 :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("启动服务器失败:", err)
	}
}