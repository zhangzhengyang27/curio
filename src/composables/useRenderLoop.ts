import { ref } from 'vue'
import type { Ref } from 'vue'

type RenderFn = (deltaSec: number, elapsedSec: number) => void

/**
 * requestAnimationFrame 渲染循环（支持帧率限制）
 * @param options.fps - 目标帧率，0 表示不限制（跟随显示器刷新率）
 */
export function useRenderLoop(options: { fps?: number } = {}): {
  isRunning: Ref<boolean>
  fps: Ref<number>
  start(): void
  stop(): void
  setRenderFn(fn: RenderFn | null): void
} {
  const targetFps = options.fps || 0
  const frameInterval = targetFps > 0 ? 1000 / targetFps : 0

  const isRunning = ref(false)
  const fps = ref(0)
  let rafId: number | null = null
  let _renderFn: RenderFn | null = null
  let _lastTime = 0
  let _accumulator = 0
  let _frameCount = 0
  let _fpsTimer = 0

  function loop(now: number): void {
    if (!isRunning.value) return
    rafId = requestAnimationFrame(loop)

    const delta = now - _lastTime
    _lastTime = now

    // 帧率统计
    _frameCount++
    _fpsTimer += delta
    if (_fpsTimer >= 1000) {
      fps.value = Math.round((_frameCount * 1000) / _fpsTimer)
      _frameCount = 0
      _fpsTimer = 0
    }

    // 帧率限制：累积时间不足一帧则跳过渲染
    if (frameInterval > 0) {
      _accumulator += delta
      if (_accumulator < frameInterval) return
      _accumulator %= frameInterval
    }

    if (_renderFn) _renderFn(delta / 1000, now / 1000)
  }

  function start(): void {
    if (isRunning.value) return
    isRunning.value = true
    _lastTime = performance.now()
    _accumulator = 0
    _frameCount = 0
    _fpsTimer = 0
    rafId = requestAnimationFrame(loop)
  }

  function stop(): void {
    isRunning.value = false
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function setRenderFn(fn: RenderFn | null): void {
    _renderFn = fn
  }

  return { isRunning, fps, start, stop, setRenderFn }
}
