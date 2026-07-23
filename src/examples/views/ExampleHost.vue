<template>
  <div ref="root" class="example-host">
    <component :is="comp" :example="example" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'

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

onBeforeUnmount(() => {
  // 1) 当前 host 子树内的 canvas
  disposeCanvasContexts(root.value)
  // 2) 兜底：示例可能把 canvas 挂到 body（teleport / document.body.appendChild），
  //    不在 host 子树内，需额外扫描。若 canvas 属于另一个仍存活的 example-host 则跳过。
  try {
    document.querySelectorAll('canvas').forEach(canvas => {
      const host = canvas.closest && canvas.closest('.example-host')
      if (host && host !== root.value) return
      releaseCanvas(canvas)
    })
  } catch {
    /* 忽略全局扫描异常 */
  }
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
