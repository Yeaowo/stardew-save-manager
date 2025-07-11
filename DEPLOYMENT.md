# 🌾 Stardew Save Manager - Ubuntu 一键部署指南

## 📋 目录

- [系统要求](#系统要求)
- [快速安装](#快速安装)
- [详细说明](#详细说明)
- [配置说明](#配置说明)
- [服务管理](#服务管理)
- [常见问题](#常见问题)
- [故障排除](#故障排除)
- [卸载指南](#卸载指南)

## 📊 系统要求

### 支持的操作系统
- Ubuntu 20.04 LTS 或更高版本
- Debian 11 或更高版本
- 其他基于 Debian 的发行版（未全面测试）

### 硬件要求
- **CPU**: x86_64 架构（AMD64）
- **内存**: 最低 1GB RAM，推荐 2GB 或更多
- **存储**: 最低 5GB 可用空间
- **网络**: 互联网连接（用于下载依赖）

### 系统权限
- 需要 `root` 用户权限或 `sudo` 权限
- 系统需要支持 systemd 服务管理

## 🚀 快速安装

### 1. 下载部署脚本

```bash
# 克隆项目仓库
git clone https://github.com/Yeaowo/stardew-save-manager.git
cd stardew-save-manager

# 或者直接下载脚本
wget https://raw.githubusercontent.com/Yeaowo/stardew-save-manager/main/deploy.sh
chmod +x deploy.sh
```

### 2. 运行部署脚本

```bash
# 使用 sudo 权限运行
sudo ./deploy.sh
```

### 3. 访问应用

部署完成后，在浏览器中访问：
- **Web 界面**: http://localhost
- **API 地址**: http://localhost/api

## 📚 详细说明

### 部署过程概览

部署脚本会自动执行以下步骤：

1. **系统检查**: 验证操作系统和架构兼容性
2. **更新系统**: 更新包管理器并安装基础工具
3. **创建用户**: 创建专用的 `stardew` 系统用户
4. **安装依赖**: 自动安装 Go 1.21.5 和 Node.js 18
5. **部署代码**: 复制应用代码到 `/opt/stardew-save-manager`
6. **构建应用**: 编译后端和构建前端
7. **配置服务**: 设置 Nginx 和 Supervisor
8. **配置防火墙**: 使用 UFW 配置安全规则
9. **启动服务**: 启动所有必要的服务
10. **验证部署**: 检查服务状态和连接性

### 安装的组件

| 组件 | 版本 | 用途 | 配置文件 |
|------|------|------|----------|
| Go | 1.21.5 | 后端运行时 | `/etc/profile.d/go.sh` |
| Node.js | 18.x | 前端构建工具 | - |
| Nginx | 最新稳定版 | Web 服务器和反向代理 | `/etc/nginx/sites-available/stardew-save-manager` |
| Supervisor | 最新版 | 进程管理 | `/etc/supervisor/conf.d/stardew-save-manager.conf` |
| UFW | 最新版 | 防火墙管理 | 系统默认配置 |

### 目录结构

```
/opt/stardew-save-manager/
├── backend/              # 后端源代码
├── frontend/             # 前端源代码和构建文件
│   └── dist/            # 前端构建输出
├── bin/                 # 编译后的二进制文件
│   └── stardew-backend  # 后端可执行文件
├── logs/                # 日志文件
│   └── backend.log      # 后端服务日志
├── data/                # 应用数据
├── backups/             # 备份文件
├── downloads/           # 下载文件
├── start.sh             # 启动脚本
├── stop.sh              # 停止脚本
├── restart.sh           # 重启脚本
└── status.sh            # 状态检查脚本
```

## ⚙️ 配置说明

### 端口配置

- **HTTP 端口**: 80（Nginx）
- **后端端口**: 8080（内部使用，不对外开放）
- **HTTPS 端口**: 443（预留，需手动配置 SSL）

### 服务用户

系统会创建一个名为 `stardew` 的专用用户来运行应用服务：
- **用户名**: `stardew`
- **主目录**: `/home/stardew`
- **Shell**: `/bin/bash`
- **权限**: 仅对项目目录有读写权限

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `JWT_SECRET` | 随机生成 | JWT 令牌加密密钥 |
| `PATH` | 包含 Go 路径 | 系统路径配置 |

### Nginx 配置特性

- **静态文件服务**: 直接服务前端文件
- **API 代理**: 转发 `/api/` 请求到后端
- **文件缓存**: 静态资源缓存优化
- **安全头**: 添加必要的安全 HTTP 头
- **下载支持**: 支持存档文件下载

### Supervisor 配置

- **自动启动**: 系统启动时自动启动服务
- **自动重启**: 服务异常时自动重启
- **日志管理**: 自动轮换日志文件
- **资源限制**: 防止资源过度使用

## 🔧 服务管理

### 使用管理脚本

项目提供了便捷的管理脚本：

```bash
# 启动服务
/opt/stardew-save-manager/start.sh

# 停止服务
/opt/stardew-save-manager/stop.sh

# 重启服务
/opt/stardew-save-manager/restart.sh

# 查看状态
/opt/stardew-save-manager/status.sh
```

### 使用系统命令

```bash
# 管理后端服务
sudo supervisorctl status stardew-backend
sudo supervisorctl start stardew-backend
sudo supervisorctl stop stardew-backend
sudo supervisorctl restart stardew-backend

# 管理 Nginx
sudo systemctl status nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx

# 查看服务组状态
sudo supervisorctl status stardew-save-manager:*
```

### 日志查看

```bash
# 查看后端日志
tail -f /opt/stardew-save-manager/logs/backend.log

# 查看 Nginx 访问日志
tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log

# 查看系统日志
journalctl -u nginx -f
journalctl -u supervisor -f
```

## ❓ 常见问题

### Q: 如何更改访问端口？

A: 修改 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/stardew-save-manager
# 修改 listen 80; 为其他端口
sudo nginx -t
sudo systemctl reload nginx
```

### Q: 如何配置 HTTPS？

A: 建议使用 Let's Encrypt：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书（替换 yourdomain.com）
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### Q: 如何配置自定义域名？

A: 修改 Nginx 配置：

```bash
sudo nano /etc/nginx/sites-available/stardew-save-manager
# 将 server_name localhost; 改为 server_name yourdomain.com;
sudo nginx -t
sudo systemctl reload nginx
```

### Q: 如何备份数据？

A: 备份以下重要目录：

```bash
# 创建备份脚本
sudo cp /opt/stardew-save-manager/data /backup/location/
sudo cp /opt/stardew-save-manager/logs /backup/location/
sudo cp /opt/stardew-save-manager/backups /backup/location/
```

### Q: 如何更新应用？

A: 重新运行部署脚本或手动更新：

```bash
# 停止服务
sudo supervisorctl stop stardew-save-manager:*

# 更新代码
cd /opt/stardew-save-manager
sudo -u stardew git pull

# 重新构建
cd backend
sudo -u stardew /usr/local/go/bin/go build -o ../bin/stardew-backend .

cd ../frontend
sudo -u stardew npm install
sudo -u stardew npm run build

# 启动服务
sudo supervisorctl start stardew-save-manager:*
```

## 🔍 故障排除

### 服务无法启动

1. **检查端口占用**：
   ```bash
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :8080
   ```

2. **检查权限**：
   ```bash
   sudo ls -la /opt/stardew-save-manager/
   sudo chown -R stardew:stardew /opt/stardew-save-manager/
   ```

3. **检查依赖**：
   ```bash
   /usr/local/go/bin/go version
   node --version
   nginx -v
   ```

### 无法访问 Web 界面

1. **检查防火墙**：
   ```bash
   sudo ufw status
   sudo ufw allow 80/tcp
   ```

2. **检查 Nginx 配置**：
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

3. **检查网络连接**：
   ```bash
   curl -I http://localhost
   curl -I http://localhost/api/health
   ```

### 后端服务异常

1. **查看详细日志**：
   ```bash
   tail -n 100 /opt/stardew-save-manager/logs/backend.log
   sudo supervisorctl tail stardew-backend
   ```

2. **手动启动调试**：
   ```bash
   sudo -u stardew /opt/stardew-save-manager/bin/stardew-backend
   ```

3. **检查配置文件**：
   ```bash
   sudo nano /etc/supervisor/conf.d/stardew-save-manager.conf
   ```

### 构建失败

1. **清理缓存**：
   ```bash
   sudo -u stardew /usr/local/go/bin/go clean -cache
   sudo -u stardew npm cache clean --force
   ```

2. **重新安装依赖**：
   ```bash
   cd /opt/stardew-save-manager/backend
   sudo -u stardew /usr/local/go/bin/go mod download
   
   cd /opt/stardew-save-manager/frontend
   sudo rm -rf node_modules
   sudo -u stardew npm install
   ```

## 🗑️ 卸载指南

### 完全卸载

如需完全移除 Stardew Save Manager：

```bash
# 停止所有服务
sudo supervisorctl stop stardew-save-manager:*
sudo systemctl stop nginx

# 删除配置文件
sudo rm -f /etc/nginx/sites-enabled/stardew-save-manager
sudo rm -f /etc/nginx/sites-available/stardew-save-manager
sudo rm -f /etc/supervisor/conf.d/stardew-save-manager.conf

# 删除项目目录
sudo rm -rf /opt/stardew-save-manager

# 删除用户（可选）
sudo userdel -r stardew

# 重新加载服务
sudo supervisorctl reread
sudo supervisorctl update
sudo systemctl reload nginx

# 恢复默认站点（可选）
sudo systemctl enable nginx
```

### 保留数据卸载

如需保留用户数据：

```bash
# 备份数据
sudo cp -r /opt/stardew-save-manager/data ~/stardew-backup
sudo cp -r /opt/stardew-save-manager/backups ~/stardew-backup

# 然后执行完全卸载步骤
```

## 📞 技术支持

如果遇到问题，请按以下步骤获取帮助：

1. **查看日志文件**获取错误信息
2. **运行状态检查脚本**：`/opt/stardew-save-manager/status.sh`
3. **搜索已知问题**在项目的 GitHub Issues
4. **提交新问题**并附上相关日志和系统信息

### 系统信息收集

```bash
# 生成系统信息报告
echo "=== 系统信息 ===" > debug-info.txt
uname -a >> debug-info.txt
cat /etc/os-release >> debug-info.txt
echo "=== 服务状态 ===" >> debug-info.txt
sudo supervisorctl status >> debug-info.txt
sudo systemctl status nginx >> debug-info.txt
echo "=== 端口监听 ===" >> debug-info.txt
sudo netstat -tlnp | grep -E ":(80|8080)" >> debug-info.txt
echo "=== 最近错误日志 ===" >> debug-info.txt
tail -n 50 /opt/stardew-save-manager/logs/backend.log >> debug-info.txt
```

---

## 📝 更新日志

### v1.0 (2024-12)
- 初始版本发布
- 支持 Ubuntu 20.04+ 和 Debian 11+
- 自动安装 Go 1.21.5 和 Node.js 18
- 集成 Nginx 和 Supervisor
- 包含防火墙配置和安全设置

---

**🌾 享受您的星露谷存档管理之旅！**