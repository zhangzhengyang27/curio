<template>
  <ToolsExampleShell
    title="扫描与后处理"
    description="对全屏渲染管线做后期处理：雷达/圆环扫描圈（VcPostProcessStageScan）与夜视风格滤镜（VcPostProcessStage，经 VcPostProcessStageCollection 挂载），可分别开关。"
    :view="{ lon: 114.3, lat: 30.6, height: 280000 }"
  >
    <div
      class="tool-panel tv-glass-panel"
      data-testid="example-panel"
    >
      <h3 class="panel-title">
        后期处理
      </h3>
      <p class="panel-text">
        扫描圈以武汉为中心（半径 60km），夜视滤镜作用于整个视口。
      </p>
      <div class="btn-row">
        <button
          class="tool-btn"
          data-testid="scan-toggle"
          @click="scanOn = !scanOn"
        >
          {{ scanOn ? '关闭扫描' : '开启扫描' }}
        </button>
        <button
          class="tool-btn"
          data-testid="scan-type"
          :disabled="!scanOn"
          @click="scanType = scanType === 'radar' ? 'circle' : 'radar'"
        >
          {{ scanType === 'radar' ? '样式：雷达' : '样式：圆环' }}
        </button>
        <button
          class="tool-btn"
          data-testid="fx-toggle"
          @click="fxOn = !fxOn"
        >
          {{ fxOn ? '关闭夜视' : '开启夜视' }}
        </button>
      </div>
      <p
        class="status"
        data-testid="example-status"
      >
        {{ statusText }}
      </p>
    </div>
    <VcPostProcessStageScan
      v-if="scanOn"
      :type="scanType"
      :options="SCAN_OPTIONS"
    />
    <VcPostProcessStageCollection v-if="fxOn">
      <VcPostProcessStage :fragment-shader="FX_SHADER" />
    </VcPostProcessStageCollection>
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { VcPostProcessStageScan, VcPostProcessStage, VcPostProcessStageCollection } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

const SCAN_OPTIONS = {
  position: [114.3, 30.6, 0],
  radius: 60000,
  interval: 3500,
  color: '#00e5ff',
}

// 夜视滤镜:Cesium 后处理标准写法(colorTexture 采样,out_FragColor 输出)
const FX_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
void main(void) {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float nv = pow(clamp(gray * 1.9, 0.0, 1.0), 0.72);
  out_FragColor = vec4(nv * vec3(0.15, 1.0, 0.28), 1.0);
}
`

const scanOn = ref(true)
const scanType = ref('radar')
const fxOn = ref(false)

const statusText = computed(() => {
  const parts = []
  if (scanOn.value) parts.push(`扫描显示中（${scanType.value === 'radar' ? '雷达' : '圆环'}）`)
  else parts.push('扫描已关闭')
  parts.push(fxOn.value ? '夜视滤镜开启' : '夜视滤镜关闭')
  return parts.join(' · ')
})
</script>

<style scoped>
.panel-title {
  margin: 0 0 10px;
  font-size: 14px;
  color: #fff;
}

.panel-text {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--cu-on-surface-variant);
}

.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-btn {
  padding: 6px 12px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 8px;
  background: rgb(255 255 255 / 6%);
  color: var(--cu-on-surface);
  font-size: 12px;
  cursor: pointer;
}

.tool-btn:hover:not(:disabled) {
  background: rgb(255 255 255 / 14%);
}

.tool-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.status {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--cu-success);
}
</style>
