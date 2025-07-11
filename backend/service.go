package main

import (
	"archive/zip"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// SaveService 存档服务
type SaveService struct {
	currentPath string
	recentPaths []string
	logs        []OperationLog
}

// NewSaveService 创建新的存档服务实例
func NewSaveService() *SaveService {
	// 默认路径指向项目同级目录的 stardew-multiplayer-docker/valley_saves
	defaultPath := "../stardew-multiplayer-docker/valley_saves"
	
	// 尝试多个可能的路径
	possiblePaths := []string{
		defaultPath,                           // 主要目标路径
		"../stardew-multiplayer-docker/valley_saves", // Windows风格路径
		"../valley_saves",                     // 备用路径1
		"./valley_saves",                      // 备用路径2
	}
	
	// 找到第一个有效的路径
	var validPath string
	for _, path := range possiblePaths {
		if cleanPath := filepath.Clean(path); cleanPath != "" {
			if info, err := os.Stat(cleanPath); err == nil && info.IsDir() {
				validPath = cleanPath
				break
			}
			// 如果目录不存在，尝试创建它（仅对默认路径）
			if path == defaultPath {
				if err := os.MkdirAll(cleanPath, 0755); err == nil {
					validPath = cleanPath
					break
				}
			}
		}
	}
	
	// 如果没有找到有效路径，使用默认路径并尝试创建
	if validPath == "" {
		validPath = defaultPath
		os.MkdirAll(validPath, 0755)
	}
	
	// 确保其他必要目录存在
	os.MkdirAll("./downloads", 0755)
	os.MkdirAll("./backups", 0755)
	
	return &SaveService{
		currentPath: validPath,
		recentPaths: []string{validPath},
		logs:        make([]OperationLog, 0),
	}
}

// GetCurrentPath 获取当前存档路径
func (s *SaveService) GetCurrentPath(c *gin.Context) {
	config := PathConfig{
		CurrentPath: s.currentPath,
		RecentPaths: s.recentPaths,
		IsValid:     s.isValidPath(s.currentPath),
	}
	
	if !config.IsValid {
		config.Error = "当前路径无效或不可访问"
	}
	
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    config,
	})
}

// SetPath 设置存档路径
func (s *SaveService) SetPath(c *gin.Context) {
	var req SetPathRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "请求参数无效",
		})
		return
	}
	
	// 路径安全校验
	if !s.isValidPath(req.Path) {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "路径无效或不安全",
		})
		return
	}
	
	s.currentPath = req.Path
	s.addToRecentPaths(req.Path)
	
	s.addLog("path_change", fmt.Sprintf("切换存档路径到: %s", req.Path), true, "")
	
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: "路径设置成功",
		Data: PathConfig{
			CurrentPath: s.currentPath,
			RecentPaths: s.recentPaths,
			IsValid:     true,
		},
	})
}

// ValidatePath 验证路径
func (s *SaveService) ValidatePath(c *gin.Context) {
	path := c.Query("path")
	isValid := s.isValidPath(path)
	
	response := gin.H{
		"valid": isValid,
		"path":  path,
	}
	
	if !isValid {
		response["error"] = "路径无效或不可访问"
	}
	
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    response,
	})
}

// GetPathInfo 获取路径信息和检测状态
func (s *SaveService) GetPathInfo(c *gin.Context) {
	// 检测所有可能的路径
	possiblePaths := []string{
		"../stardew-multiplayer-docker/valley_saves",
		"../valley_saves", 
		"./valley_saves",
	}
	
	pathStatus := make([]gin.H, 0)
	for i, path := range possiblePaths {
		cleanPath := filepath.Clean(path)
		exists := false
		isDir := false
		var err string
		
		if info, statErr := os.Stat(cleanPath); statErr == nil {
			exists = true
			isDir = info.IsDir()
		} else {
			err = statErr.Error()
		}
		
		status := gin.H{
			"path":     path,
			"priority": i + 1,
			"exists":   exists,
			"isDir":    isDir,
			"current":  cleanPath == s.currentPath,
		}
		
		if err != "" {
			status["error"] = err
		}
		
		pathStatus = append(pathStatus, status)
	}
	
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data: gin.H{
			"currentPath": s.currentPath,
			"pathStatus": pathStatus,
		},
	})
}

// GetSaves 获取存档列表
func (s *SaveService) GetSaves(c *gin.Context) {
	saves, err := s.scanSaves()
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "扫描存档失败: " + err.Error(),
		})
		return
	}
	
	// 按最后修改时间排序
	sort.Slice(saves, func(i, j int) bool {
		return saves[i].LastPlayed.After(saves[j].LastPlayed)
	})
	
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    saves,
	})
}

// GetSaveDetails 获取存档详细信息
func (s *SaveService) GetSaveDetails(c *gin.Context) {
	id := c.Param("id")
	save, err := s.getSaveByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, APIResponse{
			Success: false,
			Error:   "存档不存在",
		})
		return
	}
	
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    save,
	})
}

// DeleteSave 删除存档
func (s *SaveService) DeleteSave(c *gin.Context) {
	id := c.Param("id")
	save, err := s.getSaveByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, APIResponse{
			Success: false,
			Error:   "存档不存在",
		})
		return
	}
	
	// 备份存档
	backupPath := filepath.Join("./backups", fmt.Sprintf("%s_%d.zip", save.Name, time.Now().Unix()))
	if err := s.createBackup(save.Path, backupPath); err != nil {
		s.addLog("delete", fmt.Sprintf("删除存档前备份失败: %s", save.Name), false, err.Error())
	}
	
	// 删除存档目录
	if err := os.RemoveAll(save.Path); err != nil {
		s.addLog("delete", fmt.Sprintf("删除存档失败: %s", save.Name), false, err.Error())
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "删除存档失败: " + err.Error(),
		})
		return
	}
	
	s.addLog("delete", fmt.Sprintf("删除存档: %s", save.Name), true, "")
	
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: "存档删除成功",
	})
}

// ImportSave 导入存档
func (s *SaveService) ImportSave(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "文件上传失败",
		})
		return
	}
	
	// 验证文件类型
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".zip") {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "只支持ZIP格式的存档文件",
		})
		return
	}
	
	// 文件大小限制 (100MB)
	if file.Size > 100*1024*1024 {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "文件大小超过限制(100MB)",
		})
		return
	}
	
	// 解析请求参数
	overwrite := c.DefaultPostForm("overwriteExisting", "false") == "true"
	backup := c.DefaultPostForm("backupExisting", "true") == "true"
	
	// 保存上传的文件
	tempPath := filepath.Join("./temp", file.Filename)
	os.MkdirAll("./temp", 0755)
	
	if err := c.SaveUploadedFile(file, tempPath); err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "保存文件失败",
		})
		return
	}
	defer os.Remove(tempPath)
	
	// 解压并导入
	result, err := s.extractAndImportSave(tempPath, overwrite, backup)
	if err != nil {
		s.addLog("import", fmt.Sprintf("导入存档失败: %s", file.Filename), false, err.Error())
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "导入存档失败: " + err.Error(),
		})
		return
	}
	
	s.addLog("import", fmt.Sprintf("导入存档: %s", file.Filename), true, "")
	
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: "存档导入成功",
		Data:    result,
	})
}

// ExportSave 导出存档
func (s *SaveService) ExportSave(c *gin.Context) {
	id := c.Param("id")
	save, err := s.getSaveByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, APIResponse{
			Success: false,
			Error:   "存档不存在",
		})
		return
	}
	
	// 创建ZIP文件
	filename := fmt.Sprintf("%s_%s.zip", save.Name, time.Now().Format("20060102_150405"))
	zipPath := filepath.Join("./downloads", filename)
	
	if err := s.createZipFromDirectory(save.Path, zipPath); err != nil {
		s.addLog("export", fmt.Sprintf("导出存档失败: %s", save.Name), false, err.Error())
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "导出存档失败: " + err.Error(),
		})
		return
	}
	
	s.addLog("export", fmt.Sprintf("导出存档: %s", save.Name), true, "")
	
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.File(zipPath)
	
	// 清理临时文件
	go func() {
		time.Sleep(5 * time.Minute)
		os.Remove(zipPath)
	}()
}

// BatchExport 批量导出存档
func (s *SaveService) BatchExport(c *gin.Context) {
	var req BatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "请求参数无效",
		})
		return
	}
	
	if len(req.SaveIDs) == 0 {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "请选择要导出的存档",
		})
		return
	}
	
	// 创建批量导出ZIP
	filename := fmt.Sprintf("stardew_saves_batch_%s.zip", time.Now().Format("20060102_150405"))
	zipPath := filepath.Join("./downloads", filename)
	
	zipFile, err := os.Create(zipPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "创建导出文件失败",
		})
		return
	}
	defer zipFile.Close()
	
	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()
	
	successCount := 0
	for _, id := range req.SaveIDs {
		save, err := s.getSaveByID(id)
		if err != nil {
			continue
		}
		
		if err := s.addDirectoryToZip(zipWriter, save.Path, save.Name); err != nil {
			continue
		}
		successCount++
	}
	
	if successCount == 0 {
		os.Remove(zipPath)
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   "没有成功导出任何存档",
		})
		return
	}
	
	s.addLog("batch_export", fmt.Sprintf("批量导出 %d 个存档", successCount), true, "")
	
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.File(zipPath)
	
	// 清理临时文件
	go func() {
		time.Sleep(5 * time.Minute)
		os.Remove(zipPath)
	}()
}

// BatchDelete 批量删除存档
func (s *SaveService) BatchDelete(c *gin.Context) {
	var req BatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "请求参数无效",
		})
		return
	}
	
	if len(req.SaveIDs) == 0 {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "请选择要删除的存档",
		})
		return
	}
	
	successCount := 0
	for _, id := range req.SaveIDs {
		save, err := s.getSaveByID(id)
		if err != nil {
			continue
		}
		
		// 备份存档
		backupPath := filepath.Join("./backups", fmt.Sprintf("%s_%d.zip", save.Name, time.Now().Unix()))
		s.createBackup(save.Path, backupPath)
		
		// 删除存档
		if err := os.RemoveAll(save.Path); err == nil {
			successCount++
		}
	}
	
	s.addLog("batch_delete", fmt.Sprintf("批量删除 %d 个存档", successCount), true, "")
	
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: fmt.Sprintf("成功删除 %d 个存档", successCount),
	})
}

// CompareSaves 比较存档
func (s *SaveService) CompareSaves(c *gin.Context) {
	// 这个功能在导入时检测冲突时会调用
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: "存档比较功能",
	})
}

// ResolveConflict 解决冲突
func (s *SaveService) ResolveConflict(c *gin.Context) {
	// 处理存档冲突解决
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: "冲突解决功能",
	})
}

// GetLogs 获取操作日志
func (s *SaveService) GetLogs(c *gin.Context) {
	// 分页参数
	page := 1
	pageSize := 50
	
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}
	
	if ps := c.Query("pageSize"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}
	
	// 计算分页
	start := (page - 1) * pageSize
	end := start + pageSize
	
	total := len(s.logs)
	
	// 反向排序（最新的在前面）
	sortedLogs := make([]OperationLog, len(s.logs))
	copy(sortedLogs, s.logs)
	sort.Slice(sortedLogs, func(i, j int) bool {
		return sortedLogs[i].Timestamp.After(sortedLogs[j].Timestamp)
	})
	
	var paginatedLogs []OperationLog
	if start < total {
		if end > total {
			end = total
		}
		paginatedLogs = sortedLogs[start:end]
	} else {
		paginatedLogs = []OperationLog{}
	}
	
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data: gin.H{
			"logs":     paginatedLogs,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}