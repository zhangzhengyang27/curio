<template>
  <ToolsExampleShell
    title="风场粒子"
    description="西太平洋合成风场的 GPU 粒子流动画：网格风数据程序化生成（基础西风 + 台风气旋式涡旋），经 WebGL 计算粒子轨迹（VcOverlayWind）。"
    :view="{ lon: 124, lat: 27, height: 7200000 }"
  >
    <div
      class="tool-panel tv-glass-panel"
      data-testid="example-panel"
    >
      <h3 class="panel-title">
        风场粒子
      </h3>
      <p class="panel-text">
        风场网格 {{ DATA.dimensions.lon }}×{{ DATA.dimensions.lat }}，约 {{ PARTICLES }} 个粒子沿风向流动。气旋中心约在 (125°E, 27°N)。
      </p>      <button
        class="tool-btn"
        data-testid="wind-toggle"
        @click="windShow = !windShow"
      >
        {{ windShow ? '隐藏粒子' : '显示粒子' }}
      </button>
      <p
        class="status"
        data-testid="example-status"
      >
        {{ statusText }}
      </p>
    </div>
    <VcOverlayWind
      :show="windShow"
      :data="DATA"
      :options="WIND_OPTIONS"
      @ready="onReady"
    />
  </ToolsExampleShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { VcOverlayWind } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

/**
 * 合成 VcWindData(结构见 wind/types.d.ts):逐层 Float32Array 网格。
 * 用「基础西风 + 逆时针气旋涡旋」解析式生成,不依赖外部 nc/json 数据文件。
 */
function buildWindData() {
  const lonMin = 105, lonMax = 138, latMin = 12, latMax = 41
  const nx = 67, ny = 59
  const lons = new Float32Array(nx)
  const lats = new Float32Array(ny)
  for (let i = 0; i < nx; i++) lons[i] = lonMin + (i * (lonMax - lonMin)) / (nx - 1)
  for (let j = 0; j < ny; j++) lats[j] = latMin + (j * (latMax - latMin)) / (ny - 1)

  const U = new Float32Array(nx * ny)
  const V = new Float32Array(nx * ny)
  let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity
  // 涡旋中心(125°E, 27°N):切向分量 (−dy, dx)/r 呈逆时针(北半球气旋)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const dx = lons[i] - 125
      const dy = lats[j] - 27
      const r = Math.max(0.6, Math.hypot(dx, dy))
      const swirl = 34 * Math.exp(-r / 5.5)
      const u = 9 - (dy / r) * swirl
      const v = (dx / r) * swirl * 0.92 + 2
      const k = j * nx + i
      U[k] = u
      V[k] = v
      if (u < uMin) uMin = u
      if (u > uMax) uMax = u
      if (v < vMin) vMin = v
      if (v > vMax) vMax = v
    }
  }
  return {
    dimensions: { lon: nx, lat: ny, lev: 1 },
    // ⚠ array 必须是扁平 TypedArray:实现里 createTexture 直接把它当
    // arrayBufferView、lon.array[0] 直接取数值;按 d.ts 注释的
    // 「Array<Float32Array> 分层」传会被静默吞掉,粒子一个都不渲染(实测)
    lon: { array: lons, min: lonMin, max: lonMax, delta: (lonMax - lonMin) / (nx - 1) },
    lat: { array: lats, min: latMin, max: latMax, delta: (latMax - latMin) / (ny - 1) },
    lev: { array: new Float32Array([1]), min: 1, max: 1 },
    U: { array: U, min: uMin, max: uMax },
    V: { array: V, min: vMin, max: vMax },
  }
}
const DATA = buildWindData()
const PARTICLES = 2048
// 粒子数/速度/拖尾都取保守值:8192 + speedFactor 4 时白色流线会铺满球面
// 盖死底图(实测);2048 + 慢速短拖尾能同时看清风场与底图
const WIND_OPTIONS = {
  maxParticles: PARTICLES,
  particleHeight: 100,
  fadeOpacity: 0.97,
  dropRate: 0.003,
  dropRateBump: 0.01,
  speedFactor: 1.2,
  lineWidth: 1.5,
}

const windShow = ref(true)
const statusText = computed(() =>
  `${windShow.value ? '粒子流动中' : '已隐藏'} · U∈[${DATA.U.min.toFixed(1)}, ${DATA.U.max.toFixed(1)}] m/s`,
)
function onReady() {
  // 粒子系统随 viewer 渲染循环自驱动
}
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
  color: #b9c6d4;
}

.tool-btn {
  padding: 6px 12px;
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

.status {
  margin: 10px 0 0;
  font-size: 12px;
  color: #9fd0a8;
}
</style>
