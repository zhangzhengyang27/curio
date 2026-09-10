<template>
  <section class="bmap-section">
    <h2>飞线</h2>
    <p>使用 mapvgl 飞线图层展示中心向外扩散的航线。</p>
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
  name: "BMapFlyline",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let view: MapvglView | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript("https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.54/dist/mapvgl.min.js");
    await loadScript(
      "https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.54/dist/mapvgl.threelayers.min.js",
    );

    if (!containerRef.value || !window.BMapGL || !window.mapvgl || !window.mapvgl.FlyLineLayer) {
      return;
    }
    const BMapGL = window.BMapGL;
    const mapvgl = window.mapvgl;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(103.438656, 25.753594), 6);
    map.enableScrollWheelZoom(true);
    map.setTilt(60);

    const center: [number, number] = [103.438656, 25.753594];
    const data = Array.from({ length: 40 }).map(() => {
      const target: [number, number] = [
        center[0] + (Math.random() - 0.5) * 20,
        center[1] + (Math.random() - 0.5) * 10,
      ];
      return {
        geometry: {
          type: "LineString",
          coordinates: [center, target],
        },
        properties: {
          count: Math.random() * 100,
        },
      };
    });

    view = new mapvgl.View({ map });
    const layer = new mapvgl.FlyLineLayer!({
      color: "rgba(0, 255, 255, 0.8)",
      width: 2,
      speed: 10,
      segment: 80,
      textureColor: "rgba(255, 255, 255, 0.9)",
    });
    view.addLayer(layer);
    layer.setData(data);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "飞线示例初始化失败";
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
