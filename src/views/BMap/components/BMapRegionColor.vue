<template>
  <section class="bmap-section">
    <h2>行政区分级上色</h2>
    <p>基于 BMapGL.Boundary 拉取省界，按数值分级填充不同颜色，模拟数据可视化。</p>
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
import { waitForBMapGL } from "../composables/useBMap";

defineOptions({
  name: "BMapRegionColor",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;

const regions = [
  { name: "北京市", value: 95 },
  { name: "天津市", value: 70 },
  { name: "河北省", value: 55 },
  { name: "山西省", value: 40 },
  { name: "内蒙古自治区", value: 25 },
];

const colorByValue = (v: number): string => {
  if (v >= 90) return "#b91c1c";
  if (v >= 70) return "#ea580c";
  if (v >= 50) return "#ca8a04";
  if (v >= 35) return "#16a34a";
  return "#0d9488";
};

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(113.0, 39.0), 5);
    map.enableScrollWheelZoom(true);

    const boundary = new BMapGL.Boundary();
    regions.forEach((region) => {
      boundary.get(region.name, (result: { boundaries: string[] }) => {
        const m = map;
        if (!m) return;
        const boundaries = result.boundaries ?? [];
        boundaries.forEach((str) => {
          const points = str.split(";").map((pair) => {
            const [lng, lat] = pair.split(",");
            return new BMapGL.Point(Number(lng), Number(lat));
          });
          const polygon = new BMapGL.Polygon(points, {
            strokeWeight: 1,
            strokeColor: "#ffffff",
            fillColor: colorByValue(region.value),
            fillOpacity: 0.75,
          });
          m.addOverlay(polygon);
        });
      });
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "行政区分级上色初始化失败";
  }
});

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
});
</script>
