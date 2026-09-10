<template>
  <section class="bmap-section">
    <h2>线动画</h2>
    <p>使用 mapvgl.LinePointLayer 展示沿线路运动的流动点效果。</p>
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
  name: "BMapLinePoint",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let view: MapvglView | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript("https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.54/dist/mapvgl.min.js");

    if (!containerRef.value || !window.BMapGL || !window.mapvgl?.LinePointLayer) {
      return;
    }
    const BMapGL = window.BMapGL;
    const mapvgl = window.mapvgl;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 6);
    map.enableScrollWheelZoom(true);
    map.setTilt(60);

    const center: [number, number] = [116.404, 39.915];
    const targets: [number, number][] = [
      [121.4737, 31.2304], // 上海
      [113.2644, 23.1291], // 广州
      [114.0579, 22.5431], // 深圳
      [120.1551, 30.2741], // 杭州
      [118.7969, 32.0603], // 南京
      [117.2008, 39.0842], // 天津
      [125.3245, 43.8868], // 长春
      [126.5349, 45.8038], // 哈尔滨
      [108.9398, 34.3416], // 西安
      [104.0665, 30.5723], // 成都
    ];

    const data = targets.map((target) => ({
      geometry: {
        type: "LineString",
        coordinates: [center, target],
      },
      properties: {
        count: Math.random() * 100,
      },
    }));

    view = new mapvgl.View({ map });
    const layer = new mapvgl.LinePointLayer!({
      color: "rgba(50, 255, 100, 0.9)",
      pointSize: 6,
      speed: 8,
      blend: "lighter",
    });
    view.addLayer(layer);
    layer.setData(data);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "线动画初始化失败";
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
