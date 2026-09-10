<template>
  <section class="bmap-section">
    <h2>3D 墙体</h2>
    <p>使用 mapvgl.WallLayer 沿多边形边界生成三维墙体效果。</p>
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
  name: "BMapWallLayer",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let view: MapvglView | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript("https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.54/dist/mapvgl.min.js");

    if (!containerRef.value || !window.BMapGL || !window.mapvgl?.WallLayer) {
      return;
    }
    const BMapGL = window.BMapGL;
    const mapvgl = window.mapvgl;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);
    map.setTilt(60);

    const polygon = [
      [116.374, 39.895],
      [116.434, 39.895],
      [116.434, 39.935],
      [116.374, 39.935],
      [116.374, 39.895],
    ];

    const data = [
      {
        geometry: {
          type: "Polygon",
          coordinates: [polygon],
        },
        properties: {
          height: 2000,
        },
      },
    ];

    view = new mapvgl.View({ map });
    const layer = new mapvgl.WallLayer!({
      color: "rgba(0, 200, 255, 0.6)",
      opacity: 0.8,
      blend: "lighter",
    });
    view.addLayer(layer);
    layer.setData(data);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "3D 墙体初始化失败";
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
