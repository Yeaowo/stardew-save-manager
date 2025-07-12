package main

import (
	"archive/zip"
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// StardewSaveGame 星露谷存档XML结构
type StardewSaveGame struct {
	XMLName    xml.Name `xml:"SaveGame"`
	Player     Player   `xml:"player"`
	UniqueID   string   `xml:"uniqueIDForThisGame"`
	DayOfMonth int      `xml:"dayOfMonth"`
	Season     string   `xml:"currentSeason"`
	Year       int      `xml:"year"`
	TimeOfDay  int      `xml:"timeOfDay"`
}

// Player 玩家信息
type Player struct {
	Name               string `xml:"name"`
	FarmName           string `xml:"farmName"`
	Money              int64  `xml:"money"`
	Level              int    `xml:"level"`
	MillisecondsPlayed int64  `xml:"millisecondsPlayed"`
}

// isValidPath 验证路径是否安全和有效
func (s *SaveService) isValidPath(path string) bool {
	if path == "" {
		return false
	}

	// 清理路径
	cleanPath := filepath.Clean(path)

	// 获取绝对路径以进行安全检查
	absPath, err := filepath.Abs(cleanPath)
	if err != nil {
		return false
	}

	// 检查是否是危险的路径遍历 (防止访问系统关键目录)
	// 允许相对路径，但不能访问根目录或系统目录
	if strings.HasPrefix(absPath, "/") && (absPath == "/" ||
		strings.HasPrefix(absPath, "/etc") ||
		strings.HasPrefix(absPath, "/bin") ||
		strings.HasPrefix(absPath, "/usr/bin") ||
		strings.HasPrefix(absPath, "/sys") ||
		strings.HasPrefix(absPath, "/proc")) {
		return false
	}

	// 检查路径是否存在且可访问
	info, err := os.Stat(cleanPath)
	if err != nil {
		return false
	}

	// 必须是目录
	return info.IsDir()
}

// addToRecentPaths 添加到最近路径列表
func (s *SaveService) addToRecentPaths(path string) {
	// 检查是否已存在
	for i, recent := range s.recentPaths {
		if recent == path {
			// 移动到首位
			s.recentPaths = append([]string{path}, append(s.recentPaths[:i], s.recentPaths[i+1:]...)...)
			return
		}
	}

	// 添加到首位
	s.recentPaths = append([]string{path}, s.recentPaths...)

	// 限制数量
	if len(s.recentPaths) > 10 {
		s.recentPaths = s.recentPaths[:10]
	}
}

// addLog 添加操作日志
func (s *SaveService) addLog(operation, details string, success bool, errorMsg string) {
	log := OperationLog{
		ID:        uuid.New().String(),
		Timestamp: time.Now(),
		Operation: operation,
		Details:   details,
		Success:   success,
		Error:     errorMsg,
	}

	s.logs = append(s.logs, log)

	// 限制日志数量
	if len(s.logs) > 1000 {
		s.logs = s.logs[100:] // 保留最近900条
	}
}

// scanSaves 扫描存档目录
func (s *SaveService) scanSaves() ([]SaveInfo, error) {
	var saves []SaveInfo

	if !s.isValidPath(s.currentPath) {
		return saves, fmt.Errorf("当前路径无效: %s", s.currentPath)
	}

	entries, err := os.ReadDir(s.currentPath)
	if err != nil {
		return saves, err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		savePath := filepath.Join(s.currentPath, entry.Name())
		saveInfo := s.parseSaveDirectory(savePath)
		saves = append(saves, saveInfo)
	}

	return saves, nil
}

// parseSaveDirectory 解析存档目录
func (s *SaveService) parseSaveDirectory(savePath string) SaveInfo {
	saveInfo := SaveInfo{
		ID:      s.generateSaveID(savePath),
		Name:    filepath.Base(savePath),
		Path:    savePath,
		IsValid: false,
	}

	// 获取目录信息
	if info, err := os.Stat(savePath); err == nil {
		saveInfo.LastPlayed = info.ModTime()
		saveInfo.Size = s.calculateDirectorySize(savePath)
	}

	// 查找主存档文件
	saveFile := s.findMainSaveFile(savePath)
	if saveFile == "" {
		saveInfo.Error = "未找到有效的存档文件"
		return saveInfo
	}

	// 解析存档文件
	gameData, err := s.parseSaveFile(saveFile)
	if err != nil {
		saveInfo.Error = "解析存档文件失败: " + err.Error()
		return saveInfo
	}

	// 填充存档信息
	saveInfo.PlayerName = gameData.Player.Name
	saveInfo.FarmName = gameData.Player.FarmName
	saveInfo.Money = gameData.Player.Money
	saveInfo.Level = gameData.Player.Level
	saveInfo.Day = gameData.DayOfMonth
	saveInfo.Season = gameData.Season
	saveInfo.Year = gameData.Year
	saveInfo.PlayTime = s.formatPlayTime(gameData.Player.MillisecondsPlayed)
	saveInfo.IsValid = true

	return saveInfo
}

// findMainSaveFile 查找主存档文件
func (s *SaveService) findMainSaveFile(savePath string) string {
	// 查找以存档名命名的主文件
	saveName := filepath.Base(savePath)
	mainFile := filepath.Join(savePath, saveName)

	if _, err := os.Stat(mainFile); err == nil {
		return mainFile
	}

	// 查找其他可能的存档文件
	entries, err := os.ReadDir(savePath)
	if err != nil {
		return ""
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		// 查找没有扩展名或扩展名为.xml的文件，且不是临时文件
		if !strings.Contains(name, ".") || strings.HasSuffix(name, ".xml") {
			if !strings.HasPrefix(name, "SaveGameInfo") && !strings.HasSuffix(name, "_old") {
				return filepath.Join(savePath, name)
			}
		}
	}

	return ""
}

// parseSaveFile 解析存档文件
func (s *SaveService) parseSaveFile(filePath string) (*StardewSaveGame, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	var saveGame StardewSaveGame
	if err := xml.Unmarshal(data, &saveGame); err != nil {
		return nil, err
	}

	return &saveGame, nil
}

// formatPlayTime 格式化游戏时间
func (s *SaveService) formatPlayTime(milliseconds int64) string {
	if milliseconds <= 0 {
		return "0小时"
	}

	hours := milliseconds / (1000 * 60 * 60)
	minutes := (milliseconds % (1000 * 60 * 60)) / (1000 * 60)

	if hours > 0 {
		return fmt.Sprintf("%d小时%d分钟", hours, minutes)
	}
	return fmt.Sprintf("%d分钟", minutes)
}

// calculateDirectorySize 计算目录大小
func (s *SaveService) calculateDirectorySize(dirPath string) int64 {
	var size int64

	filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() {
			size += info.Size()
		}
		return nil
	})

	return size
}

// generateSaveID 生成存档ID
func (s *SaveService) generateSaveID(savePath string) string {
	// 使用路径的相对部分作为ID的基础
	relPath, _ := filepath.Rel(s.currentPath, savePath)
	// 简单的ID生成，实际项目中可能需要更复杂的方案
	return strings.ReplaceAll(relPath, string(filepath.Separator), "_")
}

// getSaveByID 根据ID获取存档
func (s *SaveService) getSaveByID(id string) (*SaveInfo, error) {
	saves, err := s.scanSaves()
	if err != nil {
		return nil, err
	}

	for _, save := range saves {
		if save.ID == id {
			return &save, nil
		}
	}

	return nil, fmt.Errorf("存档不存在")
}

// createBackup 创建备份
func (s *SaveService) createBackup(sourcePath, backupPath string) error {
	return s.createZipFromDirectory(sourcePath, backupPath)
}

// createZipFromDirectory 从目录创建ZIP文件
func (s *SaveService) createZipFromDirectory(sourceDir, zipPath string) error {
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	return filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// 计算相对路径
		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}

		// 跳过根目录
		if relPath == "." {
			return nil
		}

		// 标准化路径分隔符
		relPath = strings.ReplaceAll(relPath, "\\", "/")

		if info.IsDir() {
			// 创建目录条目
			relPath += "/"
			_, err := zipWriter.Create(relPath)
			return err
		}

		// 创建文件条目
		writer, err := zipWriter.Create(relPath)
		if err != nil {
			return err
		}

		// 复制文件内容
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		_, err = io.Copy(writer, file)
		return err
	})
}

// addDirectoryToZip 将目录添加到ZIP
func (s *SaveService) addDirectoryToZip(zipWriter *zip.Writer, sourceDir, dirName string) error {
	return filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}

		if relPath == "." {
			return nil
		}

		// 添加目录前缀
		zipPath := filepath.Join(dirName, relPath)
		zipPath = strings.ReplaceAll(zipPath, "\\", "/")

		if info.IsDir() {
			zipPath += "/"
			_, err := zipWriter.Create(zipPath)
			return err
		}

		writer, err := zipWriter.Create(zipPath)
		if err != nil {
			return err
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		_, err = io.Copy(writer, file)
		return err
	})
}

// extractAndImportSave 解压并导入存档
func (s *SaveService) extractAndImportSave(zipPath string, overwrite, backup bool) (interface{}, error) {
	// 打开ZIP文件
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, fmt.Errorf("打开ZIP文件失败: %v", err)
	}
	defer reader.Close()

	// 检查ZIP内容，找到存档目录
	var saveDir string
	var rootFiles []string

	for _, file := range reader.File {
		if file.FileInfo().IsDir() {
			continue
		}

		dir := filepath.Dir(file.Name)
		if dir == "." {
			rootFiles = append(rootFiles, file.Name)
		} else {
			if saveDir == "" {
				saveDir = strings.Split(dir, "/")[0]
			}
		}
	}

	// 确定目标目录名
	var targetName string
	if saveDir != "" {
		targetName = saveDir
	} else {
		// 如果文件在根目录，从文件名推断存档名
		if len(rootFiles) > 0 {
			baseName := filepath.Base(zipPath)
			targetName = strings.TrimSuffix(baseName, filepath.Ext(baseName))
		} else {
			return nil, fmt.Errorf("无效的存档文件结构")
		}
	}

	targetPath := filepath.Join(s.currentPath, targetName)

	// 检查是否存在同名存档
	if _, err := os.Stat(targetPath); err == nil {
		if !overwrite {
			return nil, fmt.Errorf("存档已存在: %s", targetName)
		}

		// 备份现有存档
		if backup {
			backupPath := filepath.Join("./backups", fmt.Sprintf("%s_backup_%d.zip", targetName, time.Now().Unix()))
			if err := s.createBackup(targetPath, backupPath); err != nil {
				return nil, fmt.Errorf("备份现有存档失败: %v", err)
			}
		}

		// 删除现有存档
		if err := os.RemoveAll(targetPath); err != nil {
			return nil, fmt.Errorf("删除现有存档失败: %v", err)
		}
	}

	// 创建目标目录
	if err := os.MkdirAll(targetPath, 0755); err != nil {
		return nil, fmt.Errorf("创建目标目录失败: %v", err)
	}

	// 解压文件
	for _, file := range reader.File {
		if err := s.extractFile(file, targetPath, saveDir); err != nil {
			return nil, fmt.Errorf("解压文件失败: %v", err)
		}
	}

	// 返回导入结果
	return gin.H{
		"name":      targetName,
		"path":      targetPath,
		"overwrite": overwrite,
		"backup":    backup,
	}, nil
}

// extractFile 解压单个文件
func (s *SaveService) extractFile(file *zip.File, targetPath, saveDir string) error {
	reader, err := file.Open()
	if err != nil {
		return err
	}
	defer reader.Close()

	// 计算目标路径
	var filePath string
	if saveDir != "" && strings.HasPrefix(file.Name, saveDir+"/") {
		// 去掉顶级目录前缀
		relativePath := strings.TrimPrefix(file.Name, saveDir+"/")
		filePath = filepath.Join(targetPath, relativePath)
	} else {
		filePath = filepath.Join(targetPath, file.Name)
	}

	// 确保目录存在
	if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
		return err
	}

	// 跳过目录
	if file.FileInfo().IsDir() {
		return nil
	}

	// 创建文件
	writer, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer writer.Close()

	// 复制内容
	_, err = io.Copy(writer, reader)
	return err
}
