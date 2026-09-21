<template>
  <section class="bmap-section">
    <h2>行政区划边界</h2>
    <p>使用 BMapGL.Boundary 查询并绘制行政区域的边界多边形。</p>
    <div class="bmap-actions">
      <input
        v-model="district"
        type="text"
        placeholder="输入行政区划，如：北京市海淀区"
        @keyup.enter="searchBoundary"
      >
      <button
        type="button"
        @click="searchBoundary"
      >
        查询边界
      </button>
      <button
        type="button"
        @click="clearBoundary"
      >
        清除
      </button>
    </div>
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
  name: "BMapBoundary",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const district = ref("北京市");
let map: BMapGLMap | null = null;
let polygons: unknown[] = [];

const clearBoundary = () => {
  polygons.forEach((polygon) => {
    if (map) {
      map.removeOverlay(polygon);
    }
  });
  polygons = [];
};

const searchBoundary = () => {
  if (!map || !window.BMapGL) {
    return;
  }
  const BMapGL = window.BMapGL;
  clearBoundary();

  const boundary = new BMapGL.Boundary();
  boundary.get(district.value, (rs) => {
    if (!rs.boundaries || rs.boundaries.length === 0) {
      error.value = `未找到 "${district.value}" 的行政区划边界`;
      return;
    }
    error.value = "";

    rs.boundaries.forEach((boundaryStr) => {
      const polygon = new BMapGL.Polygon(boundaryStr, {
        strokeColor: "#1e90ff",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: "#1e90ff",
        fillOpacity: 0.2,
      });
      map!.addOverlay(polygon);
      polygons.push(polygon);
    });

    if (polygons.length > 0) {
      map!.setViewport(polygons);
    }
  });
};

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) {
      return;
    }
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 10);
    map.enableScrollWheelZoom(true);
    searchBoundary();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "行政区划边界初始化失败";
  }
});

onBeforeUnmount(() => {
  clearBoundary();
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
});
</script>

<style scoped>
.bmap-actions input {
  min-width: 200px;
}
</style>
