<template>
  <section class="bmap-section">
    <h2>自定义图标标注</h2>
    <p>通过 BMapGL.Icon 加载自定义图标替换默认标注点。</p>
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
  name: "BMapIconMarker",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;

const iconSvg =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7 0 0 7 0 16c0 11 16 24 16 24s16-13 16-24C32 7 25 0 16 0z" fill="#1e90ff"/><circle cx="16" cy="16" r="6" fill="#fff"/></svg>`,
  );

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);

    const icon = new BMapGL.Icon(iconSvg, new BMapGL.Size(32, 40), {
      anchor: new BMapGL.Size(16, 40),
    });
    const points = [
      new BMapGL.Point(116.404, 39.915),
      new BMapGL.Point(116.45, 39.94),
      new BMapGL.Point(116.36, 39.88),
    ];
    points.forEach((point, idx) => {
      const marker = new BMapGL.Marker(point, { icon });
      map!.addOverlay(marker);
      marker.addEventListener("click", () => {
        const info = new BMapGL.InfoWindow(`自定义图标标注 #${idx + 1}`, { width: 200 });
        map!.openInfoWindow(info, point);
      });
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "自定义图标标注初始化失败";
  }
});

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
});
</script>
