<template>
  <section class="bmap-section">
    <h2>可视化</h2>
    <p>使用 mapvgl 点图层展示随机数据。</p>
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
  name: "BMapViz",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let view: MapvglView | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript("https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.54/dist/mapvgl.min.js");

    if (!containerRef.value || !window.BMapGL || !window.mapvgl) {
      return;
    }
    const BMapGL = window.BMapGL;
    const mapvgl = window.mapvgl;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(103.438656, 25.753594), 6);
    map.enableScrollWheelZoom(true);
    map.setTilt(0);

    const data = Array.from({ length: 100 }).map(() => ({
      geometry: {
        type: "Point",
        coordinates: [100 + Math.random() * 10, 23 + Math.random() * 8],
      },
      properties: {
        count: Math.random() * 100,
      },
    }));

    view = new mapvgl.View({ map });
    const layer = new mapvgl.PointLayer({
      size: 6,
      color: "rgba(0, 200, 255, 0.8)",
      blend: "lighter",
    });
    view.addLayer(layer);
    layer.setData(data);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "可视化示例初始化失败";
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
