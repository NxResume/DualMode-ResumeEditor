# PDF Export Service

为 MARK RESUME 提供**矢量 PDF**导出（Playwright `page.pdf`），文字可选、字体真正嵌入，适合 Google Drive / ATS 预览。

> 编辑器现有「图片式 PDF」（html-to-image → jsPDF）仍保留在客户端；本服务是另一条链路，前端接入待接。

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/health` | 健康检查，返回 `{ ok: true }` |
| `POST` | `/export` | 正文 JSON → 返回 `application/pdf` |

### `POST /export`

```json
{
  "html": "<!DOCTYPE html>…完整 HTML（推荐）或片段…",
  "options": {
    "format": "A4",
    "preferCSSPageSize": true,
    "margin": { "top": "0", "right": "0", "bottom": "0", "left": "0" },
    "landscape": false,
    "filename": "resume.pdf"
  }
}
```

鉴权（生产必开）：

- `Authorization: Bearer <API_SECRET>`，或
- `x-api-key: <API_SECRET>`

本地未设置 `API_SECRET` 时跳过鉴权并打警告；`NODE_ENV=production` 且未设置会直接退出。

## 本地运行

需要本机已装 Playwright 浏览器（首次）：

```bash
cd services/pdf-export
npm install
npx playwright install chromium   # 或: npx playwright install --with-deps chromium
cp .env.example .env              # 可选：填 API_SECRET
npm run dev                       # http://localhost:3100
```

试一下：

```bash
curl -s http://localhost:3100/health

curl -s -X POST http://localhost:3100/export \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer change-me-to-a-long-random-string' \
  -d '{"html":"<!DOCTYPE html><html><body><h1>Hello</h1></body></html>"}' \
  -o /tmp/test.pdf
```

Docker（与 Render 一致）：

```bash
docker build -t mark-resume-pdf-export .
docker run --rm -p 3100:3100 -e API_SECRET=dev-secret mark-resume-pdf-export
```

## 部署到 Render Free

1. 把本仓库推到 GitHub（含 `services/pdf-export`）
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service** → 选该仓库
3. 关键：

| 项 | 值 |
|----|-----|
| Root Directory | `services/pdf-export` |
| Runtime | **Docker** |
| Instance Type | **Free** |
| Health Check Path | `/health` |

4. Environment：

| Key | Value |
|-----|--------|
| `API_SECRET` | 长随机串（勿提交 git） |
| `NODE_ENV` | `production` |

5. Deploy。拿到 `https://xxx.onrender.com` 后，主站导出请求指向该地址（前端接线下一步再做）。

**注意（Free 档）：** 闲置约 15 分钟会休眠，下次请求可能冷启动约 1 分钟，属正常。

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `API_SECRET` | 鉴权密钥，生产必填 | （空=开发跳过鉴权） |
| `PORT` | 监听端口（Render 会注入） | `3100` |
| `NODE_ENV` | `production` 时强制要求密钥 | `development` |
| `MAX_HTML_BYTES` | 请求体上限 | `5242880`（5MB） |
| `NAV_TIMEOUT_MS` | 页面加载超时 | `45000` |

## 说明

- 本目录**独立** `package.json`，不进根目录 pnpm workspace，方便 Render 只构建这一层。
- Dockerfile 使用官方 `mcr.microsoft.com/playwright:v1.50.1-jammy`，请与 `package.json` 里 `playwright` 版本保持一致。
