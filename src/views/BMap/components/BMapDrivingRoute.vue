<template>
  <section class="bmap-section">
    <h2>驾车路线规划</h2>
    <p>使用 BMapGL.DrivingRoute 进行驾车路线规划并在地图上渲染。</p>
    <div class="bmap-actions">
      <input
        v-model="start"
        type="text"
        placeholder="起点"
        @keyup.enter="searchRoute"
      >
      <input
        v-model="end"
        type="text"
        placeholder="终点"
        @keyup.enter="searchRoute"
      >
      <button
        type="button"
        @click="searchRoute"
      >
        规划路线
      </button>
    </div>
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
  name: "BMapDrivingRoute",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const start = ref("天安门");
const end = ref("颐和园");
let map: BMapGLMap | null = null;
let driving: BMapGLDrivingRoute | null = null;

const searchRoute = () => {
  if (!map || !window.BMapGL) {
    return;
  }
  const BMapGL = window.BMapGL;
  error.value = "";

  driving = new BMapGL.DrivingRoute(map, {
    renderOptions: {
      map,
      autoViewport: true,
    },
    onSearchComplete: () => {
      if (driving && driving.getStatus() !== 0) {
        error.value = `未找到从 "${start.value}" 到 "${end.value}" 的驾车路线`;
      } else {
        error.value = "";
      }
    },
  });

  driving.search(start.value, end.value);
};

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) {
      return;
    }
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);
    searchRoute();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "驾车路线规划初始化失败";
  }
});

onBeforeUnmount(() => {
  driving = null;
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
});
</script>

<style scoped>
.bmap-actions input {
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  min-width: 140px;
}
</style>
