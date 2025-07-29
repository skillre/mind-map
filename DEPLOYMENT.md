# Docker部署指南

## 概述

本指南提供了完整的Docker部署方案，支持生产环境、开发环境和反向代理三种部署模式，并集成了GitHub存储功能。

## 项目结构

```
mind-map/
├── docker-compose.yml      # Docker Compose配置
├── Dockerfile             # 生产环境Dockerfile
├── Dockerfile.dev         # 开发环境Dockerfile
├── nginx/
│   ├── nginx.conf         # Nginx配置（容器内）
│   └── proxy.conf         # 反向代理Nginx配置
├── deploy.sh              # 一键部署脚本
├── .env.example           # 环境变量示例
└── GITHUB_STORAGE_GUIDE.md # GitHub存储功能指南
```

## 快速开始

### 1. 环境准备

确保已安装：
- Docker 20.10+
- Docker Compose 2.0+

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑.env文件，根据需要修改配置
```

### 3. 一键部署

使用部署脚本可以快速启动不同环境：

```bash
# 生产环境部署
./deploy.sh prod up

# 开发环境部署
./deploy.sh dev up

# 反向代理部署（带HTTPS支持）
./deploy.sh proxy up
```

## 部署模式详解

### 生产环境（prod）
- 端口：8080
- 构建优化：多阶段构建，最小镜像
- 性能：启用Gzip压缩、缓存优化
- 健康检查：自动重启

### 开发环境（dev）
- 端口：8081
- 热重载：支持代码修改自动刷新
- 调试：详细日志输出
- 构建：开发依赖包含

### 反向代理（proxy）
- 端口：80/443
- HTTPS：SSL/TLS支持
- 负载均衡：支持多实例
- 安全：安全头、防攻击

## 常用命令

### 容器管理

```bash
# 启动服务
./deploy.sh [prod|dev|proxy] up

# 停止服务
./deploy.sh [prod|dev|proxy] down

# 重启服务
./deploy.sh [prod|dev|proxy] restart

# 查看日志
./deploy.sh [prod|dev|proxy] logs

# 查看状态
./deploy.sh [prod|dev|proxy] status

# 清理所有容器和镜像
./deploy.sh [prod|dev|proxy] clean
```

### Docker Compose直接操作

```bash
# 生产环境
docker-compose up -d --build

# 开发环境
docker-compose --profile dev up -d --build

# 反向代理
docker-compose --profile proxy up -d --build
```

## 配置说明

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | production |
| PORT | 应用端口 | 8080 |
| GITHUB_OWNER | GitHub用户名 | - |
| GITHUB_REPO | GitHub仓库名 | - |
| GITHUB_TOKEN | GitHub访问令牌 | - |
| ENABLE_HTTPS | 启用HTTPS | false |

### 端口映射

| 服务 | 主机端口 | 容器端口 |
|------|----------|----------|
| mind-map-prod | 8080 | 80 |
| mind-map-dev | 8081 | 8080 |
| nginx-proxy | 80/443 | 80/443 |

## GitHub存储集成

新的Docker部署方案完全支持GitHub存储功能：

1. **配置GitHub存储**：
   - 在.env文件中设置GitHub相关变量
   - 或在应用运行时通过UI配置

2. **权限要求**：
   - 需要GitHub个人访问令牌
   - 仓库需要读写权限

3. **使用说明**：
   - 参考GITHUB_STORAGE_GUIDE.md

## 性能优化

### 构建优化
- 多阶段构建减少镜像大小
- 使用Alpine Linux最小化基础镜像
- 缓存优化减少构建时间

### 运行时优化
- Gzip压缩减少传输大小
- 静态资源缓存1个月
- 健康检查确保可用性

### 安全优化
- 非root用户运行应用
- 安全头配置
- HTTPS强制重定向

## 故障排除

### 常见问题

1. **端口冲突**：
   ```bash
   # 检查端口占用
   lsof -i :8080
   # 修改.env中的端口配置
   ```

2. **权限问题**：
   ```bash
   # 使部署脚本可执行
   chmod +x deploy.sh
   ```

3. **构建失败**：
   ```bash
   # 清理缓存重新构建
   docker system prune -f
   ./deploy.sh [mode] clean
   ./deploy.sh [mode] up
   ```

4. **GitHub存储连接失败**：
   - 检查网络连接
   - 验证GitHub令牌权限
   - 确认仓库存在且可访问

### 日志查看

```bash
# 查看应用日志
docker-compose logs mind-map-prod

# 查看Nginx日志
docker-compose logs nginx-proxy

# 实时查看日志
docker-compose logs -f
```

## 扩展功能

### 负载均衡
可以扩展docker-compose.yml添加多个实例：

```yaml
mind-map-prod-2:
  <<: *mind-map-prod
  ports:
    - "8082:80"
```

### 数据库集成
可以添加数据库服务：

```yaml
postgres:
  image: postgres:13-alpine
  environment:
    POSTGRES_DB: mindmap
    POSTGRES_USER: user
    POSTGRES_PASSWORD: password
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

## 更新和升级

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
./deploy.sh [mode] up

# 清理旧镜像
docker image prune -f
```

## 支持

如有问题，请查看日志或提交issue。