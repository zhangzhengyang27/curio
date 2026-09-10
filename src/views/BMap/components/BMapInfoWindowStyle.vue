<template>
  <section class="bmap-section">
    <h2>信息窗样式</h2>
    <p>复用同一坐标，打开不同主题的信息窗口（HTML 内容自定义）。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="open('default')"
      >
        默认风格
      </button>
      <button
        type="button"
        @click="open('card')"
      >
        卡片风格
      </button>
      <button
        type="button"
        @click="open('alert')"
      >
        告警风格
      </button>
    </div>
    <div
      ref="containerRef"
      class="bmap-container"
    />
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { waitForBMapGL } from "../composables/useBMap";

defineOptions({
  name: "BMapInfoWindowStyle",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;

const contents: Record<string, string> = {
  default: "<div style='padding:8px'>默认信息窗口内容</div>",
  card:
    "<div style='padding:12px;min-width:180px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15)'>" +
    "<h3 style='margin:0 0 6px;color:#1e90ff'>地点卡片</h3>" +
    "<p style='margin:0;color:#374151'>北京市朝阳区 · 示例数据点</p></div>",
  alert:
    "<div style='padding:12px;min-width:180px;background:#fef2f2;color:#b91c1c;border-radius:8px'>" +
    "<strong>⚠ 告警</strong><p style='margin:6px 0 0'>该区域指标超出阈值</p></div>",
};

const open = (key: string) => {
  if (!map || !window.BMapGL) return;
  const BMapGL = window.BMapGL;
  const info = new BMapGL.InfoWindow(contents[key] ?? "", {
    width: 220,
    offset: new BMapGL.Size(0, -20),
  });
  map.openInfoWindow(info, new BMapGL.Point(116.404, 39.915));
};

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 13);
    map.enableScrollWheelZoom(true);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "信息窗样式初始化失败";
  }
});

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
});
</script>
