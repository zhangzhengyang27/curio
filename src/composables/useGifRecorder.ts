import { onUnmounted } from 'vue'

/**
 * 「录制 GIF」:抓帧 → 统一尺寸 → 单文件 GIF(自 EarthView 原样迁出,行为等价)。
 * 旧实现把 ≤60 张 JPEG 帧以 50ms 间隔逐个 link.click() 倒进下载目录,
 * 且因为直接 toDataURL()(renderer 未开 preserveDrawingBuffer)每帧都是纯黑。
 */
const GIF_MAX_FRAMES = 50
const GIF_FRAME_WIDTH = 400
const GIF_FRAME_INTERVAL_MS = 250

interface GifFrame {
  rgba: Uint8Array
  w: number
  h: number
}

export function useGifRecorder(captureFrameScaled: (width: number) => { data: Uint8Array; w: number; h: number } | null | undefined) {
  let recording = false
  let frames: GifFrame[] = []
  let interval: ReturnType<typeof setInterval> | null = null

  function grabFrame() {
    const frame = captureFrameScaled(GIF_FRAME_WIDTH)
    if (!frame) return
    // 录制中途窗口 resize 会改变画布比例,帧尺寸不一致会让 GIF 解码错乱,与首帧不符的直接丢
    if (frames.length && (frames[0].w !== frame.w || frames[0].h !== frame.h)) return
    frames.push({ rgba: frame.data, w: frame.w, h: frame.h })
    if (frames.length > GIF_MAX_FRAMES) frames.shift()
  }

  async function encode() {
    const pending = frames
    frames = []
    if (pending.length < 2) return
    try {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
      const gif = GIFEncoder()
      // 用首帧建一份全局调色板给所有帧复用:逐帧各自量化会让帧间色板不同,动起来就是闪烁
      const palette = quantize(pending[0].rgba, 256, { format: 'rgb565' })
      for (const f of pending) {
        const index = applyPalette(f.rgba, palette, 'rgb565')
        gif.writeFrame(index, f.w, f.h, { palette, delay: GIF_FRAME_INTERVAL_MS })
      }
      gif.finish()
      // gifenc 返回 Uint8Array<ArrayBufferLike>,TS 5.7+ 不再直接视其为 BlobPart
      const url = URL.createObjectURL(new Blob([gif.bytes() as unknown as BlobPart], { type: 'image/gif' }))
      const link = document.createElement('a')
      link.download = `earth-${Date.now()}.gif`
      link.href = url
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error('GIF 编码失败:', err)
    }
  }

  function toggle() {
    recording = !recording
    if (recording) {
      frames = []
      interval = setInterval(grabFrame, GIF_FRAME_INTERVAL_MS)
    } else {
      if (interval) clearInterval(interval)
      interval = null
      void encode()
    }
  }

  onUnmounted(() => {
    if (recording) {
      recording = false
      if (interval) clearInterval(interval)
      interval = null
      frames = []
    }
  })

  return { toggle }
}
