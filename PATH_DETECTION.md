# 🔍 智能存档路径检测功能

本文档说明星露谷物语存档管理器的智能路径检测机制。

## 🎯 功能概述

系统会自动检测并选择最合适的存档路径，确保与其他相关项目（如 `stardew-multiplayer-docker`）的兼容性。

## 📁 路径优先级

系统按以下优先级顺序查找存档路径：

### 1. 主要目标路径 (优先级1)
```
../stardew-multiplayer-docker/valley_saves
```
- **用途**: 与 stardew-multiplayer-docker 项目共享存档
- **场景**: 多人游戏服务器存档管理
- **特点**: 自动检测和创建

### 2. 备用路径1 (优先级2)
```
../valley_saves
```
- **用途**: 项目同级目录存档
- **场景**: 简化的存档管理
- **特点**: 通用备用选项

### 3. 备用路径2 (优先级3)
```
./valley_saves
```
- **用途**: 项目内部存档
- **场景**: 独立运行时的默认选择
- **特点**: 始终可用

## 🔧 工作机制

### 启动时路径检测
1. **路径扫描**: 按优先级顺序检查每个路径
2. **存在性验证**: 检查路径是否存在且为目录
3. **自动创建**: 对主要目标路径尝试自动创建
4. **降级处理**: 如果高优先级路径不可用，自动降级到下一个
5. **最终确定**: 使用第一个可用的有效路径

### 路径安全验证
- ✅ 支持合法的相对路径（包含 `..`）
- ❌ 阻止访问系统关键目录（`/etc`, `/bin` 等）
- ✅ 路径清理和标准化
- ✅ 绝对路径安全检查

## 🚀 API 接口

### 获取路径信息
```http
GET /api/path-info
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "currentPath": "../stardew-multiplayer-docker/valley_saves",
    "pathStatus": [
      {
        "path": "../stardew-multiplayer-docker/valley_saves",
        "priority": 1,
        "exists": true,
        "isDir": true,
        "current": true
      },
      {
        "path": "../valley_saves", 
        "priority": 2,
        "exists": false,
        "isDir": false,
        "error": "stat ../valley_saves: no such file or directory"
      },
      {
        "path": "./valley_saves",
        "priority": 3,
        "exists": true,
        "isDir": true,
        "current": false
      }
    ]
  }
}
```

### 获取当前路径
```http
GET /api/current-path
```

### 设置自定义路径
```http
POST /api/set-path
Content-Type: application/json

{
  "path": "/custom/path/to/saves"
}
```

### 验证路径
```http
GET /api/validate-path?path=/path/to/validate
```

## 🧪 测试功能

使用提供的测试脚本验证路径检测：

```bash
./test_path_detection.sh
```

测试内容包括：
- ✅ 目录创建测试
- ✅ 路径检测测试  
- ✅ API端点测试
- ✅ 服务启动测试

## 🐳 Docker 配置

Docker Compose 自动挂载多个路径：

```yaml
volumes:
  - ./valley_saves:/app/valley_saves
  - ../stardew-multiplayer-docker/valley_saves:/app/stardew-multiplayer-docker/valley_saves
```

## 💡 使用建议

### 多人游戏场景
如果您使用 `stardew-multiplayer-docker` 运行多人游戏服务器：
1. 确保两个项目在同级目录
2. 系统会自动检测并使用共享的存档目录
3. 支持统一的存档管理

### 单机游戏场景  
如果只是管理个人存档：
1. 系统会自动降级到本地路径
2. 无需额外配置
3. 开箱即用

### 自定义路径
通过 Web 界面或 API 可以设置任意自定义路径：
1. 访问"路径设置"页面
2. 输入目标路径
3. 系统自动验证并切换

## 🔒 安全特性

- **路径遍历防护**: 防止 `../../../etc/passwd` 类型的攻击
- **系统目录保护**: 禁止访问关键系统目录
- **权限检查**: 验证路径的读写权限
- **输入验证**: 清理和标准化所有路径输入

## 📝 常见问题

**Q: 为什么优先使用 `stardew-multiplayer-docker/valley_saves`？**
A: 为了与多人游戏服务器项目保持存档同步，实现统一管理。

**Q: 如果目标路径创建失败怎么办？**
A: 系统会自动降级到备用路径，确保服务正常启动。

**Q: 可以手动指定路径吗？**
A: 可以，通过 Web 界面的"路径设置"或直接调用 API 接口。

**Q: 路径变更会影响现有数据吗？**  
A: 不会，只是切换读取位置，原有数据保持不变。