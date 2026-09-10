<template>
  <section class="bmap-section">
    <h2>地图控件</h2>
    <p>添加比例尺、缩放、地图类型和定位控件，并自定义锚点位置。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <button
        type="button"
        @click="addControls"
      >
        添加控件
      </button>
      <button
        type="button"
        @click="removeControls"
      >
        移除控件
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
  name: "BMapControls",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
const controls: unknown[] = [];

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

    addControls();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "地图控件示例初始化失败";
  }
});

const addControls = () => {
  if (!map || !window.BMapGL) {
    return;
  }
  const BMapGL = window.BMapGL;
  removeControls();

  const scaleCtrl = new BMapGL.ScaleControl({ anchor: window.BMAP_ANCHOR_BOTTOM_LEFT });
  const zoomCtrl = new BMapGL.ZoomControl({ anchor: window.BMAP_ANCHOR_TOP_LEFT });
  const mapTypeCtrl = new BMapGL.MapTypeControl({
    mapTypes: [window.BMAP_NORMAL_MAP, window.BMAP_EARTH_MAP],
    anchor: window.BMAP_ANCHOR_TOP_RIGHT,
  });
  const locationCtrl = new BMapGL.LocationControl({ anchor: window.BMAP_ANCHOR_BOTTOM_RIGHT });

  controls.push(scaleCtrl, zoomCtrl, mapTypeCtrl, locationCtrl);
  controls.forEach((ctrl) => map?.addControl(ctrl));
};

const removeControls = () => {
  if (!map) {
    return;
  }
  controls.forEach((ctrl) => map?.removeControl(ctrl));
  controls.length = 0;
};

onBeforeUnmount(() => {
  removeControls();
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
});
</script>
