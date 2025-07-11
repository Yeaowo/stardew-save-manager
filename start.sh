#!/bin/bash

echo "🌾 星露谷物语存档管理器启动脚本"
echo "=================================="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p valley_saves
mkdir -p ../stardew-multiplayer-docker/valley_saves
mkdir -p backend/downloads
mkdir -p backend/backups
mkdir -p backend/temp

# 构建并启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查后端健康状态
echo "🏥 检查后端健康状态..."
if curl -f http://localhost:8080/api/health &> /dev/null; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务异常"
fi

echo ""
echo "🎉 启动完成！"
echo "=================================="
echo "📱 前端应用: http://localhost:3000"
echo "🔧 后端API: http://localhost:8080"
echo "📄 API文档: http://localhost:8080/api/health"
echo ""
echo "💡 使用 'docker-compose logs -f' 查看日志"
echo "🛑 使用 'docker-compose down' 停止服务"
echo "🌾 享受你的农场管理体验！"