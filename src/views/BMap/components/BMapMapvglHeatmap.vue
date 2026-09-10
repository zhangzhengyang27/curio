<template>
  <section class="bmap-section">
    <h2>mapvgl 热力图</h2>
    <p>使用 mapvgl.HeatmapLayer 渲染三维热力分布。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div
      ref="containerRef"
      class="bmap-container"
    />
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { loadScript, waitForBMapGL } from "../composables/useBMap";

defineOptions({
  name: "BMapMapvglHeatmap",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let view: MapvglView | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript("https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.54/dist/mapvgl.min.js");

    if (!containerRef.value || !window.BMapGL || !window.mapvgl?.HeatmapLayer) {
      return;
    }
    const BMapGL = window.BMapGL;
    const mapvgl = window.mapvgl;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);
    map.setTilt(60);

    const data = Array.from({ length: 300 }, () => ({
      geometry: {
        type: "Point",
        coordinates: [116.404 + (Math.random() - 0.5) * 0.1, 39.915 + (Math.random() - 0.5) * 0.1],
      },
      properties: {
        count: Math.random() * 100,
      },
    }));

    view = new mapvgl.View({ map });
    const layer = new mapvgl.HeatmapLayer!({
      size: 20,
      max: 100,
      height: 5,
      unit: "px",
      gradient: {
        0: "rgba(0, 0, 255, 0)",
        0.3: "rgba(0, 255, 0, 0.6)",
        0.7: "rgba(255, 255, 0, 0.8)",
        1: "rgba(255, 0, 0, 0.9)",
      },
    });
    view.addLayer(layer);
    layer.setData(data);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "mapvgl 热力图初始化失败";
  }
});

onBeforeUnmount(() => {
  if (view && typeof view.destroy === "function") {
    view.destroy();
  }
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  view = null;
  map = null;
});
</script>
