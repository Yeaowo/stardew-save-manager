package main

import (
	"time"
)

// SaveInfo 存档信息
type SaveInfo struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	PlayerName  string    `json:"playerName"`
	FarmName    string    `json:"farmName"`
	Money       int64     `json:"money"`
	Level       int       `json:"level"`
	Day         int       `json:"day"`
	Season      string    `json:"season"`
	Year        int       `json:"year"`
	PlayTime    string    `json:"playTime"`
	LastPlayed  time.Time `json:"lastPlayed"`
	Size        int64     `json:"size"`
	Path        string    `json:"path"`
	IsValid     bool      `json:"isValid"`
	Error       string    `json:"error,omitempty"`
}

// PathConfig 路径配置
type PathConfig struct {
	CurrentPath string   `json:"currentPath"`
	RecentPaths []string `json:"recentPaths"`
	IsValid     bool     `json:"isValid"`
	Error       string   `json:"error,omitempty"`
}

// ConflictInfo 冲突信息
type ConflictInfo struct {
	ExistingSave SaveInfo               `json:"existingSave"`
	NewSave      SaveInfo               `json:"newSave"`
	Differences  map[string]interface{} `json:"differences"`
}

// OperationLog 操作日志
type OperationLog struct {
	ID        string    `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Operation string    `json:"operation"` // import, export, delete, etc.
	Details   string    `json:"details"`
	Success   bool      `json:"success"`
	Error     string    `json:"error,omitempty"`
}

// BatchRequest 批量操作请求
type BatchRequest struct {
	SaveIDs []string `json:"saveIds"`
}

// ImportRequest 导入请求
type ImportRequest struct {
	OverwriteExisting bool   `json:"overwriteExisting"`
	BackupExisting    bool   `json:"backupExisting"`
	SaveName          string `json:"saveName,omitempty"`
}

// SetPathRequest 设置路径请求
type SetPathRequest struct {
	Path string `json:"path"`
}

// APIResponse 通用API响应
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}