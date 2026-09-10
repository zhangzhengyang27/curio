<template>
  <section class="bmap-section">
    <h2>输入提示</h2>
    <p>基于 BMapGL.Autocomplete 为输入框提供地点联想，选中后定位。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <input
        id="ac-input"
        v-model="text"
        class="bmap-input"
        placeholder="输入地点关键词"
      >
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
  name: "BMapAutocomplete",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const text = ref("");
const result = ref("");
let map: BMapGLMap | null = null;
let ac: BMapGLAutocomplete | null = null;
let confirmHandler: ((e: unknown) => void) | null = null;
let mountChildren: Set<Element> | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    mountChildren = new Set(Array.from(document.body.children));
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 11);
    map.enableScrollWheelZoom(true);

    ac = new BMapGL.Autocomplete({ input: "ac-input", location: map });
    confirmHandler = (_e: unknown) => {
      const ev = _e as { item?: { value?: string } };
      const item = ev.item;
      const m = map;
      if (!item || !m || !window.BMapGL) return;
      const BMapGL = window.BMapGL;
      const local = new BMapGL.LocalSearch(m, {
        onSearchComplete: (res: unknown) => {
          const r = res as {
            getPoi?: (i: number) => { point?: { lng: number; lat: number } };
          };
          const poi = r.getPoi ? r.getPoi(0) : undefined;
          if (poi && poi.point) {
            m.centerAndZoom(poi.point, 15);
            m.clearOverlays();
            m.addOverlay(new BMapGL.Marker(poi.point));
            result.value = `已定位：${item.value ?? ""}`;
          }
        },
      });
      local.search(item.value ?? "");
    };
    ac.addEventListener("onConfirm", confirmHandler);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "输入提示初始化失败";
  }
});

onBeforeUnmount(() => {
  if (ac && confirmHandler) ac.removeEventListener("onConfirm", confirmHandler);
  if (mountChildren) {
    Array.from(document.body.children).forEach((el) => {
      if (!mountChildren!.has(el)) el.remove();
    });
    mountChildren = null;
  }
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
  ac = null;
  confirmHandler = null;
});
</script>
