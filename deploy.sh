#!/bin/bash

# 🌾 Stardew Save Manager - Ubuntu 一键部署脚本
# 版本: v1.0
# 支持系统: Ubuntu 20.04+ / Debian 11+
# 作者: Stardew Save Manager Team

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="stardew-save-manager"
PROJECT_DIR="/opt/$PROJECT_NAME"
SERVICE_USER="stardew"
FRONTEND_PORT=3000
BACKEND_PORT=8080
GO_VERSION="1.21.5"
NODE_VERSION="18"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}===========================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}===========================================${NC}"
}

# 检查是否以 root 权限运行
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要 root 权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 检查系统环境
check_system() {
    log_header "检查系统环境"
    
    # 检查操作系统
    if [[ ! -f /etc/os-release ]]; then
        log_error "无法检测操作系统版本"
        exit 1
    fi
    
    source /etc/os-release
    log_info "检测到系统: $PRETTY_NAME"
    
    # 检查支持的系统
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        log_warning "此脚本主要针对 Ubuntu/Debian 系统测试"
        read -p "是否继续安装? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 检查系统架构
    ARCH=$(uname -m)
    log_info "系统架构: $ARCH"
    
    if [[ "$ARCH" != "x86_64" && "$ARCH" != "amd64" ]]; then
        log_warning "未测试的系统架构: $ARCH"
    fi
}

# 更新系统
update_system() {
    log_header "更新系统包"
    
    log_info "更新包管理器缓存..."
    apt update
    
    log_info "安装基础工具..."
    apt install -y curl wget git unzip software-properties-common \
                   build-essential ca-certificates gnupg lsb-release \
                   nginx supervisor ufw
}

# 创建系统用户
create_user() {
    log_header "创建系统用户"
    
    if id "$SERVICE_USER" &>/dev/null; then
        log_info "用户 $SERVICE_USER 已存在"
    else
        log_info "创建用户: $SERVICE_USER"
        useradd -r -s /bin/bash -d /home/$SERVICE_USER -m $SERVICE_USER
        log_success "用户 $SERVICE_USER 创建成功"
    fi
}

# 安装 Go
install_go() {
    log_header "安装 Go $GO_VERSION"
    
    # 检查是否已安装
    if command -v go &> /dev/null; then
        CURRENT_GO_VERSION=$(go version | cut -d ' ' -f 3)
        log_info "检测到已安装的 Go 版本: $CURRENT_GO_VERSION"
        
        if [[ "$CURRENT_GO_VERSION" == "go$GO_VERSION" ]]; then
            log_success "Go 版本正确，跳过安装"
            return
        fi
    fi
    
    log_info "下载 Go $GO_VERSION..."
    cd /tmp
    
    # 根据架构选择下载链接
    if [[ "$ARCH" == "x86_64" || "$ARCH" == "amd64" ]]; then
        GO_ARCH="amd64"
    elif [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
        GO_ARCH="arm64"
    else
        log_error "不支持的架构: $ARCH"
        exit 1
    fi
    
    wget -q https://go.dev/dl/go${GO_VERSION}.linux-${GO_ARCH}.tar.gz
    
    log_info "安装 Go..."
    rm -rf /usr/local/go
    tar -C /usr/local -xzf go${GO_VERSION}.linux-${GO_ARCH}.tar.gz
    
    # 设置环境变量
    echo 'export PATH=$PATH:/usr/local/go/bin' > /etc/profile.d/go.sh
    chmod +x /etc/profile.d/go.sh
    
    # 立即生效
    export PATH=$PATH:/usr/local/go/bin
    
    log_success "Go $GO_VERSION 安装完成"
    go version
}

# 安装 Node.js
install_nodejs() {
    log_header "安装 Node.js $NODE_VERSION"
    
    # 检查是否已安装
    if command -v node &> /dev/null; then
        CURRENT_NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
        log_info "检测到已安装的 Node.js 版本: v$CURRENT_NODE_VERSION"
        
        if [[ "$CURRENT_NODE_VERSION" -ge "$NODE_VERSION" ]]; then
            log_success "Node.js 版本满足要求，跳过安装"
            return
        fi
    fi
    
    log_info "添加 NodeSource 仓库..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    
    log_info "安装 Node.js..."
    apt install -y nodejs
    
    log_success "Node.js 安装完成"
    node --version
    npm --version
}

# 创建项目目录
create_project_dir() {
    log_header "创建项目目录"
    
    log_info "创建项目目录: $PROJECT_DIR"
    mkdir -p $PROJECT_DIR
    mkdir -p $PROJECT_DIR/logs
    mkdir -p $PROJECT_DIR/data
    mkdir -p $PROJECT_DIR/backups
    mkdir -p $PROJECT_DIR/downloads
    
    # 设置权限
    chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
    
    log_success "项目目录创建完成"
}

# 部署应用代码
deploy_application() {
    log_header "部署应用代码"
    
    # 获取当前脚本所在目录
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    log_info "复制应用代码到 $PROJECT_DIR"
    
    # 复制后端代码
    cp -r "$SCRIPT_DIR/backend" "$PROJECT_DIR/"
    cp -r "$SCRIPT_DIR/frontend" "$PROJECT_DIR/"
    
    # 复制配置文件
    if [[ -f "$SCRIPT_DIR/README.md" ]]; then
        cp "$SCRIPT_DIR/README.md" "$PROJECT_DIR/"
    fi
    
    # 设置权限
    chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_DIR
    
    log_success "应用代码部署完成"
}

# 构建后端
build_backend() {
    log_header "构建后端应用"
    
    cd "$PROJECT_DIR/backend"
    
    log_info "下载 Go 依赖..."
    sudo -u $SERVICE_USER /usr/local/go/bin/go mod download
    
    log_info "构建后端应用..."
    sudo -u $SERVICE_USER /usr/local/go/bin/go build -o ../bin/stardew-backend .
    
    log_success "后端构建完成"
}

# 构建前端
build_frontend() {
    log_header "构建前端应用"
    
    cd "$PROJECT_DIR/frontend"
    
    log_info "安装前端依赖..."
    sudo -u $SERVICE_USER npm install
    
    log_info "构建前端应用..."
    sudo -u $SERVICE_USER npm run build
    
    # 创建前端构建目录
    mkdir -p "$PROJECT_DIR/frontend/dist"
    
    log_success "前端构建完成"
}

# 配置 Nginx
configure_nginx() {
    log_header "配置 Nginx"
    
    log_info "创建 Nginx 配置文件..."
    
    cat > /etc/nginx/sites-available/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name localhost;
    
    # 前端静态文件
    location / {
        root $PROJECT_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
    
    # 下载文件
    location /downloads/ {
        alias $PROJECT_DIR/backend/downloads/;
        autoindex off;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    
    # 删除默认站点
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试 Nginx 配置
    nginx -t
    
    log_success "Nginx 配置完成"
}

# 配置 Supervisor
configure_supervisor() {
    log_header "配置 Supervisor"
    
    log_info "创建 Supervisor 配置文件..."
    
    cat > /etc/supervisor/conf.d/$PROJECT_NAME.conf << EOF
[program:stardew-backend]
command=$PROJECT_DIR/bin/stardew-backend
directory=$PROJECT_DIR/backend
user=$SERVICE_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$PROJECT_DIR/logs/backend.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=5
environment=PATH="/usr/local/go/bin:/usr/bin:/bin",JWT_SECRET="$(openssl rand -hex 32)"

[group:stardew-save-manager]
programs=stardew-backend
EOF
    
    log_success "Supervisor 配置完成"
}

# 配置防火墙
configure_firewall() {
    log_header "配置防火墙"
    
    log_info "配置 UFW 防火墙..."
    
    # 启用防火墙
    ufw --force enable
    
    # 允许 SSH
    ufw allow ssh
    
    # 允许 HTTP 和 HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # 只允许本地访问后端端口
    ufw allow from 127.0.0.1 to any port $BACKEND_PORT
    
    log_success "防火墙配置完成"
}

# 创建管理脚本
create_management_scripts() {
    log_header "创建管理脚本"
    
    # 创建启动脚本
    cat > "$PROJECT_DIR/start.sh" << 'EOF'
#!/bin/bash
echo "启动 Stardew Save Manager..."
sudo supervisorctl start stardew-save-manager:*
sudo systemctl start nginx
echo "服务启动完成！"
echo "访问地址: http://localhost"
EOF
    
    # 创建停止脚本
    cat > "$PROJECT_DIR/stop.sh" << 'EOF'
#!/bin/bash
echo "停止 Stardew Save Manager..."
sudo supervisorctl stop stardew-save-manager:*
echo "服务停止完成！"
EOF
    
    # 创建重启脚本
    cat > "$PROJECT_DIR/restart.sh" << 'EOF'
#!/bin/bash
echo "重启 Stardew Save Manager..."
sudo supervisorctl restart stardew-save-manager:*
sudo systemctl reload nginx
echo "服务重启完成！"
EOF
    
    # 创建状态检查脚本
    cat > "$PROJECT_DIR/status.sh" << 'EOF'
#!/bin/bash
echo "=== Stardew Save Manager 服务状态 ==="
echo
echo "--- Supervisor 状态 ---"
sudo supervisorctl status stardew-save-manager:*
echo
echo "--- Nginx 状态 ---"
sudo systemctl status nginx --no-pager -l
echo
echo "--- 端口监听状态 ---"
netstat -tlnp | grep -E ":(80|8080)\s"
echo
echo "--- 日志文件 ---"
echo "后端日志: $PROJECT_DIR/logs/backend.log"
echo "Nginx 日志: /var/log/nginx/"
EOF
    
    # 设置执行权限
    chmod +x "$PROJECT_DIR"/*.sh
    
    log_success "管理脚本创建完成"
}

# 启动服务
start_services() {
    log_header "启动服务"
    
    log_info "重新加载 Supervisor 配置..."
    supervisorctl reread
    supervisorctl update
    
    log_info "启动后端服务..."
    supervisorctl start stardew-save-manager:*
    
    log_info "启动 Nginx..."
    systemctl enable nginx
    systemctl restart nginx
    
    # 等待服务启动
    sleep 3
    
    log_success "服务启动完成"
}

# 验证部署
verify_deployment() {
    log_header "验证部署"
    
    log_info "检查服务状态..."
    
    # 检查后端服务
    if supervisorctl status stardew-backend | grep -q "RUNNING"; then
        log_success "后端服务运行正常"
    else
        log_error "后端服务启动失败"
        supervisorctl status stardew-backend
        return 1
    fi
    
    # 检查 Nginx
    if systemctl is-active --quiet nginx; then
        log_success "Nginx 运行正常"
    else
        log_error "Nginx 启动失败"
        systemctl status nginx
        return 1
    fi
    
    # 检查端口监听
    if netstat -tlnp | grep -q ":80\s"; then
        log_success "HTTP 端口 (80) 监听正常"
    else
        log_warning "HTTP 端口 (80) 未监听"
    fi
    
    if netstat -tlnp | grep -q ":$BACKEND_PORT\s"; then
        log_success "后端端口 ($BACKEND_PORT) 监听正常"
    else
        log_warning "后端端口 ($BACKEND_PORT) 未监听"
    fi
    
    # 测试 HTTP 连接
    log_info "测试 HTTP 连接..."
    if curl -s -f http://localhost/api/health > /dev/null; then
        log_success "HTTP API 响应正常"
    else
        log_warning "HTTP API 可能未就绪，请稍后手动测试"
    fi
}

# 显示部署完成信息
show_completion_info() {
    log_header "部署完成"
    
    echo -e "${GREEN}"
    echo "🎉 Stardew Save Manager 部署成功！"
    echo
    echo "📍 访问信息:"
    echo "   Web 界面: http://localhost"
    echo "   API 地址: http://localhost/api"
    echo
    echo "📂 项目目录: $PROJECT_DIR"
    echo "👤 服务用户: $SERVICE_USER"
    echo
    echo "🔧 管理命令:"
    echo "   启动服务: $PROJECT_DIR/start.sh"
    echo "   停止服务: $PROJECT_DIR/stop.sh"
    echo "   重启服务: $PROJECT_DIR/restart.sh"
    echo "   查看状态: $PROJECT_DIR/status.sh"
    echo
    echo "📝 日志文件:"
    echo "   后端日志: $PROJECT_DIR/logs/backend.log"
    echo "   Nginx 日志: /var/log/nginx/"
    echo
    echo "⚡ 系统服务:"
    echo "   后端服务: sudo supervisorctl status stardew-backend"
    echo "   Web 服务: sudo systemctl status nginx"
    echo
    echo "🔐 首次使用:"
    echo "   1. 打开浏览器访问 http://localhost"
    echo "   2. 注册第一个管理员账户"
    echo "   3. 配置星露谷存档路径"
    echo "   4. 开始管理您的存档！"
    echo -e "${NC}"
}

# 主函数
main() {
    log_header "🌾 Stardew Save Manager - Ubuntu 部署脚本"
    
    echo -e "${CYAN}"
    echo "此脚本将自动安装和配置 Stardew Save Manager"
    echo "包括 Go、Node.js、Nginx、Supervisor 等依赖"
    echo "请确保系统已连接到互联网"
    echo -e "${NC}"
    echo
    
    read -p "是否继续安装? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "安装已取消"
        exit 0
    fi
    
    # 执行安装步骤
    check_root
    check_system
    update_system
    create_user
    install_go
    install_nodejs
    create_project_dir
    deploy_application
    build_backend
    build_frontend
    configure_nginx
    configure_supervisor
    configure_firewall
    create_management_scripts
    start_services
    verify_deployment
    show_completion_info
    
    log_success "🎉 部署完成！请访问 http://localhost 开始使用"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"