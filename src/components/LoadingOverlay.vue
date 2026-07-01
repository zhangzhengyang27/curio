<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="loading-overlay"
    >
      <div class="spinner" />
      <span class="loading-text">{{ text }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'

const show = ref(false)
const text = ref('加载中...')

let timer = null
function showLoading(msg = '加载中...') {
  text.value = msg
  show.value = true
  if (timer) clearTimeout(timer)
}

function hideLoading() {
  timer = setTimeout(() => { show.value = false }, 300)
}

defineExpose({ show: showLoading, hide: hideLoading })
</script>

<style scoped>
.loading-overlay {
  position: fixed; inset: 0; z-index: 999;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
}
.spinner {
  width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2);
  border-top-color: #00cccc; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { color: #ccc; font-size: 14px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
