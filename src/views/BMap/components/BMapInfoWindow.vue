<template>
  <section class="bmap-section">
    <h2>信息窗口</h2>
    <p>使用 BMapGL.InfoWindow 为标注绑定弹出信息窗口。</p>
    <div class="bmap-actions">
      <button
        v-for="item in places"
        :key="item.name"
        type="button"
        @click="openInfoWindow(item)"
      >
        {{ item.name }}
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
  name: "BMapInfoWindow",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let markers: InstanceType<NonNullable<typeof window.BMapGL>["Marker"]>[] = [];

const places = [
  { name: "天安门", lng: 116.404, lat: 39.915, desc: "中华人民共和国的象征，位于北京市中心。" },
  { name: "故宫", lng: 116.397, lat: 39.916, desc: "中国明清两代的皇家宫殿，旧称紫禁城。" },
  { name: "鸟巢", lng: 116.397, lat: 39.992, desc: "2008 年北京奥运会主体育场。" },
  { name: "颐和园", lng: 116.275, lat: 39.999, desc: "中国清朝时期皇家园林。" },
];

const openInfoWindow = (item: (typeof places)[number]) => {
  if (!map || !window.BMapGL) {
    return;
  }
  const BMapGL = window.BMapGL;
  const point = new BMapGL.Point(item.lng, item.lat);
  const content = `<div class="info-window-content"><h3>${item.name}</h3><p>${item.desc}</p></div>`;
  const infoWindow = new BMapGL.InfoWindow(content, {
    width: 240,
    height: 80,
    title: item.name,
  });
  map.openInfoWindow(infoWindow, point);
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

    markers = places.map((item) => {
      const point = new BMapGL.Point(item.lng, item.lat);
      const marker = new BMapGL.Marker(point);
      map!.addOverlay(marker);
      marker.addEventListener("click", () => openInfoWindow(item));
      return marker;
    });

    openInfoWindow(places[0]!);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "信息窗口初始化失败";
  }
});

onBeforeUnmount(() => {
  markers.forEach((marker) => {
    if (map) {
      map.removeOverlay(marker);
    }
  });
  markers = [];
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
});
</script>

<style scoped>
.bmap-container :deep(.info-window-content) {
  line-height: 1.6;
}

.bmap-container :deep(.info-window-content h3) {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.bmap-container :deep(.info-window-content p) {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
}
</style>
