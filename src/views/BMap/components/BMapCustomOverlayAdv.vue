<template>
  <section class="bmap-section">
    <h2>自定义覆盖物（进阶）</h2>
    <p>继承 BMapGL.Overlay 实现跟随地图平移的浮动数据卡片。</p>
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
  name: "BMapCustomOverlayAdv",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
let map: BMapGLMap | null = null;
const overlays: unknown[] = [];

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);

    const OverlayCtor = BMapGL.Overlay as any;

    class DataCardOverlay extends OverlayCtor {
      private _map?: BMapGLMap;
      private _div?: HTMLElement;
      private _point?: unknown;
      private _html?: string;
      constructor(point: unknown, html: string) {
        super();
        this._point = point;
        this._html = html;
      }
      initialize(map: BMapGLMap): HTMLElement {
        this._map = map;
        const div = document.createElement("div");
        div.className = "data-card";
        div.innerHTML = this._html ?? "";
        const panes = map.getPanes();
        panes.labelPane.appendChild(div);
        this._div = div;
        return div;
      }
      draw(): void {
        if (!this._map || !this._div || !this._point) return;
        const pixel = this._map.pointToOverlayPixel(this._point);
        this._div.style.left = `${pixel.x}px`;
        this._div.style.top = `${pixel.y}px`;
      }
    }

    const cards = [
      { lng: 116.404, lat: 39.915, html: "<strong>节点 A</strong><span>负载 72%</span>" },
      { lng: 116.45, lat: 39.94, html: "<strong>节点 B</strong><span>负载 45%</span>" },
      { lng: 116.36, lat: 39.88, html: "<strong>节点 C</strong><span>负载 91%</span>" },
    ];
    cards.forEach((c) => {
      const ov = new DataCardOverlay(new BMapGL.Point(c.lng, c.lat), c.html);
      overlays.push(ov);
      map!.addOverlay(ov);
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "自定义覆盖物初始化失败";
  }
});

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
  overlays.length = 0;
});
</script>
