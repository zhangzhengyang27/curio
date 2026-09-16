<template>
  <ToolsExampleShell
    title="通视与可视域"
    description="通视：选两点检查视线是否被遮挡。可视域：选定视点与方向后渲染可见范围（面向 3DTiles 建筑，当前场景无 3DTiles 时以地面为主）。"
  >
    <div class="tool-panel tv-glass-panel">
      <h3 class="panel-title">
        空间分析
      </h3>
      <div class="tool-col">
        <button
          v-for="a in ACTIONS"
          :key="a.name"
          class="tool-btn"
          :class="{ active: activeName === a.name }"
          :data-tool="a.name"
          @click="toggle(a.name)"
        >
          {{ a.label }}
        </button>
        <button
          class="tool-btn clear-btn"
          data-testid="analysis-clear"
          @click="clearAll"
        >
          清空
        </button>
      </div>
      <p
        class="status"
        data-testid="analysis-status"
      >
        {{ statusText }}
      </p>
    </div>

    <VcAnalyses
      ref="analysisRef"
      position="bottom-right"
      :main-fab-opts="{ direction: 'left' }"
      :analyses="ANALYSIS_NAMES"
      editable
      @draw-evt="onDrawEvt"
      @active-evt="onActiveEvt"
    />
  </ToolsExampleShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { VcAnalyses } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

const ACTIONS = [
  { name: 'sightline', label: '通视分析' },
  { name: 'viewshed', label: '可视域分析' },
]
const LABEL_BY_NAME = Object.fromEntries(ACTIONS.map((a) => [a.name, a.label]))
// ⚠ 稳定引用,理由同 MeasurementsExample
const ANALYSIS_NAMES = ACTIONS.map((a) => a.name)

const analysisRef = ref(null)
const activeName = ref('')
const finished = ref('')

const statusText = computed(() => {
  if (activeName.value) return `「${LABEL_BY_NAME[activeName.value] || activeName.value}」取点中…`
  if (finished.value) return finished.value
  return '选择分析类型后在地图上取点'
})

function toggle(name) {
  analysisRef.value?.toggleAction(name)
}

function clearAll() {
  analysisRef.value?.clearAll()
  finished.value = ''
  activeName.value = ''
}

function onActiveEvt(evt) {
  activeName.value = evt.isActive ? evt.type : ''
}

function onDrawEvt(evt) {
  if (evt.type === 'new' && evt.finished) {
    finished.value = `「${LABEL_BY_NAME[evt.name] || evt.name}」分析完成`
  } else if (evt.type === 'removeAll') {
    finished.value = ''
  }
}
</script>

<style scoped>
.panel-title {
  margin: 0 0 10px;
  font-size: 14px;
  color: #fff;
}

.tool-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool-btn {
  padding: 8px 10px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 8px;
  background: rgb(255 255 255 / 6%);
  color: #dce7f2;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
}

.tool-btn:hover {
  background: rgb(255 255 255 / 14%);
}

.tool-btn.active {
  border-color: #4da3ff;
  background: rgb(77 163 255 / 22%);
  color: #fff;
}

.clear-btn {
  margin-top: 4px;
}

.status {
  margin: 10px 0 0;
  font-size: 12px;
  color: #9fd0a8;
}
</style>
