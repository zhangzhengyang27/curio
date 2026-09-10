<template>
  <section class="bmap-section">
    <h2>弧线</h2>
    <p>使用 BMapGLLib.CurveLine 在起点、途经点、终点之间生成平滑弧线，支持开启编辑。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="enableEditing"
      >
        开启编辑
      </button>
      <button
        type="button"
        @click="disableEditing"
      >
        关闭编辑
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
  name: "BMapCurveLine",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let curve: BMapGLCurveLine | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript(
      "https://cdn.jsdelivr.net/gh/huiyan-fe/BMapGLLib@master/CurveLine/src/CurveLine.min.js",
    );

    if (!containerRef.value || !window.BMapGL || !window.BMapGLLib?.CurveLine) {
      return;
    }
    const BMapGL = window.BMapGL;
    const BMapGLLib = window.BMapGLLib;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(118.454, 32.955), 6);
    map.enableScrollWheelZoom(true);

    const points = [
      new BMapGL.Point(116.432045, 39.910683),
      new BMapGL.Point(120.129721, 30.314429),
      new BMapGL.Point(121.491121, 25.127053),
    ];
    curve = new BMapGLLib.CurveLine(points, {
      strokeColor: "#1E90FF",
      strokeWeight: 3,
      strokeOpacity: 0.8,
    });
    map.addOverlay(curve);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "弧线示例初始化失败";
  }
});

const enableEditing = () => {
  curve?.enableEditing();
};

const disableEditing = () => {
  curve?.disableEditing();
};

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
  curve = null;
});
</script>
