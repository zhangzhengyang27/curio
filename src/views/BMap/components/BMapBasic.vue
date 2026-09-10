<template>
  <section class="bmap-section">
    <h2>基本用法</h2>
    <p>初始化 Map 与 Point 并设置缩放级别，即可完成基础地图展示。</p>
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
  name: "BMapBasic",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) {
      return;
    }
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    const point = new BMapGL.Point(116.404, 39.915);
    map.centerAndZoom(point, 12);
    map.enableScrollWheelZoom(true);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "基础地图初始化失败";
  }
});

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
});
</script>
