<template>
  <section class="bmap-section">
    <h2>右键菜单</h2>
    <p>监听地图 rightclick 事件，弹出自定义 HTML 上下文菜单。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div
      ref="containerRef"
      class="bmap-container"
      @click="closeMenu"
      @contextmenu.prevent
    >
      <div
        v-if="menu.visible"
        class="bmap-ctx-menu"
        :style="{ left: menu.left + 'px', top: menu.top + 'px' }"
      >
        <button
          type="button"
          @click.stop="addMarkerHere"
        >
          在此添加标注
        </button>
        <button
          type="button"
          @click.stop="centerHere"
        >
          居中到此
        </button>
        <button
          type="button"
          @click.stop="zoomIn"
        >
          放大
        </button>
        <button
          type="button"
          @click.stop="zoomOut"
        >
          缩小
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { waitForBMapGL } from "../composables/useBMap";

defineOptions({
  name: "BMapContextMenu",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const menu = ref({ visible: false, left: 0, top: 0, lng: 0, lat: 0 });
let map: BMapGLMap | null = null;
let rightHandler: ((e: unknown) => void) | null = null;

const openMenu = (pixel: { x: number; y: number }, point: { lng: number; lat: number }) => {
  const cont = containerRef.value;
  const cw = cont ? cont.clientWidth : 0;
  const ch = cont ? cont.clientHeight : 0;
  const MENU_W = 168;
  const MENU_H = 168;
  let left = pixel.x + 2;
  let top = pixel.y + 2;
  if (cw > 0 && left + MENU_W > cw) left = Math.max(2, pixel.x - MENU_W);
  if (ch > 0 && top + MENU_H > ch) top = Math.max(2, pixel.y - MENU_H);
  menu.value = { visible: true, left, top, lng: point.lng, lat: point.lat };
};

const closeMenu = () => {
  menu.value = { ...menu.value, visible: false };
};

const addMarkerHere = () => {
  if (!map || !window.BMapGL) return closeMenu();
  const BMapGL = window.BMapGL;
  const marker = new BMapGL.Marker(new BMapGL.Point(menu.value.lng, menu.value.lat));
  map.addOverlay(marker);
  closeMenu();
};

const centerHere = () => {
  if (!map || !window.BMapGL) return closeMenu();
  const BMapGL = window.BMapGL;
  map.centerAndZoom(new BMapGL.Point(menu.value.lng, menu.value.lat), 14);
  closeMenu();
};

const zoomIn = () => {
  if (!map) return closeMenu();
  map.setZoom(map.getZoom() + 1);
  closeMenu();
};

const zoomOut = () => {
  if (!map) return closeMenu();
  map.setZoom(map.getZoom() - 1);
  closeMenu();
};

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);
    rightHandler = (e: unknown) => {
      const ev = e as { pixel: { x: number; y: number }; point: { lng: number; lat: number } };
      openMenu(ev.pixel, ev.point);
    };
    map.addEventListener("rightclick", rightHandler);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "右键菜单初始化失败";
  }
});

onBeforeUnmount(() => {
  if (map && rightHandler) map.removeEventListener("rightclick", rightHandler);
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
  rightHandler = null;
});
</script>
