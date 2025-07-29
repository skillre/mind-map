#!/bin/bash

# Docker部署脚本
set -e

echo "🚀 开始部署思维导图应用..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：打印信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker和Docker Compose
if ! command -v docker &> /dev/null; then
    print_error "Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查.env文件
if [ ! -f .env ]; then
    print_warning ".env文件不存在，将使用默认配置"
    cp .env.example .env
    print_info "已创建.env文件，请根据需要修改配置"
fi

# 参数解析
MODE=${1:-prod}
ACTION=${2:-up}

case $MODE in
    "prod")
        print_info "使用生产环境配置"
        COMPOSE_FILE="docker-compose.yml"
        ;;
    "dev")
        print_info "使用开发环境配置"
        COMPOSE_FILE="docker-compose.yml"
        ;;
    "proxy")
        print_info "使用反向代理配置"
        COMPOSE_FILE="docker-compose.yml"
        ;;
    *)
        print_error "无效的环境模式: $MODE"
        echo "可用模式: prod, dev, proxy"
        exit 1
        ;;
esac

# 根据操作执行不同命令
case $ACTION in
    "up")
        print_info "启动容器..."
        if [ "$MODE" == "dev" ]; then
            docker-compose --profile dev up -d --build
        elif [ "$MODE" == "proxy" ]; then
            docker-compose --profile proxy up -d --build
        else
            docker-compose up -d --build
        fi
        ;;
    "down")
        print_info "停止并删除容器..."
        if [ "$MODE" == "dev" ]; then
            docker-compose --profile dev down
        elif [ "$MODE" == "proxy" ]; then
            docker-compose --profile proxy down
        else
            docker-compose down
        fi
        ;;
    "restart")
        print_info "重启容器..."
        if [ "$MODE" == "dev" ]; then
            docker-compose --profile dev restart
        elif [ "$MODE" == "proxy" ]; then
            docker-compose --profile proxy restart
        else
            docker-compose restart
        fi
        ;;
    "logs")
        print_info "查看日志..."
        if [ "$MODE" == "dev" ]; then
            docker-compose --profile dev logs -f
        elif [ "$MODE" == "proxy" ]; then
            docker-compose --profile proxy logs -f
        else
            docker-compose logs -f
        fi
        ;;
    "status")
        print_info "容器状态..."
        docker-compose ps
        ;;
    "clean")
        print_warning "清理所有容器和镜像..."
        docker-compose down --volumes --remove-orphans
        docker system prune -f
        ;;
    *)
        print_error "无效的操作: $ACTION"
        echo "可用操作: up, down, restart, logs, status, clean"
        exit 1
        ;;
esac

# 等待容器启动
if [ "$ACTION" == "up" ]; then
    print_info "等待容器启动..."
    sleep 5
    
    # 检查容器状态
    if docker-compose ps | grep -q "Up"; then
        print_info "✅ 部署成功！"
        
        case $MODE in
            "prod")
                print_info "生产环境访问地址: http://localhost:8080"
                ;;
            "dev")
                print_info "开发环境访问地址: http://localhost:8081"
                ;;
            "proxy")
                print_info "反向代理访问地址: http://localhost"
                ;;
        esac
    else
        print_error "❌ 部署失败，请检查日志"
        docker-compose logs
    fi
fi

print_info "部署完成！"