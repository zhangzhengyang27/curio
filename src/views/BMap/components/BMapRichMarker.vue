<template>
  <section class="bmap-section">
    <h2>富标注与信息框</h2>
    <p>使用 BMapGLLib.RichMarker 在地图上放置自定义 HTML 标注，使用 InfoBox 打开富文本信息窗口。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="openInfoBox"
      >
        打开信息框
      </button>
      <button
        type="button"
        @click="closeInfoBox"
      >
        关闭信息框
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
  name: "BMapRichMarker",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let infoBox: BMapGLInfoBox | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await Promise.all([
      loadScript(
        "https://cdn.jsdelivr.net/gh/huiyan-fe/BMapGLLib@master/RichMarker/src/RichMarker.min.js",
      ),
      loadScript(
        "https://cdn.jsdelivr.net/gh/huiyan-fe/BMapGLLib@master/InfoBox/src/InfoBox.min.js",
      ),
    ]);

    if (!containerRef.value || !window.BMapGL || !window.BMapGLLib?.RichMarker) {
      return;
    }
    const BMapGL = window.BMapGL;
    const BMapGLLib = window.BMapGLLib;

    map = new BMapGL.Map(containerRef.value);
    const point = new BMapGL.Point(116.404, 39.915);
    map.centerAndZoom(point, 12);
    map.enableScrollWheelZoom(true);

    const markerEl = document.createElement("div");
    markerEl.innerHTML = `<div style="padding: 6px 12px; background: #1E90FF; color: #fff; border-radius: 4px; white-space: nowrap; font-size: 12px;">自定义富标注</div>`;

    const richMarker = new BMapGLLib.RichMarker(markerEl, point, {
      anchor: new BMapGL.Size(0, -20),
      enableDragging: false,
    });
    map.addOverlay(richMarker);

    const boxEl = document.createElement("div");
    boxEl.innerHTML = `<div style="padding: 10px;"><h4 style="margin: 0 0 8px;">信息框标题</h4><p style="margin: 0; font-size: 12px;">这是自定义 HTML 内容。</p></div>`;

    infoBox = new BMapGLLib.InfoBox(map, boxEl, {
      boxStyle: {
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        width: "200px",
      },
      enableAutoPan: true,
      align: 1,
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "富标注示例初始化失败";
  }
});

const openInfoBox = () => {
  if (!map || !window.BMapGL || !infoBox) {
    return;
  }
  infoBox.open(new window.BMapGL.Point(116.404, 39.915));
};

const closeInfoBox = () => {
  infoBox?.close();
};

onBeforeUnmount(() => {
  infoBox?.close();
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
  infoBox = null;
});
</script>
