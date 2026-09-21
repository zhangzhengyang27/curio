<template>
  <section class="bmap-section">
    <h2>周边搜索</h2>
    <p>使用 BMapGL.LocalSearch 在指定中心周边搜索关键词 POI。</p>
    <div class="bmap-actions">
      <input
        v-model="keyword"
        type="text"
        placeholder="搜索关键词"
        @keyup.enter="searchNearby"
      >
      <button
        type="button"
        @click="searchNearby"
      >
        周边搜索
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
  name: "BMapLocalSearch",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const keyword = ref("餐厅");
let map: BMapGLMap | null = null;
let localSearch: BMapGLLocalSearch | null = null;

const searchNearby = () => {
  if (!map || !window.BMapGL) {
    return;
  }
  const BMapGL = window.BMapGL;
  error.value = "";

  localSearch = new BMapGL.LocalSearch(map, {
    renderOptions: {
      map,
      autoViewport: true,
    },
    onSearchComplete: () => {
      if (localSearch && localSearch.getStatus() !== 0) {
        error.value = `未找到 "${keyword.value}" 相关结果`;
      } else {
        error.value = "";
      }
    },
  });

  const center = new BMapGL.Point(116.404, 39.915);
  localSearch.searchNearby(keyword.value, center, 5000);
};

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) {
      return;
    }
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 14);
    map.enableScrollWheelZoom(true);
    searchNearby();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "周边搜索初始化失败";
  }
});

onBeforeUnmount(() => {
  localSearch = null;
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
});
</script>

<style scoped>
.bmap-actions input {
  min-width: 180px;
}
</style>
