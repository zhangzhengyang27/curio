<template>
  <section class="bmap-section">
    <h2>正/逆地理编码</h2>
    <p>地址 → 坐标（正向），坐标 → 地址（逆向）。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <input
        v-model="address"
        class="bmap-input"
        placeholder="输入地址，如：北京市天安门"
      >
      <button
        type="button"
        @click="geocode"
      >
        正向编码
      </button>
      <button
        type="button"
        @click="reverse"
      >
        逆向编码（地图中心）
      </button>
    </div>
    <p
      v-if="result"
      class="bmap-meta"
    >
      {{ result }}
    </p>
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
  name: "BMapGeocoder",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const address = ref("北京市天安门");
const result = ref("");
let map: BMapGLMap | null = null;
let geoc: BMapGLGeocoder | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);
    geoc = new BMapGL.Geocoder();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "地理编码初始化失败";
  }
});

const geocode = () => {
  if (!geoc || !map || !window.BMapGL) return;
  const BMapGL = window.BMapGL;
  geoc.getPoint(address.value, (point) => {
    const m = map;
    if (!point || !m) {
      result.value = "未找到该地址";
      return;
    }
    const p = point as { lng: number; lat: number };
    m.centerAndZoom(point, 15);
    m.clearOverlays();
    m.addOverlay(new BMapGL.Marker(point));
    result.value = `坐标：${p.lng.toFixed(5)}, ${p.lat.toFixed(5)}`;
  }, "北京市");
};

const reverse = () => {
  if (!geoc || !map) return;
  const center = map.getCenter() as { lng: number; lat: number };
  geoc.getLocation(center, (res) => {
    if (!res) {
      result.value = "未找到该坐标对应的地址";
      return;
    }
    result.value = `地址：${res.address}`;
  });
};

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
  geoc = null;
});
</script>
