import { ref } from 'vue'

/**
 * requestAnimationFrame 渲染循环
 */
export function useRenderLoop() {
  const isRunning = ref(false)
  let rafId = null
  let _renderFn = null

  function loop() {
    if (!isRunning.value) return
    if (_renderFn) _renderFn()
    rafId = requestAnimationFrame(loop)
  }

  function start() {
    if (isRunning.value) return
    isRunning.value = true
    loop()
  }

  function stop() {
    isRunning.value = false
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function setRenderFn(fn) {
    _renderFn = fn
  }

  return { isRunning, start, stop, setRenderFn }
}
