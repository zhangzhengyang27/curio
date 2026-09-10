<template>
  <section class="bmap-section">
    <h2>热力图</h2>
    <p>使用 BMapGLLib.HeatmapOverlay 展示随机热力分布数据。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="showHeatmap"
      >
        显示热力图
      </button>
      <button
        type="button"
        @click="hideHeatmap"
      >
        隐藏热力图
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
  name: "BMapHeatmap",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let heatmap: BMapGLHeatmapOverlay | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript(
      "https://cdn.jsdelivr.net/gh/huiyan-fe/BMapGLLib@master/Heatmap/src/Heatmap.min.js",
    );

    if (!containerRef.value || !window.BMapGL || !window.BMapGLLib?.HeatmapOverlay) {
      return;
    }
    const BMapGL = window.BMapGL;
    const BMapGLLib = window.BMapGLLib;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.418261, 39.921984), 15);
    map.enableScrollWheelZoom(true);

    heatmap = new BMapGLLib.HeatmapOverlay({
      radius: 25,
      visible: true,
      opacity: 80,
    });
    map.addOverlay(heatmap);

    const data = Array.from({ length: 200 }, () => ({
      lng: 116.418261 + (Math.random() - 0.5) * 0.06,
      lat: 39.921984 + (Math.random() - 0.5) * 0.06,
      count: Math.floor(Math.random() * 100),
    }));
    heatmap.setDataSet({ max: 100, data });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "热力图初始化失败";
  }
});

const showHeatmap = () => {
  heatmap?.show();
};

const hideHeatmap = () => {
  heatmap?.hide();
};

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
  heatmap = null;
});
</script>
