<template>
  <section class="bmap-section">
    <h2>卫星图切换</h2>
    <p>在普通地图、卫星地图与卫星+路网之间切换（BMapGL.setMapType）。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="setNormal"
      >
        普通地图
      </button>
      <button
        type="button"
        @click="setSatellite"
      >
        卫星地图
      </button>
      <button
        type="button"
        @click="setHybrid"
      >
        卫星+路网
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
  name: "BMapSatellite",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);
    map.setMapType(window.BMAP_NORMAL_MAP);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "卫星图切换初始化失败";
  }
});

const setNormal = () => map?.setMapType(window.BMAP_NORMAL_MAP);
const setSatellite = () => map?.setMapType(window.BMAP_SATELLITE_MAP);
const setHybrid = () => map?.setMapType(window.BMAP_HYBRID_MAP);

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
});
</script>
