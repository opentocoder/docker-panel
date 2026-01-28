# Docker Panel

Docker 管理 Web 界面 - 使用 Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui 构建

## 功能特性

- **用户认证**: 注册、登录、JWT Token 认证、角色权限控制
- **容器管理**: 列表、启动、停止、重启、删除、日志查看
- **镜像管理**: 列表、拉取、删除、清理未使用镜像
- **网络管理**: 列表、创建、删除
- **卷管理**: 列表、创建、删除、清理悬空卷
- **Compose 管理**: 项目列表、启动、停止
- **仪表盘**: 系统统计、Docker 信息
- **主题切换**: 亮色/暗色模式

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT (jose) + bcryptjs
- **Docker**: dockerode

## 快速开始

```bash
# 克隆项目
git clone <repo-url>
cd docker-panel

# 安装依赖
npm install

# 设置环境变量 (重要!)
cp .env.example .env.local
# 编辑 .env.local 设置 JWT_SECRET

# 启动开发服务器
npm run dev
```

## 初始化账户

**首次访问时注册的用户将自动成为管理员**。之后只有管理员可以创建新用户。

1. 访问 `http://localhost:3100/register`
2. 注册第一个账户（自动获得管理员权限）
3. 使用该账户登录管理 Docker

## 安全配置

### 环境变量 (必须配置)

项目需要 `.env.local` 文件来配置敏感信息。**此文件需要你自己创建**。

#### 方式一：从示例文件复制（推荐）

```bash
# 复制示例文件
cp .env.example .env.local

# 编辑配置
nano .env.local
```

然后修改 `JWT_SECRET` 为一个随机字符串。

#### 方式二：一键生成（最简单）

```bash
# 自动生成随机密钥
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env.local
```

#### 方式三：手动创建

创建 `.env.local` 文件，内容如下:

```env
# JWT 密钥 - 必须修改为随机字符串!
JWT_SECRET=your-very-long-and-random-secret-key-at-least-32-chars

# Docker 连接 (推荐使用 Unix Socket)
DOCKER_HOST=unix:///var/run/docker.sock
```

**生成随机密钥命令:**
```bash
openssl rand -base64 32
```

> ⚠️ **重要**: `.env.local` 已加入 `.gitignore`，不会被提交到 Git 仓库

### Docker 连接

**推荐**: 使用 Unix Socket (本地连接):
```env
DOCKER_HOST=unix:///var/run/docker.sock
```

**远程连接 (必须使用 TLS)**:
```env
# ⚠️ 切勿使用未加密的 TCP 2375 端口!
# 使用 TLS 加密的 2376 端口
DOCKER_HOST=tcp://192.168.1.100:2376
DOCKER_TLS_VERIFY=1
DOCKER_CERT_PATH=/path/to/certs
```

> ⛔ **警告**: 暴露未加密的 Docker TCP 端口 (2375) 等同于给予 root 权限，任何人都可以控制你的服务器!

### 安全特性

- ✅ JWT Token 认证 (httpOnly Cookie)
- ✅ 密码 bcrypt 哈希存储
- ✅ 管理员权限控制 (敏感操作需要 admin 角色)
- ✅ 登录速率限制 (5 次/15 分钟)
- ✅ 安全响应头 (X-Frame-Options, CSP 等)
- ✅ CSRF 防护 (SameSite Cookie)

## API 端点

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户

### 容器
- `GET /api/containers` - 容器列表
- `GET /api/containers/[id]` - 容器详情
- `POST /api/containers/[id]/start` - 启动
- `POST /api/containers/[id]/stop` - 停止
- `POST /api/containers/[id]/restart` - 重启
- `DELETE /api/containers/[id]` - 删除
- `GET /api/containers/[id]/logs` - 日志

### 镜像
- `GET /api/images` - 镜像列表
- `POST /api/images/pull` - 拉取镜像
- `DELETE /api/images/[id]` - 删除镜像
- `POST /api/images/prune` - 清理镜像

### 网络
- `GET /api/networks` - 网络列表
- `POST /api/networks` - 创建网络
- `DELETE /api/networks/[id]` - 删除网络

### 卷
- `GET /api/volumes` - 卷列表
- `POST /api/volumes` - 创建卷
- `DELETE /api/volumes/[id]` - 删除卷
- `POST /api/volumes/prune` - 清理卷

### Compose
- `GET /api/compose` - 项目列表
- `POST /api/compose/[name]/start` - 启动项目
- `POST /api/compose/[name]/stop` - 停止项目

### 系统
- `GET /api/system/info` - Docker 信息
- `GET /api/system/stats` - 统计数据

## 系统要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | 20+ | 运行应用 |
| Docker | 20+ | 被管理对象 |

## 生产部署

### 方式一：Docker 部署（推荐）

```bash
# 使用 docker-compose
docker compose up -d

# 或手动构建运行
docker build -t docker-panel .
docker run -d \
  --name docker-panel \
  -p 3100:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --env-file .env.local \
  docker-panel
```

镜像大小约 **217MB**，启动时间 **< 100ms**。

### 方式二：Node.js 直接部署

#### 1. 构建

```bash
npm run build
```

### 2. 环境配置

```bash
# 必须设置强 JWT 密钥
export JWT_SECRET=$(openssl rand -base64 32)

# 设置生产模式
export NODE_ENV=production
```

### 3. 启动

```bash
npm run start
```

### 4. 反向代理 (推荐)

使用 Nginx 反向代理并启用 HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name docker-panel.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. 安全检查清单

- [ ] 设置了强 JWT_SECRET (至少 32 字符)
- [ ] Docker 使用 Unix Socket 或 TLS 加密连接
- [ ] 启用了 HTTPS
- [ ] 限制了访问 IP 或使用 VPN
- [ ] 定期更新依赖 (`npm audit`)

## 项目结构

```
src/
├── app/
│   ├── (auth)/          # 认证页面 (登录/注册)
│   ├── (dashboard)/     # 主界面 (仪表盘/容器/镜像...)
│   └── api/             # API 路由
├── components/
│   ├── ui/              # shadcn/ui 组件
│   ├── shared/          # 共享组件 (Sidebar/Header)
│   └── providers.tsx    # 全局 Provider
└── lib/
    ├── docker.ts        # Docker 客户端
    ├── db.ts            # SQLite 数据库
    └── auth.ts          # 认证工具
```

## License

MIT
