<template>
  <section class="bmap-section">
    <h2>mapvgl 形状图层</h2>
    <p>使用 mapvgl.ShapeLayer 将多边形拉伸为三维柱状体，展示高度信息。</p>
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
  name: "BMapShapeLayer",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let view: MapvglView | null = null;

const createPolygon = (center: [number, number], size: number): [number, number][] => {
  const half = size / 2;
  return [
    [center[0] - half, center[1] - half],
    [center[0] + half, center[1] - half],
    [center[0] + half, center[1] + half],
    [center[0] - half, center[1] + half],
    [center[0] - half, center[1] - half],
  ];
};

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript("https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.54/dist/mapvgl.min.js");

    if (!containerRef.value || !window.BMapGL || !window.mapvgl?.ShapeLayer) {
      return;
    }
    const BMapGL = window.BMapGL;
    const mapvgl = window.mapvgl;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 14);
    map.enableScrollWheelZoom(true);
    map.setTilt(60);

    const shapes = [
      { center: [116.394, 39.915] as [number, number], height: 1500, color: "rgba(255, 99, 132, 0.7)" },
      { center: [116.404, 39.915] as [number, number], height: 2500, color: "rgba(54, 162, 235, 0.7)" },
      { center: [116.414, 39.915] as [number, number], height: 1800, color: "rgba(255, 206, 86, 0.7)" },
      { center: [116.399, 39.905] as [number, number], height: 1200, color: "rgba(75, 192, 192, 0.7)" },
      { center: [116.409, 39.905] as [number, number], height: 2200, color: "rgba(153, 102, 255, 0.7)" },
      { center: [116.399, 39.925] as [number, number], height: 900, color: "rgba(255, 159, 64, 0.7)" },
      { center: [116.409, 39.925] as [number, number], height: 1600, color: "rgba(199, 199, 199, 0.7)" },
    ];

    const data = shapes.map((item) => ({
      geometry: {
        type: "Polygon",
        coordinates: [createPolygon(item.center, 0.006)],
      },
      properties: {
        height: item.height,
        color: item.color,
      },
    }));

    view = new mapvgl.View({ map });
    const layer = new mapvgl.ShapeLayer!({
      opacity: 0.8,
      blend: "lighter",
      style: "window",
    });
    view.addLayer(layer);
    layer.setData(data);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "形状图层初始化失败";
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
