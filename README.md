# 《大学生不必看》主题问卷网页系统

基于 `大学生不必看_主题问卷网页系统开发文档.md` 生成的可运行项目。技术栈为 Next.js 14 App Router、React、TypeScript、Tailwind CSS、Prisma、PostgreSQL、Zod。

## 本地预览

1. 安装依赖：

```bash
npm install
```

2. 启动 PostgreSQL：

```bash
docker compose -p university-podcast-survey up -d db
```

如果当前目录包含中文导致 Compose 项目名推导失败，保留 `-p university-podcast-survey`。

3. 初始化数据库：

```bash
npx prisma migrate dev --name init
```

4. 启动开发服务：

```bash
npm run dev
```

前台地址：`http://localhost:3000`

后台地址：`http://localhost:3000/admin`

嘉宾问卷：`http://localhost:3000/guest`

本地默认管理员：`admin / admin123`

## 常用命令

```bash
npm run typecheck
npm run test
npm run build
npm run db:studio
```

## 环境变量

复制 `.env.example` 为 `.env` 后修改：

- `DATABASE_URL`：PostgreSQL 连接串。
- `NEXTAUTH_SECRET`：管理员会话签名密钥。
- `ADMIN_USERNAME`：管理员账号。
- `ADMIN_PASSWORD_HASH`：生产环境 bcrypt 密码哈希。
- `CONTACT_ENCRYPTION_KEY`：base64 编码 32 字节密钥。
- `HASH_SECRET`：IP、UA、联系方式哈希密钥。

本地开发允许使用 `ADMIN_DEV_PASSWORD`，生产环境必须配置 `ADMIN_PASSWORD_HASH`。

## 已实现功能

- 前台 6 步问卷、进度条、必填校验、多选数量限制。
- 25 个主题按 5 组折叠展示。
- 只对已选主题评分。
- 故事投稿、联系方式、成功页推荐反馈。
- localStorage 草稿保存和提交后清空。
- `POST /api/survey/submit` 后端 Zod 校验。
- Prisma 写入 PostgreSQL。
- 联系方式 AES-GCM 加密存储，联系方式/IP/UA 哈希。
- 基础 rate limit 和重复提交防护。
- 管理员登录、Dashboard、主题热度、问卷列表、故事列表。
- 故事审核状态、标签、高价值、可采访线索标记。
- CSV 导出，默认不包含联系方式；超级管理员可导出联系方式。
- 嘉宾问卷入口，用于收集潜在嘉宾想聊主题、故事角度、边界和录制偏好。
- 后台可查看并导出嘉宾问卷，联系方式同样加密保存。
- Dockerfile、docker-compose、Nginx 示例配置。

## Linux 生产部署

1. 在服务器准备 `.env`，使用强随机密钥和 bcrypt 密码哈希。

2. 构建并启动：

```bash
docker compose -p university-podcast-survey up -d --build
docker compose -p university-podcast-survey exec app npx prisma migrate deploy
```

3. Nginx 可参考 `nginx/survey.conf`，生产环境建议使用 Certbot 配置 HTTPS。

## 文件结构

- `app/`：Next.js 页面与 API routes。
- `components/survey/SurveyApp.tsx`：前台问卷主流程。
- `components/admin/AdminApp.tsx`：后台管理界面。
- `components/guest/GuestSurveyApp.tsx`：嘉宾沟通问卷。
- `lib/topics.ts`：25 个主题配置。
- `lib/guest-options.ts`：嘉宾问卷选项配置。
- `lib/validation.ts`：提交接口 Zod 校验。
- `lib/security.ts`：加密、解密、哈希。
- `lib/analytics.ts`：热度分、优先级、嘉宾线索判断。
- `prisma/schema.prisma`：数据库模型。
- `tests/core.test.ts`：核心单元测试。
