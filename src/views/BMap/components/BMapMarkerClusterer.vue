<template>
  <section class="bmap-section">
    <h2>标注聚合</h2>
    <p>使用 BMapGLLib.MarkerClusterer 对大量标注进行网格聚合，缩放时自动展开。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="regenerateMarkers"
      >
        重新生成 500 个标注
      </button>
      <button
        type="button"
        @click="clearMarkers"
      >
        清空标注
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
import { loadScript, waitForBMapGL } from "../composables/useBMap";

defineOptions({
  name: "BMapMarkerClusterer",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let clusterer: BMapGLMarkerClusterer | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript(
      "https://cdn.jsdelivr.net/gh/huiyan-fe/BMapGLLib@master/MarkerClusterer/src/MarkerClusterer.min.js",
    );

    if (!containerRef.value || !window.BMapGL || !window.BMapGLLib?.MarkerClusterer) {
      return;
    }
    const BMapGL = window.BMapGL;
    const BMapGLLib = window.BMapGLLib;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 5);
    map.enableScrollWheelZoom(true);

    clusterer = new BMapGLLib.MarkerClusterer(map, {
      gridSize: 60,
      maxZoom: 16,
      minClusterSize: 2,
      isAverageCenter: true,
    });

    generateMarkers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "标注聚合初始化失败";
  }
});

const generateMarkers = () => {
  if (!window.BMapGL || !clusterer) {
    return;
  }
  const BMapGL = window.BMapGL;
  const markers = Array.from({ length: 500 }, () => {
    const point = new BMapGL.Point(Math.random() * 40 + 85, Math.random() * 30 + 21);
    return new BMapGL.Marker(point);
  });
  clusterer.clearMarkers();
  clusterer.addMarkers(markers);
};

const regenerateMarkers = () => {
  generateMarkers();
};

const clearMarkers = () => {
  clusterer?.clearMarkers();
};

onBeforeUnmount(() => {
  clusterer?.clearMarkers();
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
  clusterer = null;
});
</script>
