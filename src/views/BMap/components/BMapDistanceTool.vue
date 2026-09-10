<template>
  <section class="bmap-section">
    <h2>测距工具</h2>
    <p>使用 BMapGLLib.DistanceTool 在地图上点击测点，双击结束并返回总距离。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div
      v-if="lastDistance"
      class="bmap-meta"
    >
      上次测距结果：{{ lastDistance }} 米
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="openTool"
      >
        开始测距
      </button>
      <button
        type="button"
        @click="closeTool"
      >
        结束测距
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
  name: "BMapDistanceTool",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const lastDistance = ref<number | null>(null);
let map: BMapGLMap | null = null;
let distanceTool: BMapGLDistanceTool | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript(
      "https://cdn.jsdelivr.net/gh/huiyan-fe/BMapGLLib@master/DistanceTool/src/DistanceTool.min.js",
    );

    if (!containerRef.value || !window.BMapGL || !window.BMapGLLib?.DistanceTool) {
      return;
    }
    const BMapGL = window.BMapGL;
    const BMapGLLib = window.BMapGLLib;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 15);
    map.enableScrollWheelZoom(true);

    distanceTool = new BMapGLLib.DistanceTool(map, {
      lineColor: "#1E90FF",
      lineStroke: 3,
      unit: "metric",
      followText: "单击确定测点，双击结束测距",
    });

    distanceTool.addEventListener("drawend", (event) => {
      const e = event as { distance: number };
      lastDistance.value = Math.round(e.distance);
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "测距工具初始化失败";
  }
});

const openTool = () => {
  distanceTool?.open();
};

const closeTool = () => {
  distanceTool?.close();
};

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
  distanceTool = null;
});
</script>
