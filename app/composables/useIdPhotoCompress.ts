import type { Ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'

/**
 * 证件照上传前压缩。
 *
 * 背景：证件照在版面上只有 30×38mm 左右，300DPI 也只需要 400px 宽；
 * 但用户常直接上传单反原片（动辄 10MP / 2~4MB）。这张图会被原样写进
 * 「打印为 PDF」导出的文件里，实测能占最终 PDF 的 85% 体积。
 * 所以在上传前统一缩到长边 800px 的 JPEG，导出体积从 MB 级降到百 KB 级。
 */

/** 长边像素。800 对应版面上约 700DPI，屏幕和打印都有充足余量 */
const MAX_EDGE = 800
/** 目标体积上限（MB）。browser-image-compression 会迭代降质逼近 */
const MAX_SIZE_MB = 0.2
/** 起始质量，包内部会按体积目标继续下调 */
const INITIAL_QUALITY = 0.85
/** 低于这个体积的图再压意义不大，直接跳过，省得重编码反而变大 */
const SKIP_BELOW_BYTES = 150 * 1024

export interface CompressResult {
  /** 实际要上传的文件（压缩失败或跳过时为原文件） */
  file: File
  /** 压缩前字节数 */
  originalSize: number
  /** 压缩后字节数 */
  size: number
  /** 是否真的执行了压缩 */
  compressed: boolean
}

/**
 * 开关作为编辑器偏好存 localStorage：和 autoSave 一样属于「这台机器上的使用习惯」，
 * 不进简历数据，因此不需要动 DB schema 和迁移。
 *
 * 用模块级单例而不是每次 useLocalStorage：同标签页内不会有 storage 事件，
 * 各调用方若各持一份 ref，设置面板改了开关，上传弹窗那边不会跟着变。
 */
let compressEnabled: Ref<boolean> | undefined

export function useIdPhotoCompressEnabled(): Ref<boolean> {
  compressEnabled ??= useLocalStorage('nuxt-resume-editor-idphoto-compress', true)
  return compressEnabled
}

/**
 * 压缩证件照。
 *
 * 任何异常都回退成原文件 —— 压缩是锦上添花，不该阻断上传。
 * `browser-image-compression` 内部用 Web Worker 跑，10MP 图也不会卡住界面。
 */
export async function compressIdPhoto(file: File): Promise<CompressResult> {
  const fallback: CompressResult = {
    file,
    originalSize: file.size,
    size: file.size,
    compressed: false,
  }

  // 只有位图能压；SVG 之类直接放过（服务端本来也只收 JPG/PNG/WebP）
  if (!file.type.startsWith('image/')) {
    return fallback
  }

  // 本身已经够小：重编码只会引入损失，还未必更小
  if (file.size <= SKIP_BELOW_BYTES) {
    return fallback
  }

  try {
    // 动态引入：这个包只在用户真的上传图片时才需要，不该进首屏 bundle
    const [{ default: imageCompression }, { default: workerLibUrl }] = await Promise.all([
      import('browser-image-compression'),
      // 压缩要在 Web Worker 里跑，否则 10MP 图会把主线程冻住两秒多。
      // 但包默认从 jsDelivr CDN 用 importScripts 加载自身脚本，国内网络基本拉不到，
      // 失败后会静默回退到主线程 —— 实测同一张图：同源 worker 123ms，主线程回退 2416ms。
      // 所以显式把打进产物里的 UMD 地址传给 libURL（`?url` 由 Vite 处理，产物同源）。
      import('browser-image-compression/dist/browser-image-compression.js?url'),
    ])

    const output = await imageCompression(file, {
      maxWidthOrHeight: MAX_EDGE,
      maxSizeMB: MAX_SIZE_MB,
      initialQuality: INITIAL_QUALITY,
      // 统一转 JPEG：PDF 里嵌 JPEG 走 DCTDecode，比 PNG 小一个数量级；
      // 包内部转 JPEG 时会先把画布填白，不会把透明区压成黑底
      fileType: 'image/jpeg',
      useWebWorker: true,
      libURL: workerLibUrl,
      // 证件照不需要留 EXIF（相机型号、拍摄时间），去掉也更小
      preserveExif: false,
    })

    // 极端情况下压缩反而更大（例如原图本来就很小），保留原图
    if (output.size >= file.size) {
      return fallback
    }

    return {
      file: output,
      originalSize: file.size,
      size: output.size,
      compressed: true,
    }
  }
  catch (err) {
    console.warn('[useIdPhotoCompress] 压缩失败，回退原图', err)
    return fallback
  }
}

/** 把字节数格式化成便于展示的串：1024 → 1.0 KB */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
