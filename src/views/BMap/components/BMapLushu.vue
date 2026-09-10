<template>
  <section class="bmap-section">
    <h2>路书动画</h2>
    <p>使用 BMapGLLib.LuShu 让标注沿路径运动，途经关键点自动停留并显示提示。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="startLushu"
      >
        开始
      </button>
      <button
        type="button"
        @click="pauseLushu"
      >
        暂停
      </button>
      <button
        type="button"
        @click="stopLushu"
      >
        停止
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
  name: "BMapLushu",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let lushu: BMapGLLuShu | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript(
      "https://cdn.jsdelivr.net/gh/huiyan-fe/BMapGLLib@master/Lushu/src/Lushu.min.js",
    );

    if (!containerRef.value || !window.BMapGL || !window.BMapGLLib?.LuShu) {
      return;
    }
    const BMapGL = window.BMapGL;
    const BMapGLLib = window.BMapGLLib;

    map = new BMapGL.Map(containerRef.value);
    const path = [
      new BMapGL.Point(116.297611, 40.047363),
      new BMapGL.Point(116.302839, 40.048219),
      new BMapGL.Point(116.308301, 40.050566),
      new BMapGL.Point(116.305732, 40.054957),
      new BMapGL.Point(116.304754, 40.057953),
      new BMapGL.Point(116.306487, 40.058312),
    ];
    map.centerAndZoom(path[0], 14);
    map.enableScrollWheelZoom(true);

    const polyline = new BMapGL.Polyline(path, { strokeColor: "#1E90FF", strokeWeight: 3 });
    map.addOverlay(polyline);

    lushu = new BMapGLLib.LuShu(map, path, {
      landmarkPois: [
        { lng: 116.302839, lat: 40.048219, html: "途径点 A", pauseTime: 1 },
        { lng: 116.305732, lat: 40.054957, html: "途径点 B", pauseTime: 1 },
      ],
      speed: 500,
      defaultContent: "车辆轨迹演示",
      enableRotation: true,
      autoView: true,
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "路书动画初始化失败";
  }
});

const startLushu = () => {
  lushu?.start();
};

const pauseLushu = () => {
  lushu?.pause();
};

const stopLushu = () => {
  lushu?.stop();
};

onBeforeUnmount(() => {
  lushu?.clear();
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
  lushu = null;
});
</script>
