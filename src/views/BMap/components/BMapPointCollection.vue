<template>
  <section class="bmap-section">
    <h2>海量点</h2>
    <p>使用 BMapGL.PointCollection 一次性渲染上万坐标点，适合大规模数据展示。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="regenerate"
      >
        重新生成 10000 点
      </button>
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
  name: "BMapPointCollection",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let collection: BMapGLPointCollection | null = null;

const buildPoints = (count: number): unknown[] => {
  const center = { lng: 116.404, lat: 39.915 };
  return Array.from({ length: count }, () => {
    const lng = center.lng + (Math.random() - 0.5) * 2;
    const lat = center.lat + (Math.random() - 0.5) * 2;
    return new window.BMapGL!.Point(lng, lat);
  });
};

const render = (count: number) => {
  if (!map || !window.BMapGL) return;
  if (collection) {
    map.removeOverlay(collection);
    collection = null;
  }
  collection = new window.BMapGL.PointCollection(buildPoints(count), {
    shape: window.BMAP_POINT_SHAPE_CIRCLE,
    color: "#1e90ff",
    size: 4,
  });
  map.addOverlay(collection);
};

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 9);
    map.enableScrollWheelZoom(true);
    render(10000);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "海量点初始化失败";
  }
});

const regenerate = () => render(10000);

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
  collection = null;
});
</script>
