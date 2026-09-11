<template>
  <section class="bmap-section">
    <h2>mapvgl 图标图层</h2>
    <p>使用 mapvgl.IconLayer 高性能渲染大量图标标注，并支持点击拾取。</p>
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
import { loadScript, waitForBMapGL } from "../composables/useBMap";

defineOptions({
  name: "BMapIconLayer",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let view: MapvglView | null = null;

// 简单的定位图标 base64
const iconUrl =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAcCAYAAABG2khxAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QYCCyMbLt1NNAAAAJxJREFUSMft1TEKwkAQheH/3cPG0kLQ2npDFG8Q7D2Bl5DAWwjZO4KNl2vwBiKCha2VZrKzC/HDZJ43LzMf8I9xjqWkDPAI3IEjcAEWwFbSBXgB+8q4AgtgIukGPL7iM7CuMRvgyUy+JVkDS0l3z7kl2QALYF0Zd2BVGfdgA2wqYwdsJd2AR2XcgB2wkXQHHpWxA46S7sCzMn4C24r4CewlPYGnpCfwqowd8JJE+R/4AFi5XBmFdnWvAAAAAElFTkSuQmCC";

onMounted(async () => {
  try {
    await waitForBMapGL();
    await loadScript("https://code.bdstatic.com/npm/mapvgl@1.0.0-beta.54/dist/mapvgl.min.js");

    if (!containerRef.value || !window.BMapGL || !window.mapvgl?.IconLayer) {
      return;
    }
    const BMapGL = window.BMapGL;
    const mapvgl = window.mapvgl;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);
    map.setTilt(45);

    const center: [number, number] = [116.404, 39.915];
    const data = Array.from({ length: 80 }).map(() => ({
      geometry: {
        type: "Point",
        coordinates: [center[0] + (Math.random() - 0.5) * 0.2, center[1] + (Math.random() - 0.5) * 0.2],
      },
      properties: {
        count: Math.random() * 100,
      },
    }));

    view = new mapvgl.View({ map });
    const layer = new mapvgl.IconLayer!({
      icon: iconUrl,
      width: 24,
      height: 28,
      offset: [0, -14],
      opacity: 0.9,
      enablePicked: true,
      onClick: (item: { dataItem: { properties: { count: number } } }) => {
         
        console.info("点击了图标：", item.dataItem.properties.count);
      },
    });
    view.addLayer(layer);
    layer.setData(data);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "图标图层初始化失败";
  }
});

onBeforeUnmount(() => {
  if (view && typeof view.destroy === "function") {
    view.destroy();
  }
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  view = null;
  map = null;
});
</script>
