#!/bin/bash

echo "🔍 星露谷物语存档管理器 - 路径检测测试"
echo "========================================"

# 测试不同的路径场景

echo "📁 场景1: 创建主要目标路径"
mkdir -p ../stardew-multiplayer-docker/valley_saves
echo "✅ 已创建: ../stardew-multiplayer-docker/valley_saves"

echo ""
echo "📁 场景2: 创建备用路径"
mkdir -p ../valley_saves
mkdir -p ./valley_saves
echo "✅ 已创建备用路径"

echo ""
echo "📋 当前目录结构："
echo "当前目录: $(pwd)"
echo ""

echo "检查目标路径："
if [ -d "../stardew-multiplayer-docker/valley_saves" ]; then
    echo "✅ ../stardew-multiplayer-docker/valley_saves - 存在"
else
    echo "❌ ../stardew-multiplayer-docker/valley_saves - 不存在"
fi

if [ -d "../valley_saves" ]; then
    echo "✅ ../valley_saves - 存在"
else
    echo "❌ ../valley_saves - 不存在"
fi

if [ -d "./valley_saves" ]; then
    echo "✅ ./valley_saves - 存在"
else
    echo "❌ ./valley_saves - 不存在"
fi

echo ""
echo "🚀 启动后端服务进行测试..."

# 如果在backend目录，先切换到正确位置
if [[ "$(basename $(pwd))" == "backend" ]]; then
    cd ..
fi

echo "从目录启动: $(pwd)"

# 进入backend目录启动服务
cd backend

echo "📦 安装Go依赖..."
go mod download

echo "🔧 启动后端服务..."
go run . &
SERVER_PID=$!

echo "⏳ 等待服务启动..."
sleep 3

echo "🧪 测试API端点..."

echo ""
echo "1. 测试路径信息API:"
curl -s http://localhost:8080/api/path-info | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8080/api/path-info

echo ""
echo ""
echo "2. 测试当前路径API:"
curl -s http://localhost:8080/api/current-path | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8080/api/current-path

echo ""
echo ""
echo "3. 测试健康检查:"
curl -s http://localhost:8080/api/health

echo ""
echo ""
echo "🛑 停止测试服务..."
kill $SERVER_PID 2>/dev/null

echo "✅ 路径检测测试完成！"