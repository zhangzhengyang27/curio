<template>
  <section class="bmap-section">
    <h2>3D建筑</h2>
    <p>加载重庆建筑数据，使用 ShapeLayer 渲染建筑高度。</p>
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
  name: "BMapBuilding",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let view: MapvglView | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript("https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.54/dist/mapvgl.min.js");

    if (!containerRef.value || !window.BMapGL || !window.mapvgl || !window.mapvgl.ShapeLayer) {
      return;
    }
    const BMapGL = window.BMapGL;
    const mapvgl = window.mapvgl;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(106.540547, 29.564858), 17);
    map.enableScrollWheelZoom(true);
    map.setTilt(80);
    map.setHeading(-45.3);

    const response = await fetch("/data/bmap/chongqing.json");
    const raw = (await response.json()) as { coordinates: number[][][]; height: number }[];
    const polygons = raw.map((item) => ({
      geometry: {
        type: "Polygon",
        coordinates: item.coordinates,
      },
      properties: {
        height: item.height,
      },
    }));

    view = new mapvgl.View({ map });
    const layer = new mapvgl.ShapeLayer!({
      color: "rgba(0, 255, 255, 0.9)",
      blend: "lighter",
      style: "windowAnimation",
      opacity: 1,
      riseTime: 2000,
    });
    view.addLayer(layer);
    layer.setData(polygons);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "3D 建筑数据加载失败";
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
