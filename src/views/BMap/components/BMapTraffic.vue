<template>
  <section class="bmap-section">
    <h2>路况图层</h2>
    <p>叠加 BMapGL.TrafficLayer 实时路况瓦片图层（需对应城市支持）。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="toggle"
      >
        {{ showing ? "隐藏路况" : "显示路况" }}
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
  name: "BMapTraffic",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const showing = ref(false);
let map: BMapGLMap | null = null;
let traffic: BMapGLTrafficLayer | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);
    traffic = new BMapGL.TrafficLayer({ predictDate: "now" });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "路况图层初始化失败";
  }
});

const toggle = () => {
  if (!map || !traffic) return;
  if (showing.value) {
    map.removeTileLayer(traffic);
  } else {
    map.addTileLayer(traffic);
  }
  showing.value = !showing.value;
};

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
  traffic = null;
});
</script>
