<template>
  <ToolsExampleShell
    title="台风路径"
    description="合成台风「海鸢」路径回放：7 级/10 级/12 级风圈半透明着色、路径线与定位点标注（VcOverlayTyphoon）。数据为按 VcTyphoonRoute 类型构造的示例轨迹。"
    :view="{ lon: 126.5, lat: 24.5, height: 5600000 }"
  >
    <div
      class="tool-panel tv-glass-panel"
      data-testid="example-panel"
    >
      <h3 class="panel-title">
        台风「海鸢」（示例数据）
      </h3>
      <p class="panel-text">
        东部海面生成后西北行，在浙江沿海登陆。共 {{ ROUTE.points.length }} 个定位点，强度峰值 {{ peakLabel }}。
      </p>
      <button
        class="tool-btn"
        data-testid="typhoon-toggle"
        @click="typhoonShow = !typhoonShow"
      >
        {{ typhoonShow ? '隐藏路径' : '显示路径' }}
      </button>
      <p
        class="status"
        data-testid="example-status"
      >
        {{ statusText }}
      </p>
    </div>
    <VcOverlayTyphoon
      :typhoon-routes="[ROUTE]"
      :show="typhoonShow"
      @ready="onReady"
    />
  </ToolsExampleShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { VcOverlayTyphoon } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

// 字段与 vue-cesium 的 VcTyphoonPoint 类型一一对应(time/lng/lat/strong/power/
// speed/move_dir/move_speed/pressure/radius7/radius10/radius12/风圈四象限)
function pt(time, lng, lat, strong, power, speed, pressure, r7, r10, r12) {
  return {
    time,
    lng,
    lat,
    strong,
    power,
    speed,
    move_dir: '西北',
    move_speed: 22,
    pressure,
    radius7: r7,
    radius10: r10,
    radius12: r12,
    radius7_quad: { ne: r7, se: r7 * 0.8, sw: r7 * 0.7, nw: r7 * 0.9 },
    radius10_quad: { ne: r10, se: r10 * 0.8, sw: r10 * 0.6, nw: r10 * 0.9 },
    radius12_quad: { ne: r12, se: r12 * 0.7, sw: r12 * 0.5, nw: r12 * 0.8 },
  }
}

const ROUTE = {
  begin_time: '2026-09-18 02:00:00',
  end_time: '2026-09-20 08:00:00',
  ident: '202614',
  is_current: 1,
  land: [{ land_time: '2026-09-20 05:00:00', lng: 121.8, lat: 28.6, address: '浙江台州（示例）' }],
  name: '海鸢',
  ename: 'HAIYUAN',
  tfbh: '202614',
  points: [
    pt('2026-09-18 02:00:00', 133.8, 19.2, '热带风暴', 9, 23, 996, 180, 0, 0),
    pt('2026-09-18 08:00:00', 132.2, 20.6, '强热带风暴', 11, 28, 985, 220, 0, 0),
    pt('2026-09-18 14:00:00', 130.5, 21.9, '台风', 13, 35, 970, 260, 90, 0),
    pt('2026-09-18 20:00:00', 128.8, 23.1, '强台风', 15, 44, 950, 300, 120, 50),
    pt('2026-09-19 08:00:00', 125.6, 25.2, '强台风', 15, 45, 942, 320, 130, 60),
    pt('2026-09-19 14:00:00', 123.9, 26.5, '强台风', 14, 42, 950, 300, 120, 50),
    pt('2026-09-19 20:00:00', 122.4, 27.6, '台风', 13, 36, 965, 280, 100, 40),
    pt('2026-09-20 02:00:00', 121.4, 28.4, '台风', 12, 32, 975, 260, 80, 0),
    pt('2026-09-20 08:00:00', 120.3, 29.3, '热带风暴', 9, 20, 990, 200, 0, 0),
  ],
}
const peakLabel = '强台风（45 m/s）'

const typhoonShow = ref(true)
const statusText = computed(() =>
  `${typhoonShow.value ? `路径显示中 · ${ROUTE.points.length} 个定位点` : '路径已隐藏'}`,
)
function onReady() {
  // 组件 ready 后风圈与路径自动渲染
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
