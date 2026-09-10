<template>
  <section class="bmap-section">
    <h2>可拖拽标注</h2>
    <p>启用标注拖拽，dragend 后回显最新经纬度。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <p
      v-if="coord"
      class="bmap-meta"
    >
      当前坐标：{{ coord }}
    </p>
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
  name: "BMapDraggableMarker",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const coord = ref("");
let map: BMapGLMap | null = null;
let marker: BMapGLMarker | null = null;
let dragEndHandler: ((e: unknown) => void) | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 14);
    map.enableScrollWheelZoom(true);

    marker = new BMapGL.Marker(new BMapGL.Point(116.404, 39.915));
    marker.enableDragging();
    map.addOverlay(marker);

    dragEndHandler = () => {
      const p = marker?.getPosition() as { lng: number; lat: number } | undefined;
      if (p) coord.value = `${p.lng.toFixed(5)}, ${p.lat.toFixed(5)}`;
    };
    marker.addEventListener("dragend", dragEndHandler);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "可拖拽标注初始化失败";
  }
});

onBeforeUnmount(() => {
  if (marker && dragEndHandler) marker.removeEventListener("dragend", dragEndHandler);
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
  marker = null;
  dragEndHandler = null;
});
</script>
