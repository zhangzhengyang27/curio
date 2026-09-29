<template>
  <ToolsExampleShell
    title="量测"
    description="左键取点 · 双击结束 · 右键回退上一点 · Ctrl+右键取消。绘制完成后点击图形可拖动/插入/删除顶点。"
  >
    <div class="tool-panel tv-glass-panel">
      <h3 class="panel-title">
        量测工具
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
          data-testid="measure-clear"
          @click="clearAll"
        >
          清空
        </button>
        <p
          class="status"
          data-testid="measure-status"
        >
          {{ statusText }}
        </p>
      </div>
    </div>

    <VcMeasurements
      ref="measureRef"
      position="bottom-right"
      :main-fab-opts="{ direction: 'left' }"
      :measurements="MEASUREMENT_NAMES"
      editable
      @draw-evt="onDrawEvt"
      @active-evt="onActiveEvt"
    />
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { VcMeasurements } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

const ACTIONS = [
  { name: 'distance', label: '距离' },
  { name: 'polyline', label: '折线' },
  { name: 'component-distance', label: '三角' },
  { name: 'horizontal', label: '水平' },
  { name: 'vertical', label: '垂直' },
  { name: 'height', label: '高度' },
  { name: 'area', label: '面积' },
  { name: 'point', label: '坐标' },
  { name: 'rectangle', label: '矩形' },
  { name: 'regular', label: '正多边形' },
  { name: 'circle', label: '圆' },
] as const
const LABEL_BY_NAME = Object.fromEntries(ACTIONS.map((a) => [a.name, a.label]))
// ⚠ 必须是稳定引用:模板里内联 .map() 会在每次渲染时生成新数组,使
// vue-cesium 内部 drawingActionInstances computed 失效重建(全新 cmpRef),
// selectedDrawingActionInstance 残留旧对象,地图点击全被静默吞掉(实测)
const MEASUREMENT_NAMES = ACTIONS.map((a) => a.name)

const measureRef = ref<any>(null)
const activeName = ref('')
const finishedCount = ref(0)
const lastFinished = ref('')

const statusText = computed(() => {
  if (activeName.value) return `「${LABEL_BY_NAME[activeName.value] || activeName.value}」量测中…`
  if (lastFinished.value) return lastFinished.value
  return `已完成 ${finishedCount.value} 次量测`
})

function toggle(name: string) {
  measureRef.value?.toggleAction(name)
}

function clearAll() {
  measureRef.value?.clearAll()
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
    lastFinished.value = `「${LABEL_BY_NAME[evt.name] || evt.name}」量测完成（${evt.index + 1}）`
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
  color: var(--cu-on-surface);
  font-size: 12px;
  cursor: pointer;
}

.tool-btn:hover {
  background: rgb(255 255 255 / 14%);
}

.tool-btn.active {
  border-color: var(--cu-primary);
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
  color: var(--cu-success);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
