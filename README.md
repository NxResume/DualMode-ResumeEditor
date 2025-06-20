# Nuxt Resume Editor (English)

A modern resume editor based on Nuxt3, supporting Markdown editing, theme switching, export, and more.

## Features

- **Markdown Resume Editing & Real-time Preview**

  - Full Markdown syntax support, edit on the left, preview on the right.
  - Switch freely between WYSIWYG and source code editing modes.
  - Enhanced editing experience with paste, formatting, and quick toolbar.

- **Multiple Theme Switching**

  - Built-in beautiful resume themes, switch and preview instantly.
  - Theme styles are independent and extensible.
  - Theme switching is managed by Pinia and the resume-theme package, with auto-persistence.

- **Export to PDF/Image/ZIP**

  - One-click export to PDF, with automatic multi-page pagination.
  - Export to high-resolution PNG images, with ZIP packaging for multi-page resumes.
  - Powered by jsPDF, html-to-image, and jszip, compatible with major browsers.

- **ID Photo Upload & Drag/Resize**

  - Upload ID photo (JPG/PNG, up to 5MB).
  - Drag, scale, and reset the photo directly in the preview area.
  - Photo position and scale are persisted, and remain after theme switch or refresh.

- **Font Selection & Customization**

  - Built-in multiple Chinese and English fonts, supports custom font upload.
  - Font changes take effect instantly, and are preserved in exports.
  - Font resources are loaded on demand for performance.

- **Internationalization (i18n)**

  - One-click switch between English and Chinese UI and content.
  - Based on vue-i18n, with auto browser language detection.

- **PWA Support**

  - Installable as a desktop/mobile app, works offline.
  - Automatic static resource caching and update notifications.

- **Plugin & Extensibility**
  - Plugin system for features like icon insertion, fullscreen, screenshot, etc.
  - Clean code structure, easy for secondary development.

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the dev server:
   ```bash
   pnpm dev
   ```
3. Visit:
   [http://localhost:3000](http://localhost:3000)

### Main Pages

- `/` Home: Feature intro, quick guide, theme preview
- `/edit` Editor: Main editor, Markdown on the left, real-time preview on the right

### Export

- Click the "Export PDF" button in the top right to export your resume.
- Supports export as PDF, PNG (multi-page resumes are zipped).
- Exported content matches the preview, with custom themes and fonts.

### ID Photo

- Click the "ID Photo" button in the right toolbar to upload.
- Drag/scale/reset the photo in the preview area after upload.

### Font Switching

- Select font in the toolbar, preview and export update instantly.
- Supports custom font files (ttf/woff/otf).

### Theme Switching

- Click the "Theme" button in the toolbar to pick your favorite style.
- Theme selection is saved and restored on next visit.

### Internationalization

- Switch between English and Chinese in the bottom right corner.

### PWA

- Supports "Add to Home Screen" and offline use.
- Auto-detects new versions and prompts for update.

## Technical Highlights

- **Nuxt3 + Vue3 stack, supports SSR and static deployment**
- **Pinia state management with persistence**
- **CodeMirror + Markdown-it for high-performance Markdown editing and parsing**
- **Custom pagination algorithm for export, compatible with all themes**
- **UnoCSS atomic CSS for performance and flexibility**
- **PWA with Workbox for offline and caching**
- **Plugin architecture for easy extension**

## Dependencies

- [Nuxt 3](https://nuxt.com/) & [Vue 3](https://vuejs.org/)
- [Pinia](https://pinia.vuejs.org/) state management
- [CodeMirror](https://codemirror.net/) editor
- [Markdown-it](https://github.com/markdown-it/markdown-it) parser
- [UnoCSS](https://uno.css)
- [jsPDF](https://github.com/parallax/jsPDF) PDF export
- [html-to-image](https://github.com/bubkoo/html-to-image) image export
- [jszip](https://github.com/Stuk/jszip) ZIP packaging
- [vue-i18n](https://vue-i18n.intlify.dev/) i18n
- [@vite-pwa/nuxt](https://vite-pwa.nuxtjs.org/) PWA support

---

## License

[MIT](./LICENSE)

## Contributing & Feedback

Issues, PRs, and suggestions are welcome! For custom development or questions, feel free to contact the author.
