<template>
  <section class="bmap-section">
    <h2>mapvgl 线图层</h2>
    <p>使用 mapvgl.LineLayer 高性能渲染大量静态线条，颜色随数值变化。</p>
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
  name: "BMapLineLayer",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let view: MapvglView | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript("https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.54/dist/mapvgl.min.js");

    if (!containerRef.value || !window.BMapGL || !window.mapvgl?.LineLayer) {
      return;
    }
    const BMapGL = window.BMapGL;
    const mapvgl = window.mapvgl;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(103.438656, 25.753594), 5);
    map.enableScrollWheelZoom(true);
    map.setTilt(50);

    const center: [number, number] = [103.438656, 25.753594];
    const targets: [number, number][] = [
      [116.4074, 39.9042],
      [121.4737, 31.2304],
      [113.2644, 23.1291],
      [114.0579, 22.5431],
      [120.1551, 30.2741],
      [118.7969, 32.0603],
      [104.0665, 30.5723],
      [108.9398, 34.3416],
      [126.5349, 45.8038],
      [125.3245, 43.8868],
      [106.5049, 29.5332],
      [117.2008, 39.0842],
    ];

    const data = targets.map((target) => {
      const count = Math.random() * 100;
      return {
        geometry: {
          type: "LineString",
          coordinates: [center, target],
        },
        properties: {
          count,
        },
      };
    });

    view = new mapvgl.View({ map });
    const layer = new mapvgl.LineLayer!({
      width: 2,
      opacity: 0.8,
      blend: "lighter",
      color: (item: { properties: { count: number } }) => {
        const count = item.properties.count;
        return count > 70 ? "rgba(255, 99, 132, 0.8)" : count > 40 ? "rgba(255, 206, 86, 0.8)" : "rgba(54, 162, 235, 0.8)";
      },
    });
    view.addLayer(layer);
    layer.setData(data);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "线图层初始化失败";
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
