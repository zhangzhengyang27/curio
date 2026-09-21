<template>
  <section class="bmap-section">
    <h2>地图事件</h2>
    <p>监听地图的点击、缩放、移动等事件并实时反馈。</p>
    <div class="bmap-meta">
      <span>当前缩放：{{ currentZoom }}</span>
      <span>中心经度：{{ currentCenter.lng.toFixed(4) }}</span>
      <span>中心纬度：{{ currentCenter.lat.toFixed(4) }}</span>
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="clearMarkers"
      >
        清除点击标记
      </button>
    </div>
    <div
      v-if="clickInfo"
      class="bmap-warning"
    >
      {{ clickInfo }}
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
  name: "BMapMapEvents",
});

const containerRef = ref<HTMLElement | null>(null);
const currentZoom = ref(12);
const currentCenter = ref({ lng: 116.404, lat: 39.915 });
const clickInfo = ref("");
let map: BMapGLMap | null = null;
let clickMarkers: InstanceType<NonNullable<typeof window.BMapGL>["Marker"]>[] = [];

const handleClick = (event: unknown) => {
  if (!map || !window.BMapGL) {
    return;
  }
  const BMapGL = window.BMapGL;
  const e = event as { lngLat?: { lng: number; lat: number }; point?: { lng: number; lat: number } };
  const point = e.lngLat || e.point;
  if (!point) {
    return;
  }

  clickInfo.value = `点击位置：经度 ${point.lng.toFixed(4)}，纬度 ${point.lat.toFixed(4)}`;
  const marker = new BMapGL.Marker(new BMapGL.Point(point.lng, point.lat));
  map.addOverlay(marker);
  clickMarkers.push(marker);
};

const handleZoomEnd = () => {
  if (!map) {
    return;
  }
  // BMapGL 的 getZoom 方法未在类型中声明，通过 any 获取
  currentZoom.value = (map as unknown as { getZoom: () => number }).getZoom();
};

const handleMoveEnd = () => {
  if (!map) {
    return;
  }
  const center = (map as unknown as { getCenter: () => { lng: number; lat: number } }).getCenter();
  currentCenter.value = { lng: center.lng, lat: center.lat };
};

const clearMarkers = () => {
  clickMarkers.forEach((marker) => {
    if (map) {
      map.removeOverlay(marker);
    }
  });
  clickMarkers = [];
  clickInfo.value = "";
};

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) {
      return;
    }
    const BMapGL = window.BMapGL;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);

    currentZoom.value = (map as unknown as { getZoom: () => number }).getZoom();
    const center = (map as unknown as { getCenter: () => { lng: number; lat: number } }).getCenter();
    currentCenter.value = { lng: center.lng, lat: center.lat };

    map.addEventListener("click", handleClick);
    map.addEventListener("zoomend", handleZoomEnd);
    map.addEventListener("moveend", handleMoveEnd);
  } catch (err) {
    clickInfo.value = err instanceof Error ? err.message : "地图事件初始化失败";
  }
});

onBeforeUnmount(() => {
  clearMarkers();
  if (map) {
    map.removeEventListener("click", handleClick);
    map.removeEventListener("zoomend", handleZoomEnd);
    map.removeEventListener("moveend", handleMoveEnd);
    if (typeof map.destroy === "function") {
      map.destroy();
    }
  }
  map = null;
});
</script>

<style scoped>
.bmap-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}
</style>
