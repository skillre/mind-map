# 构建阶段
FROM node:18-alpine AS build-stage

WORKDIR /app

# 复制package文件
COPY web/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY web/ .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine AS production-stage

# 安装curl用于健康检查
RUN apk add --no-cache curl

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 复制构建产物
COPY --from=build-stage /app/dist .
COPY index.html .

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 创建日志目录
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]