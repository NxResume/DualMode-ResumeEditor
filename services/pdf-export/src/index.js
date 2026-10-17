import express from 'express'
import { chromium } from 'playwright'

const PORT = Number(process.env.PORT) || 3100
const API_SECRET = process.env.API_SECRET || ''
const NODE_ENV = process.env.NODE_ENV || 'development'
const IS_PROD = NODE_ENV === 'production'
const MAX_HTML_BYTES = Number(process.env.MAX_HTML_BYTES) || 5 * 1024 * 1024 // 5MB
const NAV_TIMEOUT_MS = Number(process.env.NAV_TIMEOUT_MS) || 45_000

if (IS_PROD && !API_SECRET) {
  console.error('[pdf-export] FATAL: API_SECRET is required in production')
  process.exit(1)
}

if (!API_SECRET) {
  console.warn('[pdf-export] WARNING: API_SECRET unset — auth disabled (dev only)')
}

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: MAX_HTML_BYTES }))

/** @type {import('playwright').Browser | null} */
let browser = null

async function getBrowser() {
  if (browser && browser.isConnected())
    return browser
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  browser.on('disconnected', () => {
    browser = null
  })
  return browser
}

function extractToken(req) {
  const header = req.get('authorization') || ''
  if (header.toLowerCase().startsWith('bearer '))
    return header.slice(7).trim()
  return (req.get('x-api-key') || '').trim()
}

function requireAuth(req, res, next) {
  if (!API_SECRET)
    return next()
  const token = extractToken(req)
  if (token && token === API_SECRET)
    return next()
  return res.status(401).json({ error: 'Unauthorized' })
}

app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'mark-resume-pdf-export',
    auth: Boolean(API_SECRET),
  })
})

/**
 * POST /export
 * Body: { html: string, options?: { format?: string, margin?: object, landscape?: boolean, preferCSSPageSize?: boolean, filename?: string } }
 * Returns application/pdf
 */
app.post('/export', requireAuth, async (req, res) => {
  const html = req.body?.html
  if (typeof html !== 'string' || !html.trim()) {
    return res.status(400).json({ error: 'html (string) is required' })
  }
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
    return res.status(413).json({ error: `html exceeds ${MAX_HTML_BYTES} bytes` })
  }

  const options = req.body?.options && typeof req.body.options === 'object'
    ? req.body.options
    : {}

  const preferCSSPageSize = options.preferCSSPageSize !== false
  const format = options.format || 'A4'
  const landscape = Boolean(options.landscape)
  const margin = options.margin && typeof options.margin === 'object'
    ? options.margin
    : { top: '0', right: '0', bottom: '0', left: '0' }
  const filename = typeof options.filename === 'string' && options.filename.trim()
    ? options.filename.trim().replace(/[^\w.\-]+/g, '_')
    : 'resume.pdf'

  let page = null
  try {
    const b = await getBrowser()
    page = await b.newPage()
    page.setDefaultTimeout(NAV_TIMEOUT_MS)

    // Full document HTML preferred; wrap fragments so fonts/CSS still apply.
    const documentHtml = /<!doctype|<html[\s>]/i.test(html)
      ? html
      : `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`

    await page.setContent(documentHtml, {
      waitUntil: 'networkidle',
      timeout: NAV_TIMEOUT_MS,
    })

    // Wait for webfonts when document.fonts is available
    await page.evaluate(async () => {
      if (document.fonts?.ready)
        await document.fonts.ready
    }).catch(() => {})

    // Brief settle for layout after fonts
    await new Promise(r => setTimeout(r, 200))

    const pdfOptions = {
      printBackground: true,
      preferCSSPageSize,
      landscape,
      margin,
    }
    if (!preferCSSPageSize)
      pdfOptions.format = format

    const pdf = await page.pdf(pdfOptions)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(pdf)
  }
  catch (err) {
    console.error('[pdf-export] export failed:', err)
    return res.status(500).json({
      error: 'PDF export failed',
      message: err instanceof Error ? err.message : String(err),
    })
  }
  finally {
    if (page) {
      await page.close().catch(() => {})
    }
  }
})

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' })
  }
  console.error('[pdf-export] unhandled:', err)
  return res.status(500).json({ error: 'Internal server error' })
})

const server = app.listen(PORT, () => {
  console.log(`[pdf-export] listening on :${PORT} (env=${NODE_ENV}, auth=${Boolean(API_SECRET)})`)
})

async function shutdown(signal) {
  console.log(`[pdf-export] ${signal}, shutting down…`)
  server.close()
  if (browser) {
    await browser.close().catch(() => {})
    browser = null
  }
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
