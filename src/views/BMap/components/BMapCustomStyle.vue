<template>
  <section class="bmap-section">
    <h2>个性化地图</h2>
    <p>通过 setMapStyleV2 切换自定义地图底图样式，可在百度地图开放平台创建专属样式 ID。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="applyStyle('')"
      >
        默认样式
      </button>
      <button
        type="button"
        @click="applyStyle('a0c43e8c7279db0a4a032712d0e4c32c')"
      >
        示例个性化
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
  name: "BMapCustomStyle",
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
  } catch (err) {
    error.value = err instanceof Error ? err.message : "个性化地图初始化失败";
  }
});

const applyStyle = (styleId: string) => {
  if (!map) {
    return;
  }
  map.setMapStyleV2({ styleId });
};

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
});
</script>
