<template>
  <section class="bmap-section">
    <h2>外卖指数</h2>
    <p>使用多层点数据模拟外卖指数热度分布。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div
      v-if="updateTime"
      class="bmap-meta"
    >
      更新时间：{{ updateTime }}
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
  name: "BMapWaimai",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const updateTime = ref("");
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
    map.centerAndZoom(new BMapGL.Point(105.403119, 38.028658), 5);
    map.enableScrollWheelZoom(true);

    view = new mapvgl.View({ map });
    const buildLayer = (color: string, size: number) =>
      new mapvgl.PointLayer({
        color,
        size,
        blend: "lighter",
      });

    const toPoints = (items: { geoCoord: [number, number] }[]) =>
      items.map((item) => ({
        geometry: {
          type: "Point",
          coordinates: item.geoCoord,
        },
        properties: {
          count: Math.random() * 10,
        },
      }));

    const response = await fetch("/data/bmap/weibo.json");
    const result = (await response.json()) as { geoCoord: [number, number] }[][];
    const layer1 = buildLayer("rgba(200, 200, 0, 0.8)", 2);
    const layer2 = buildLayer("rgba(255, 250, 0, 0.8)", 3);
    const layer3 = buildLayer("rgba(255, 250, 250, 0.6)", 4);
    view.addLayer(layer1);
    view.addLayer(layer2);
    view.addLayer(layer3);
    layer1.setData(toPoints(result[0] ?? []));
    layer2.setData(toPoints(result[1] ?? []));
    layer3.setData(toPoints(result[2] ?? []));
    updateTime.value = new Date().toLocaleString();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "外卖指数数据加载失败";
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
