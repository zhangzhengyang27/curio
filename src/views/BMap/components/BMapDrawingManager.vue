<template>
  <section class="bmap-section">
    <h2>鼠标绘制工具</h2>
    <p>使用 BMapGLLib.DrawingManager 在地图上绘制点、线、面、圆、矩形，并显示绘制工具栏。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="openDrawing"
      >
        开启绘制
      </button>
      <button
        type="button"
        @click="closeDrawing"
      >
        关闭绘制
      </button>
      <button
        type="button"
        @click="clearOverlays"
      >
        清空绘制
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
import { loadScript, loadStyle, waitForBMapGL } from "../composables/useBMap";

defineOptions({
  name: "BMapDrawingManager",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let drawingManager: BMapGLDrawingManager | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript(
      "https://cdn.jsdelivr.net/gh/huiyan-fe/BMapGLLib@master/DrawingManager/src/DrawingManager.min.js",
    );
    await loadStyle(
      "https://cdn.jsdelivr.net/gh/huiyan-fe/BMapGLLib@master/DrawingManager/src/DrawingManager.min.css",
    );

    if (!containerRef.value || !window.BMapGL || !window.BMapGLLib?.DrawingManager) {
      return;
    }
    const BMapGL = window.BMapGL;
    const BMapGLLib = window.BMapGLLib;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);

    drawingManager = new BMapGLLib.DrawingManager(map, {
      isOpen: false,
      enableDrawingTool: true,
      enableCalculate: true,
      drawingToolOptions: {
        anchor: window.BMAP_ANCHOR_TOP_LEFT,
        offset: new BMapGL.Size(10, 10),
        drawingModes: [
          window.BMAP_DRAWING_MARKER,
          window.BMAP_DRAWING_CIRCLE,
          window.BMAP_DRAWING_POLYLINE,
          window.BMAP_DRAWING_POLYGON,
          window.BMAP_DRAWING_RECTANGLE,
        ],
      },
      polylineOptions: {
        strokeColor: "#1E90FF",
        strokeWeight: 3,
      },
      polygonOptions: {
        strokeColor: "#1E90FF",
        fillColor: "#1E90FF",
        fillOpacity: 0.3,
      },
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "鼠标绘制工具初始化失败";
  }
});

const openDrawing = () => {
  drawingManager?.open();
};

const closeDrawing = () => {
  drawingManager?.close();
};

const clearOverlays = () => {
  drawingManager?.clearOverlays();
};

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
  drawingManager = null;
});
</script>
