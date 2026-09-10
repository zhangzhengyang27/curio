<template>
  <section class="bmap-section">
    <h2>绘制与量算</h2>
    <p>绘制多边形 / 圆，自动计算面积与周长（GeoUtils）。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="drawPolygon"
      >
        绘制多边形
      </button>
      <button
        type="button"
        @click="drawCircle"
      >
        绘制圆
      </button>
      <button
        type="button"
        @click="clearAll"
      >
        清除
      </button>
    </div>
    <p
      v-if="result"
      class="bmap-meta"
    >
      {{ result }}
    </p>
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
  name: "BMapMeasure",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const result = ref("");
let map: BMapGLMap | null = null;
let drawingManager: BMapGLDrawingManager | null = null;
let overlaycompleteHandler: ((e: unknown) => void) | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL || !window.BMapGLLib) return;
    const BMapGL = window.BMapGL;
    const BMapGLLib = window.BMapGLLib;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 13);
    map.enableScrollWheelZoom(true);

    await loadScript(
      "https://cdn.jsdelivr.net/gh/huiyan-fe/BMapGLLib@master/DrawingManager/src/DrawingManager.min.js",
    );
    await loadScript(
      "https://cdn.jsdelivr.net/gh/huiyan-fe/BMapGLLib@master/GeoUtils/src/GeoUtils.min.js",
    );
    if (!window.BMapGLLib?.DrawingManager || !window.BMapGLLib?.GeoUtils) return;

    drawingManager = new BMapGLLib.DrawingManager(map, {
      isOpen: false,
      enableDrawing: true,
      drawingMode: window.BMAP_DRAWING_POLYGON,
      polygonOptions: {
        strokeWeight: 2,
        strokeColor: "#1e90ff",
        fillColor: "#1e90ff",
        fillOpacity: 0.3,
      },
      circleOptions: {
        strokeWeight: 2,
        strokeColor: "#16a34a",
        fillColor: "#16a34a",
        fillOpacity: 0.3,
      },
    });

    overlaycompleteHandler = (e: unknown) => {
      const ev = e as { overlay?: unknown; drawingMode?: string };
      const overlay = ev.overlay;
      const geo = window.BMapGLLib?.GeoUtils;
      if (!overlay || !geo) return;
      if (ev.drawingMode === "circle") {
        const r = (overlay as { getRadius: () => number }).getRadius();
        const area = Math.PI * r * r;
        result.value = `圆形半径：${r.toFixed(1)} m，面积：${(area / 1e6).toFixed(3)} km²`;
      } else {
        const area = geo.getPolygonArea(overlay);
        const length = geo.getPolygonLength(overlay);
        result.value = `面积：${(area / 1e6).toFixed(3)} km²，周长：${(length / 1000).toFixed(3)} km`;
      }
      drawingManager?.close();
    };
    drawingManager.addEventListener("overlaycomplete", overlaycompleteHandler);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "绘制与量算初始化失败";
  }
});

const drawPolygon = () => {
  drawingManager?.setDrawingMode(window.BMAP_DRAWING_POLYGON);
  drawingManager?.open();
};

const drawCircle = () => {
  drawingManager?.setDrawingMode(window.BMAP_DRAWING_CIRCLE);
  drawingManager?.open();
};

const clearAll = () => {
  map?.clearOverlays();
  result.value = "";
};

onBeforeUnmount(() => {
  if (drawingManager && overlaycompleteHandler) {
    drawingManager.removeEventListener("overlaycomplete", overlaycompleteHandler);
  }
  if (drawingManager) drawingManager.close();
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
  drawingManager = null;
  overlaycompleteHandler = null;
});
</script>
