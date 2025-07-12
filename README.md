# 🌾 星露谷物语存档管理器

一个专为星露谷物语设计的存档管理Web应用，采用像素化UI风格，提供完整的存档管理、导入导出、冲突处理等功能。

![Stars](https://img.shields.io/github/stars/username/stardew-save-manager)
![License](https://img.shields.io/github/license/username/stardew-save-manager)
![Version](https://img.shields.io/github/v/release/username/stardew-save-manager)

## ✨ 功能特色

### 🎮 存档管理
- 📁 自动扫描和展示存档列表
- 🔍 存档详细信息预览（玩家名、农场名、金钱、等级、游戏日期等）
- 🗂️ 智能解析星露谷物语存档格式
- 📊 存档状态和有效性验证

### 📥📤 导入导出
- 📦 存档导出为ZIP压缩包
- 📲 拖拽上传导入存档
- 🔄 批量导入导出操作
- 💾 自动备份现有存档
- 🛡️ 文件类型和大小安全验证

### ⚔️ 冲突处理
- 🔍 导入时自动检测同名存档
- 📋 智能比对存档关键信息
- ⚖️ 友好的冲突解决选项（覆盖/保留/合并）
- 🔄 一键还原备份存档

### 📂 路径管理
- 🎯 自定义存档目录路径
- 📍 路径有效性实时验证
- 📝 最近使用路径快速选择
- 🔒 路径安全性检查

### 📊 监控日志
- 📈 详细的操作历史记录
- 🎯 操作状态和错误信息
- 📄 分页浏览和筛选
- 🕒 时间戳和操作分类

### 🎨 用户体验
- 🌿 星露谷物语像素化UI设计
- 📱 PC和移动端自适应
- 🔔 优雅的通知和进度提示
- ⚡ 流畅的交互和动画效果

## 🏗️ 技术架构

### 后端 (Go + Gin)
- **框架**: Gin Web Framework
- **存档解析**: XML解析星露谷物语存档格式
- **文件处理**: ZIP压缩解压、文件操作
- **API设计**: RESTful API接口
- **安全性**: 路径验证、文件类型检查

### 前端 (React + Tailwind CSS)
- **框架**: React 18 + Vite
- **样式**: Tailwind CSS + 自定义像素化组件
- **状态管理**: React Hooks
- **路由**: React Router
- **HTTP客户端**: Axios
- **UI组件**: Lucide React图标

### 部署 (Docker)
- **容器化**: Docker + Docker Compose
- **Web服务器**: Nginx (前端)
- **反向代理**: 前后端分离部署
- **数据持久化**: Volume挂载

## 🚀 快速开始

### 环境要求
- Docker & Docker Compose (Docker部署)
- Ubuntu 20.04+ / Debian 11+ (一键部署)
- Go 1.21+ (开发环境)
- Node.js 18+ (开发环境)

### Ubuntu一键部署（推荐 🌟）

适用于Ubuntu/Debian系统的一键部署解决方案，自动安装所有依赖并配置生产环境。

#### 使用修复版脚本（推荐）
```bash
# 克隆项目
git clone https://github.com/Yeaowo/stardew-save-manager.git
cd stardew-save-manager

# 运行修复版部署脚本（需要 sudo 权限）
sudo ./deploy_fixed.sh
```

#### 使用原版脚本
```bash
# 运行原版部署脚本
sudo ./deploy.sh
```

**修复版脚本优势**:
- ✅ 网络连接检查
- ✅ 磁盘空间验证
- ✅ 增强错误处理
- ✅ 自动清理功能
- ✅ 详细日志查看
- ✅ 更好的故障排除

2. **访问应用**
- Web界面: http://localhost
- API地址: http://localhost/api

**一键部署功能：**
- ✅ 自动安装 Go 1.21.5 和 Node.js 18
- ✅ 自动配置 Nginx 反向代理
- ✅ 使用 Supervisor 进程管理
- ✅ 配置防火墙安全规则
- ✅ 创建系统服务用户
- ✅ 提供管理脚本（启动/停止/重启/状态检查）
- ✅ 详细的日志记录和监控

**📖 详细部署文档**: [DEPLOYMENT.md](DEPLOYMENT.md)  
**🔧 部署问题修复**: [DEPLOYMENT_FIXES.md](DEPLOYMENT_FIXES.md)

### 使用Docker部署

1. **克隆项目**
```bash
git clone https://github.com/Yeaowo/stardew-save-manager.git
cd stardew-save-manager
```

2. **启动服务**
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

3. **访问应用**
- 前端应用: http://localhost:3000
- 后端API: http://localhost:8080

### 本地开发

#### 后端开发
```bash
cd backend

# 安装依赖
go mod download

# 运行开发服务器
go run .
```

#### 前端开发
```bash
cd frontend

# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

## 📁 项目结构

```
stardew-save-manager/
├── backend/                 # Go后端服务
│   ├── main.go             # 主入口文件
│   ├── models.go           # 数据模型定义
│   ├── service.go          # 业务逻辑服务
│   ├── utils.go            # 工具函数
│   ├── auth.go             # 认证服务
│   ├── go.mod              # Go模块配置
│   └── Dockerfile          # 后端Docker配置
├── frontend/               # React前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── contexts/       # React上下文
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── utils/          # 工具函数
│   │   ├── types/          # 类型定义
│   │   └── assets/         # 静态资源
│   ├── package.json        # 前端依赖配置
│   ├── tailwind.config.js  # Tailwind配置
│   ├── vite.config.js      # Vite配置
│   ├── nginx.conf          # Nginx配置
│   └── Dockerfile          # 前端Docker配置
├── valley_saves/           # 默认存档目录
├── deploy.sh               # Ubuntu一键部署脚本
├── deploy_fixed.sh         # Ubuntu一键部署脚本（修复版）
├── DEPLOYMENT.md           # 部署详细文档
├── DEPLOYMENT_FIXES.md     # 部署问题修复文档
├── docker-compose.yml      # Docker Compose配置
└── README.md              # 项目文档
```

## 🎯 API接口

### 路径管理
- `GET /api/current-path` - 获取当前存档路径
- `POST /api/set-path` - 设置存档路径
- `GET /api/validate-path` - 验证路径有效性

### 存档管理
- `GET /api/saves` - 获取存档列表
- `GET /api/saves/:id` - 获取存档详情
- `DELETE /api/saves/:id` - 删除存档
- `POST /api/saves/import` - 导入存档
- `GET /api/saves/:id/export` - 导出存档
- `POST /api/saves/batch-export` - 批量导出
- `DELETE /api/saves/batch-delete` - 批量删除

### 操作日志
- `GET /api/logs` - 获取操作日志

### 健康检查
- `GET /api/health` - 服务健康状态

## 🔧 配置说明

### 存档路径配置
应用支持自定义存档路径，默认优先使用项目同级目录的 `stardew-multiplayer-docker/valley_saves`：

**默认路径优先级**：
1. `../stardew-multiplayer-docker/valley_saves` (主要目标路径)
2. `../valley_saves` (备用路径1)
3. `./valley_saves` (备用路径2)

**星露谷物语官方存档位置**：
- **Windows**: `%APPDATA%\StardewValley\Saves`
- **macOS**: `~/.config/StardewValley/Saves`
- **Linux**: `~/.config/StardewValley/Saves`

### Docker配置
- 后端端口: 8080
- 前端端口: 3000
- 主要存档目录挂载: `../stardew-multiplayer-docker/valley_saves`
- 备用存档目录挂载: `./valley_saves`
- 下载目录: `./backend/downloads`
- 备份目录: `./backend/backups`

## 🎨 UI设计

### 设计理念
- 🌿 还原星露谷物语的像素化美学
- 🎨 温暖的大地色调配色方案
- 📐 像素化的按钮、卡片和界面元素
- ✨ 平滑的动画和过渡效果

### 主题色彩
- **绿色系**: 主要操作按钮、成功状态
- **棕色系**: 背景、边框、土地元素
- **蓝色系**: 信息提示、天空元素
- **黄色系**: 强调色、金币、阳光元素

## 🛡️ 安全特性

- 🔒 路径遍历攻击防护
- 📁 文件类型白名单验证
- 📏 文件大小限制（默认100MB）
- 🛡️ 恶意文件上传防护
- 💾 自动备份机制
- 🔍 输入验证和清理

## 🧪 测试

```bash
# 后端测试
cd backend
go test -v ./...

# 前端测试
cd frontend
npm run test

# 端到端测试
npm run test:e2e
```

## 📝 开发指南

### 添加新功能
1. 后端添加API接口（service.go）
2. 前端添加对应的API调用（utils/api.js）
3. 创建React组件（components/）
4. 添加路由和导航

### 自定义样式
- 修改 `frontend/tailwind.config.js` 调整主题色彩
- 在 `frontend/src/index.css` 中添加自定义CSS类
- 使用现有的像素化组件类

### 数据模型扩展
- 修改 `backend/models.go` 添加新的数据结构
- 更新前端类型定义 `frontend/src/types/`

## 📋 待开发功能

- [ ] 🔍 高级存档搜索和筛选
- [ ] 📊 存档数据可视化图表
- [ ] 🌐 多语言国际化支持
- [ ] 🔐 用户认证和权限管理
- [ ] ☁️ 云存储集成
- [ ] 📱 PWA支持
- [ ] 🎮 游戏内集成插件

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [星露谷物语](https://www.stardewvalley.net/) - 灵感来源
- [ConcernedApe](https://twitter.com/ConcernedApe) - 游戏创作者
- [Gin Web Framework](https://gin-gonic.com/) - Go Web框架
- [React](https://reactjs.org/) - 前端框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

## 📞 联系方式

- 作者: [Your Name]
- 邮箱: your.email@example.com
- 项目链接: https://github.com/username/stardew-save-manager

---

🌾 **享受你的农场生活！** 🌾