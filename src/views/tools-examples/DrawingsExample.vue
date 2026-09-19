<template>
  <ToolsExampleShell
    title="标绘"
    description="图钉/点/线/面/矩形/圆/正多边形。线与面自动贴地，绘制完成后点击图形可编辑顶点。"
  >
    <div class="tool-panel tv-glass-panel">
      <h3 class="panel-title">
        标绘工具
      </h3>
      <div class="tool-grid">
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
      </div>
      <div class="panel-footer">
        <button
          class="tool-btn clear-btn"
          data-testid="drawing-clear"
          @click="clearAll"
        >
          清空
        </button>
        <p
          class="status"
          data-testid="drawing-status"
        >
          {{ statusText }}
        </p>
      </div>
    </div>

    <VcDrawings
      ref="drawingRef"
      position="bottom-right"
      :main-fab-opts="{ direction: 'left' }"
      :drawings="DRAWING_NAMES"
      clamp-to-ground
      editable
      @draw-evt="onDrawEvt"
      @active-evt="onActiveEvt"
    />
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { VcDrawings } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

const ACTIONS = [
  { name: 'pin', label: '图钉' },
  { name: 'point', label: '点' },
  { name: 'polyline', label: '线' },
  { name: 'polygon', label: '面' },
  { name: 'rectangle', label: '矩形' },
  { name: 'circle', label: '圆' },
  { name: 'regular', label: '正多边形' },
] as const
const LABEL_BY_NAME = Object.fromEntries(ACTIONS.map((a) => [a.name, a.label]))
// ⚠ 稳定引用,理由同 MeasurementsExample
const DRAWING_NAMES = ACTIONS.map((a) => a.name)

const drawingRef = ref<any>(null)
const activeName = ref('')
const finishedCount = ref(0)
const lastFinished = ref('')

const statusText = computed(() => {
  if (activeName.value) return `「${LABEL_BY_NAME[activeName.value] || activeName.value}」绘制中…`
  if (lastFinished.value) return lastFinished.value
  return `已完成 ${finishedCount.value} 次标绘`
})

function toggle(name: string) {
  drawingRef.value?.toggleAction(name)
}

function clearAll() {
  drawingRef.value?.clearAll()
  finishedCount.value = 0
  lastFinished.value = ''
  activeName.value = ''
}

function onActiveEvt(evt: any) {
  activeName.value = evt.isActive ? evt.type : ''
}

function onDrawEvt(evt: any) {
  if (evt.type === 'new' && evt.finished) {
    finishedCount.value++
    lastFinished.value = `「${LABEL_BY_NAME[evt.name] || evt.name}」标绘完成（${evt.index + 1}）`
  } else if (evt.type === 'removeAll') {
    finishedCount.value = 0
    lastFinished.value = ''
  }
}
</script>

<style scoped>
.panel-title {
  margin: 0 0 10px;
  font-size: 14px;
  color: #fff;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.tool-btn {
  padding: 6px 8px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 8px;
  background: rgb(255 255 255 / 6%);
  color: #dce7f2;
  font-size: 12px;
  cursor: pointer;
}

.tool-btn:hover {
  background: rgb(255 255 255 / 14%);
}

.tool-btn.active {
  border-color: #4da3ff;
  background: rgb(77 163 255 / 22%);
  color: #fff;
}

.panel-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.clear-btn {
  flex: none;
}

.status {
  margin: 0;
  font-size: 12px;
  color: #9fd0a8;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
