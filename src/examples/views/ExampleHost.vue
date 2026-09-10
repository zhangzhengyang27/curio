<template>
  <div
    ref="root"
    class="example-host"
  >
    <component
      :is="comp"
      :example="example"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { disposeAllGUI } from '../utils/guiTracker.js'

const props = defineProps({
  comp: { type: [Object, Function], required: true },
  example: { type: Object, required: true },
})

const root = ref(null)

// 示例切换 / 导航离开时，在子组件卸载前强制释放其 WebGL 上下文，
// 防止在示例中心来回切换时累积过多 GPU 上下文（浏览器约 16 个上限，超出会报错）。
// onBeforeUnmount 早于子组件卸载，此刻 canvas 仍在 DOM 中，可安全遍历。
function releaseCanvas(canvas) {
  try {
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    const lose = gl && gl.getExtension('WEBGL_lose_context')
    if (lose) lose.loseContext()
  } catch {
    /* 上下文已失效时忽略 */
  }
}

function disposeCanvasContexts(el) {
  if (!el || typeof el.querySelectorAll !== 'function') return
  el.querySelectorAll('canvas').forEach(releaseCanvas)
}

// 示例里大量用 `new GUI()` 创建面板，但多数不保存引用、也不在卸载时销毁。
// lil-gui / dat.gui 默认把面板挂到 document.body，返回列表页时残留在页面上。
// 这里在宿主卸载时兜底移除由这些 GUI 库创建的容器（含宿主子树内与 body 上的）。
function disposeGUI(el) {
  try {
    const selectors = ['.lil-gui', '.dg.ac', '.dg.main']
    if (el && typeof el.querySelectorAll === 'function') {
      selectors.forEach(sel => el.querySelectorAll(sel).forEach(node => node.remove()))
    }
    // 全局兜底：GUI 面板默认挂在 body 上，不在宿主子树内
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(node => node.remove())
    })
  } catch {
    /* 忽略清理异常 */
  }
}

onBeforeUnmount(() => {
  // 0) 优先通过追踪注册表正确销毁 GUI 实例（含内部事件监听器清理）
  disposeAllGUI()
  // 1) 当前 host 子树内的 canvas
  disposeCanvasContexts(root.value)
  // 2) 兜底：示例可能把 canvas 挂到 body（teleport / document.body.appendChild），
  //    不在 host 子树内，需额外扫描。仅释放明确属于某个 example-host 的 canvas，
  //    避免误释放页面上其他组件的 WebGL 上下文。
  try {
    document.querySelectorAll('canvas').forEach(canvas => {
      const host = canvas.closest && canvas.closest('.example-host')
      if (!host || host === root.value) {
        releaseCanvas(canvas)
      }
    })
  } catch {
    /* 忽略全局扫描异常 */
  }
  // 3) 兜底：清理残留的 GUI 控制面板，避免返回列表页后控件不消失
  disposeGUI(root.value)
})
</script>

<style scoped>
.example-host {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
