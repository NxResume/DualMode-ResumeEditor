 <p align="center">
<img src="https://raw.githubusercontent.com/NxResume/DualMode-ResumeEditor/refs/heads/main/public/pwa-512x512.png" style="width:100px;" />
</p>

 <h1 align="center">MARK RESUME</h1>
 <p align="center">
<a href="README.md"><img src="https://img.shields.io/badge/Docs-中文-red?logo=markdown" alt="中文"></a><a href="https://resume.ryanuo.cc" target="_blank">
<img src="https://img.shields.io/badge/Web-Experience-brightgreen?logo=vercel" alt="Experience">
</a><a href="https://github.com/NxResume/nuxt-resume-editor"><img src="https://img.shields.io/badge/Storage-Local-orange?logo=github" alt="GitHub"></a>
<a href="https://ryanuo.cc/posts/resume"><img src="https://img.shields.io/badge/Details-Doc-black?logo=decapcms" alt="Document"></a>
<a href="https://deepwiki.com/NxResume/DualMode-ResumeEditor"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

# DualMode-ResumeEditor Resume Editor

A modern, feature-rich resume editor built with Nuxt 3 & Vue 3, supporting Markdown/WYSIWYG dual mode, GitHub/Google/Gitee login, dual local/cloud storage, theme switching, PDF/image/ZIP export, PWA offline, and i18n.

## 🌟 Features

- **GitHub/Google/Gitee OAuth login** for multi-device sync
- **Markdown editing & real-time preview** (WYSIWYG/source switch)
- **Multiple theme switching**, built-in beautiful themes, customizable
- **One-click export to PDF/Image/ZIP**, preview-consistent, multi-page support
- **ID photo upload & edit**, drag/scale/reset
- **Font selection & custom upload**, font preserved on export
- **One-click switch between English/Chinese**, auto-detect browser language
- **PWA support**, installable as desktop/mobile app, offline editing
- **Dual local/cloud storage**, auto data migration
- **Plugin architecture**, easy for secondary development and extension

## ⚙️ Environment Variables

Create a `.env` file based on your deployment environment.

| Variable             | Description                                          |
| -------------------- | ---------------------------------------------------- |
| AUTH_SECRET          | Session encryption secret (use openssl)              |
| AUTH_ORIGIN          | Allowed frontend origin (e.g. http://localhost:3000) |
| GITHUB_CLIENT_ID     | GitHub OAuth App Client ID                           |
| GITHUB_CLIENT_SECRET | GitHub OAuth App Client Secret                       |
| GOOGLE_CLIENT_ID     | Google OAuth App Client ID                           |
| GOOGLE_CLIENT_SECRET | Google OAuth App Client Secret                       |
| GITEE_CLIENT_ID      | Gitee OAuth App Client ID                            |
| GITEE_CLIENT_SECRET  | Gitee OAuth App Client Secret                        |
| DATABASE_URL         | Database connection string (local/cloud)             |
| MAIL_USER            | Mail service user (for email features)               |
| MAIL_PASS            | Mail service password/app token                      |
| HTTPS_PROXY          | HTTPS proxy (optional)                               |
| HTTP_PROXY           | HTTP proxy (optional)                                |

**Local development template:**

```env
AUTH_SECRET=
AUTH_ORIGIN=http://localhost:3000
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITEE_CLIENT_ID=
GITEE_CLIENT_SECRET=
DATABASE_URL="file:./prisma/dev.db"
MAIL_USER=
MAIL_PASS=
```

**Production template:**

```env
AUTH_SECRET=
AUTH_ORIGIN=https://your-domain.com
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITEE_CLIENT_ID=
GITEE_CLIENT_SECRET=
DATABASE_URL=postgresql://user:password@host:port/dbname
MAIL_USER=
MAIL_PASS=
HTTPS_PROXY=
HTTP_PROXY=
```

## 🚀 Quick Start

1. Install dependencies
   ```bash
   pnpm install
   ```
2. Configure environment variables (see above)
   ```bash
   copy .env.example .env
   ```
3. Initialize database
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
4. Start development server
   ```bash
   pnpm dev
   ```
   Visit [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

- Home `/`: Feature intro, theme preview
- My Resumes `/resumes`: Manage resumes (login required)
- Editor `/edit`: Main editor, Markdown left, real-time preview right
- Sign in `/signin`: Third-party login
- Settings `/settings`: Switch storage mode, preferences

## 🏗️ Tech Stack

- **Frontend**: Nuxt 3, Vue 3, Pinia, CodeMirror, Markdown-it, UnoCSS
- **Backend/Storage**: Prisma ORM, SQLite/PostgreSQL, LocalStorage
- **Auth**: @sidebase/nuxt-auth, GitHub/Google/Gitee OAuth
- **Export**: jsPDF, html-to-image, jszip
- **PWA**: @vite-pwa/nuxt
- **i18n**: vue-i18n

## 🖇️ Core Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    U->>FE: Open Resume Editor
    FE->>BE: Request user auth status
    BE->>DB: Query user info
    DB-->>BE: Return user info
    BE-->>FE: Return auth result
    FE->>BE: Save/sync resume content
    BE->>DB: Write/update resume data
    DB-->>BE: Operation result
    BE-->>FE: Return save result
    FE-->>U: Show save/sync status
```

## 🤝 Contributing & License

- Issues, PRs, and suggestions are welcome. MIT License.
- Author: RYANUO (https://github.com/ryanuo)
