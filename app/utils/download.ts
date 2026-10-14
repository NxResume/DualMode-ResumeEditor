// download.ts
import { toJpeg, toPng } from 'html-to-image'

// 将单个 DOM 元素渲染为 PNG Data URL（截图导出用）
async function renderPageToPng(page: HTMLElement, pixelRatio = 2): Promise<string> {
  return await toPng(page, {
    quality: 1.0,
    pixelRatio,
    skipFonts: false,
    style: { transform: 'none' },
    filter: () => true,
  })
}

// 将单个 DOM 元素渲染为 JPEG Data URL（PDF 导出用，体积小解码快）
async function renderPageToJpeg(page: HTMLElement): Promise<string> {
  return await toJpeg(page, {
    quality: 1.0,
    pixelRatio: 2,
    skipFonts: false,
    style: { transform: 'none' },
    filter: () => true,
  })
}

// 获取分页元素
function getPages(previewRef: HTMLElement | null): HTMLElement[] {
  const wrapper = previewRef?.querySelector('.rs-page-item-wrapper')
  if (!wrapper)
    return []
  return Array.from(wrapper.querySelectorAll('.rs-page-item')) as HTMLElement[]
}

// 下载文件
function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// 下载 base64 图片
function downloadBase64Image(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

const MM_TO_INCH_FACTOR = 1 / 25.4 // 毫米转换为英寸的系数
const INCH_TO_PT_FACTOR = 72 // 英寸转换为 Points 的系数
const A4_WIDTH_MM = 210 // A4 纸张宽度 (mm)
const A4_HEIGHT_MM = 297 // A4 纸张高度 (mm)
// 动态计算 A4 尺寸 (pt)。页高必须用真实 A4（841.89pt）：
// 页面图按宽度换算后高 802.20pt（1070 × 595.28/794），旧实现 -50 后页高只有 791.89pt，
// 每页底部 10.3pt 会落在页面之外。
const A4_WIDTH_PT = A4_WIDTH_MM * MM_TO_INCH_FACTOR * INCH_TO_PT_FACTOR
const A4_HEIGHT_PT = A4_HEIGHT_MM * MM_TO_INCH_FACTOR * INCH_TO_PT_FACTOR
/**
 * 导出为 PDF
 */
export async function exportToPDF(previewRef: HTMLElement | null, filename = 'resume.pdf') {
  const pages = getPages(previewRef)
  if (!pages.length)
    return
  injectPageBackgrounds(pages)

  try {
    const { jsPDF: JSPDF } = await import('jspdf')
    const pdf = new JSPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [A4_WIDTH_PT, A4_HEIGHT_PT],
      compress: true,
    })

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]!
      const dataUrl = await renderPageToJpeg(page)

      // 图片尺寸用未受预览缩放影响的 offsetWidth/offsetHeight
      const scale = A4_WIDTH_PT / page.offsetWidth
      const imgHeight = page.offsetHeight * scale

      if (i > 0)
        pdf.addPage()
      pdf.addImage(dataUrl, 'JPEG', 0, 0, A4_WIDTH_PT, imgHeight)

      // 计算链接位置并添加可点击区域
      // getBoundingClientRect 含祖先 transform: scale（编辑页预览缩放），分母必须用缩放后的宽度，
      // 否则 scalePre ≠ 1 时链接热区会整体偏移
      const pageRect = page.getBoundingClientRect()
      const rectScale = pageRect.width ? A4_WIDTH_PT / pageRect.width : scale
      const links = page.querySelectorAll('a')

      links.forEach((link) => {
        const rect = link.getBoundingClientRect()
        const x = (rect.left - pageRect.left) * rectScale
        const y = (rect.top - pageRect.top) * rectScale
        const w = rect.width * rectScale
        const h = rect.height * rectScale

        if (link.href) {
          pdf.link(x, y, w, h, { url: link.href })
        }
      })
    }

    pdf.save(filename)
  }
  finally {
    // 无论成功失败都清理注入的背景节点
    removePageBackgrounds(pages)
  }
}

/**
 * 导出为图片（单页 PNG 或多页 ZIP）
 */
export async function exportToImage(previewRef: HTMLElement | null, baseName = 'resume') {
  const pages = getPages(previewRef)
  if (!pages.length)
    return
  injectPageBackgrounds(pages)

  try {
    if (pages.length === 1) {
      const dataUrl = await renderPageToPng(pages[0] as HTMLElement)
      downloadBase64Image(dataUrl, `${baseName}.png`)
      return
    }

    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const dataUrl = await renderPageToPng(page!)
      const base64 = dataUrl.split(',')[1]
      const blob = await fetch(`data:image/png;base64,${base64}`).then(res => res.blob())
      zip.file(`${baseName}-page-${i + 1}.png`, blob)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, `${baseName}-pages.zip`)
  }
  finally {
    // 无论成功失败都清理注入的背景节点（原实现单页导出会漏清理）
    removePageBackgrounds(pages)
  }
}

// 添加背景元素
function injectPageBackgrounds(pages: HTMLElement[]) {
  for (const page of pages) {
    // 如果已有背景就跳过
    if (page.querySelector('.rs-page-bg'))
      continue

    const bg = document.createElement('div')
    bg.className = 'rs-page-bg'
    page.insertBefore(bg, page.firstChild)
  }
}

// 移除背景元素
function removePageBackgrounds(pages: HTMLElement[]) {
  for (const page of pages) {
    const bg = page.querySelector('.rs-page-bg')
    if (bg)
      page.removeChild(bg)
  }
}
