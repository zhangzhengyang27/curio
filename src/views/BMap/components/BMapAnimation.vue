<template>
  <section class="bmap-section">
    <h2>动画</h2>
    <p>通过 ViewAnimation 播放视角动画。</p>
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
        播放动画
      </button>
      <button
        type="button"
        @click="stopAnimation"
      >
        停止动画
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
import { waitForBMapGL } from "../composables/useBMap";

defineOptions({
  name: "BMapAnimation",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let animation: BMapGLViewAnimation | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) {
      return;
    }
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.414, 39.915), 20);
    map.enableScrollWheelZoom(true);
    map.setTilt(20);

    const keyFrames = [
      {
        center: new BMapGL.Point(116.307092, 40.054922),
        zoom: 20,
        tilt: 50,
        heading: 0,
        percentage: 0,
      },
      {
        center: new BMapGL.Point(116.307631, 40.055391),
        zoom: 21,
        tilt: 70,
        heading: 0,
        percentage: 0.1,
      },
      {
        center: new BMapGL.Point(116.306858, 40.057887),
        zoom: 21,
        tilt: 70,
        heading: 0,
        percentage: 0.25,
      },
      {
        center: new BMapGL.Point(116.306858, 40.057887),
        zoom: 21,
        tilt: 70,
        heading: -90,
        percentage: 0.35,
      },
      {
        center: new BMapGL.Point(116.307904, 40.058118),
        zoom: 21,
        tilt: 70,
        heading: -90,
        percentage: 0.45,
      },
      {
        center: new BMapGL.Point(116.307904, 40.058118),
        zoom: 21,
        tilt: 70,
        heading: -180,
        percentage: 0.55,
      },
      {
        center: new BMapGL.Point(116.308902, 40.055954),
        zoom: 21,
        tilt: 70,
        heading: -180,
        percentage: 0.75,
      },
      {
        center: new BMapGL.Point(116.308902, 40.055954),
        zoom: 21,
        tilt: 70,
        heading: -270,
        percentage: 0.85,
      },
      {
        center: new BMapGL.Point(116.307779, 40.055754),
        zoom: 21,
        tilt: 70,
        heading: -360,
        percentage: 0.95,
      },
      {
        center: new BMapGL.Point(116.307092, 40.054922),
        zoom: 20,
        tilt: 50,
        heading: -360,
        percentage: 1,
      },
    ];
    const options = {
      duration: 10000,
      delay: 3000,
      interation: "INFINITE",
    };
    animation = new BMapGL.ViewAnimation(keyFrames, options);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "动画示例初始化失败";
  }
});

const startAnimation = () => {
  if (map && animation) {
    map.startViewAnimation(animation);
  }
};

const stopAnimation = () => {
  if (map && animation) {
    map.cancelViewAnimation(animation);
  }
};

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
  animation = null;
});
</script>
