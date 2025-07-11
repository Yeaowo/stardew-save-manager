package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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
	authService := NewAuthService()
	
	// 加载用户数据
	if err := authService.loadUsers(); err != nil {
		log.Printf("加载用户数据失败: %v", err)
	}
	
	// API路由组
	api := r.Group("/api")
	{
		// 认证路由（无需认证）
		auth := api.Group("/auth")
		{
			auth.POST("/register", authService.Register)
			auth.POST("/login", authService.Login)
			auth.GET("/verify", authService.AuthMiddleware(), authService.VerifyToken)
		}
		
		// 受保护的路由（需要认证）
		protected := api.Group("/")
		protected.Use(authService.AuthMiddleware())
		{
			// 路径管理
			protected.GET("/current-path", saveService.GetCurrentPath)
			protected.POST("/set-path", saveService.SetPath)
			protected.GET("/validate-path", saveService.ValidatePath)
			protected.GET("/path-info", saveService.GetPathInfo)
			
			// 存档管理
			protected.GET("/saves", saveService.GetSaves)
			protected.GET("/saves/:id", saveService.GetSaveDetails)
			protected.DELETE("/saves/:id", saveService.DeleteSave)
			protected.POST("/saves/import", saveService.ImportSave)
			protected.GET("/saves/:id/export", saveService.ExportSave)
			protected.POST("/saves/batch-export", saveService.BatchExport)
			protected.DELETE("/saves/batch-delete", saveService.BatchDelete)
			
			// 冲突处理
			protected.POST("/saves/compare", saveService.CompareSaves)
			protected.POST("/saves/resolve-conflict", saveService.ResolveConflict)
			
			// 操作日志
			protected.GET("/logs", saveService.GetLogs)
		}
		
		// 健康检查（无需认证）
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})
	}

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	// 在新的goroutine中启动服务器
	go func() {
		log.Println("服务器启动在端口 :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("启动服务器失败: %s\n", err)
		}
	}()

	// 等待中断信号来优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("正在关闭服务器...")

	// 保存用户数据
	if err := authService.saveUsers(); err != nil {
		log.Printf("保存用户数据失败: %v", err)
	} else {
		log.Println("用户数据已保存")
	}

	// 给一些时间来完成现有的请求
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("服务器强制关闭:", err)
	}

	log.Println("服务器已退出")
}