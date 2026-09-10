<template>
  <section class="bmap-section">
    <h2>3D 地球模式</h2>
    <p>使用 setMapType 切换到地球视角，支持缩放查看全球范围。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="applyMapType(normalType)"
      >
        普通地图
      </button>
      <button
        type="button"
        @click="applyMapType(earthType)"
      >
        地球模式
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
  name: "BMapEarthMode",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const normalType = ref<number | null>(null);
const earthType = ref<number | null>(null);
let map: BMapGLMap | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) {
      return;
    }
    normalType.value = window.BMAP_NORMAL_MAP ?? 1;
    earthType.value = window.BMAP_EARTH_MAP ?? 2;

    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    const point = new BMapGL.Point(116.404, 39.915);
    map.centerAndZoom(point, 5);
    map.enableScrollWheelZoom(true);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "3D 地球模式初始化失败";
  }
});

const applyMapType = (mapType: number | null) => {
  if (!map || mapType === null) {
    return;
  }
  map.setMapType(mapType);
};

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
});
</script>
