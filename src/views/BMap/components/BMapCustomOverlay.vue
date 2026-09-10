<template>
  <section class="bmap-section">
    <h2>自定义覆盖物</h2>
    <p>继承 BMapGL.Overlay 实现完全自定义的 DOM 覆盖物，可绑定样式与事件。</p>
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
  name: "BMapCustomOverlay",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
let overlays: unknown[] = [];

const createCustomOverlay = (
  BMapGL: NonNullable<typeof window.BMapGL>,
  point: unknown,
  content: string,
  color: string,
) => {
  const CustomOverlay = function (this: Record<string, unknown>, point: unknown, content: string, color: string) {
    this._point = point;
    this._content = content;
    this._color = color;
  } as unknown as { new (point: unknown, content: string, color: string): unknown };

  (CustomOverlay as unknown as { prototype: unknown }).prototype = new (BMapGL as unknown as { Overlay: new () => unknown }).Overlay();
  (CustomOverlay.prototype as Record<string, unknown>).initialize = function (this: Record<string, unknown>, mapInstance: unknown) {
    this._map = mapInstance;
    const div = document.createElement("div");
    div.className = "custom-overlay";
    div.innerHTML = `<div class="custom-overlay-box" style="--overlay-color: ${color}">${content}</div><div class="custom-overlay-arrow" style="--overlay-color: ${color}"></div>`;
    div.addEventListener("click", () => {
       
      window.alert(`点击了：${content}`);
    });
    (mapInstance as BMapGLMap).getPanes().labelPane.appendChild(div);
    this._div = div;
    return div;
  };
  (CustomOverlay.prototype as Record<string, unknown>).draw = function (this: Record<string, unknown>) {
    const mapInstance = this._map as BMapGLMap;
    const pixel = mapInstance.pointToOverlayPixel(this._point as unknown);
    const div = this._div as HTMLElement;
    div.style.left = `${pixel.x}px`;
    div.style.top = `${pixel.y}px`;
  };

  return new CustomOverlay(point, content, color);
};

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) {
      return;
    }
    const BMapGL = window.BMapGL;

    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 13);
    map.enableScrollWheelZoom(true);

    const points = [
      { lng: 116.404, lat: 39.915, content: "天安门", color: "#ff6b6b" },
      { lng: 116.397, lat: 39.916, content: "故宫", color: "#4ecdc4" },
      { lng: 116.39, lat: 39.909, content: "西单", color: "#45b7d1" },
      { lng: 116.418, lat: 39.929, content: "三里屯", color: "#96ceb4" },
      { lng: 116.437, lat: 39.897, content: "国贸", color: "#feca57" },
    ];

    overlays = points.map((item) => {
      const point = new BMapGL.Point(item.lng, item.lat);
      const overlay = createCustomOverlay(BMapGL, point, item.content, item.color);
      map!.addOverlay(overlay);
      return overlay;
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "自定义覆盖物初始化失败";
  }
});

onBeforeUnmount(() => {
  overlays.forEach((overlay) => {
    if (map) {
      map.removeOverlay(overlay);
    }
  });
  overlays = [];
  if (map && typeof map.destroy === "function") {
    map.destroy();
  }
  map = null;
});
</script>

<style scoped>
.bmap-container :deep(.custom-overlay) {
  position: absolute;
  transform: translate(-50%, -100%);
  cursor: pointer;
  white-space: nowrap;
  z-index: 10;
}

.bmap-container :deep(.custom-overlay-box) {
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  background: var(--overlay-color);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.bmap-container :deep(.custom-overlay-arrow) {
  width: 0;
  height: 0;
  margin: 0 auto;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid var(--overlay-color);
}
</style>
