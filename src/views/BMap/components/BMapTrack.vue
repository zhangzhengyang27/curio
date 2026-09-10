<template>
  <section class="bmap-section">
    <h2>轨迹动画</h2>
    <p>使用 TrackAnimation 播放轨迹。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="startAnimation"
      >
        播放轨迹
      </button>
      <button
        type="button"
        @click="stopAnimation"
      >
        停止轨迹
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
  name: "BMapTrack",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let trackAnimation: BMapGLLibTrackAnimation | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript("https://api.map.baidu.com/library/TrackAnimation/src/TrackAnimation_min.js");

    if (!containerRef.value || !window.BMapGL || !window.BMapGLLib) {
      return;
    }
    const BMapGL = window.BMapGL;
    const BMapGLLib = window.BMapGLLib;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.297611, 40.047363), 17);
    map.enableScrollWheelZoom(true);

    const path = [
      { lng: 116.297611, lat: 40.047363 },
      { lng: 116.302839, lat: 40.048219 },
      { lng: 116.308301, lat: 40.050566 },
      { lng: 116.305732, lat: 40.054957 },
      { lng: 116.304754, lat: 40.057953 },
      { lng: 116.306487, lat: 40.058312 },
      { lng: 116.307223, lat: 40.056379 },
    ];
    const points = path.map((item) => new BMapGL.Point(item.lng, item.lat));
    const polyline = new BMapGL.Polyline(points);
    trackAnimation = new BMapGLLib.TrackAnimation(map, polyline, {
      overallView: true,
      tilt: 30,
      duration: 20000,
      delay: 3000,
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "轨迹动画初始化失败";
  }
});

const startAnimation = () => {
  trackAnimation?.start();
};

const stopAnimation = () => {
  trackAnimation?.cancel();
};

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
  trackAnimation = null;
});
</script>
