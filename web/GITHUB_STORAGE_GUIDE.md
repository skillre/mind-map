# GitHub 仓库存储功能指南

## 功能概述
本项目已完成了GitHub仓库存储功能的二次开发，支持将思维导图文件保存到GitHub私人仓库，并提供实时保存和定时保存功能。

## 主要功能

### 1. GitHub存储配置
- 支持配置GitHub仓库所有者、仓库名称、访问令牌、分支名称和存储路径
- 提供配置验证和保存功能
- 支持自动保存开关

### 2. 文件管理
- 支持在GitHub仓库中创建、打开、保存、删除思维导图文件
- 支持文件列表查看和刷新
- 支持实时文件操作反馈

### 3. 存储模式切换
- 支持本地存储和GitHub存储两种模式无缝切换
- 切换时自动保存当前文件，防止数据丢失

### 4. 自动保存
- 支持开启/关闭自动保存功能
- 自动保存间隔可配置
- 保存状态实时反馈

## 文件结构

### 新增文件
- `src/api/githubStorage.js` - GitHub存储核心服务
- `src/pages/Edit/components/GitHubConfigDialog.vue` - GitHub配置对话框
- `src/pages/Edit/components/GitHubFileManager.vue` - GitHub文件管理器

### 修改文件
- `src/api/index.js` - 扩展存储逻辑，支持GitHub存储
- `src/store.js` - 添加GitHub存储状态管理
- `src/pages/Edit/components/Toolbar.vue` - 添加GitHub存储入口
- `src/lang/zh_cn.js` - 添加中文翻译

## 使用方法

### 1. 获取GitHub访问令牌
1. 登录GitHub
2. 进入 Settings > Developer settings > Personal access tokens
3. 创建新的token，选择`repo`权限
4. 复制生成的token

### 2. 配置GitHub存储
1. 点击工具栏上的"GitHub"按钮
2. 在弹出的配置对话框中填写：
   - 仓库所有者：你的GitHub用户名
   - 仓库名称：目标仓库名称
   - 访问令牌：刚才创建的token
   - 分支名称：默认`main`
   - 存储路径：文件存储的相对路径，如`mindmaps/`
3. 点击"保存配置"

### 3. 使用GitHub存储
- **新建文件**：点击"新建"按钮创建新的思维导图
- **保存文件**：点击"保存"按钮保存当前文件到GitHub
- **打开文件**：在文件列表中选择文件并点击打开
- **删除文件**：选择文件后点击删除按钮

### 4. 自动保存
- 在配置对话框中开启"自动保存"开关
- 文件修改后会自动保存到GitHub仓库

## 技术实现

### API接口
- 使用GitHub REST API v3
- 支持文件CRUD操作
- 自动处理Base64编码/解码

### 错误处理
- 网络异常处理
- 权限错误提示
- 文件冲突解决

### 性能优化
- 增量保存减少API调用
- 本地缓存优化
- 错误重试机制

## 注意事项

1. **权限要求**：确保token具有`repo`权限
2. **网络要求**：需要稳定的网络连接
3. **文件大小**：单个文件大小限制100MB
4. **API限制**：注意GitHub API调用频率限制

## 故障排除

### 常见问题
1. **401 Unauthorized**：检查token是否正确
2. **404 Not Found**：检查仓库是否存在
3. **网络超时**：检查网络连接

### 调试方法
1. 打开浏览器开发者工具
2. 查看Network标签中的API调用
3. 检查Console中的错误信息

## 后续扩展

- 支持多仓库切换
- 支持文件版本历史
- 支持协作编辑
- 支持文件分享链接