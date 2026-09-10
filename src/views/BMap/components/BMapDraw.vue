<template>
  <section class="bmap-section">
    <h2>绘制元素</h2>
    <p>示例包含标注、折线与文本标注，用于基础绘图能力展示。</p>
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
  name: "BMapDraw",
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

    const marker = new BMapGL.Marker(point);
    map.addOverlay(marker);

    const polyline = new BMapGL.Polyline(
      [
        new BMapGL.Point(116.399, 39.8),
        new BMapGL.Point(116.405, 39.81),
        new BMapGL.Point(116.425, 39.82),
      ],
      {
        strokeColor: "blue",
        strokeWeight: 2,
        strokeOpacity: 0.5,
      },
    );
    map.addOverlay(polyline);

    const label = new BMapGL.Label("欢迎学习数据可视化体系课", {
      position: point,
      offset: new BMapGL.Size(200, 20),
    });
    label.setStyle({
      width: "100px",
      height: "20px",
      padding: "20px",
      color: "#fff",
      fontSize: "20px",
      border: "2px solid #1E90FF",
      background: "red",
      whiteSpace: "wrap",
      overflow: "hidden",
      lineHeight: "20px",
    });
    map.addOverlay(label);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "绘图示例初始化失败";
  }
});

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
});
</script>
