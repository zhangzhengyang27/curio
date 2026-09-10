<template>
  <section class="bmap-section">
    <h2>公交线路查询</h2>
    <p>输入公交线路名（如：1路、特2路），在地图上绘制线路与站点。</p>
    <div
      v-if="error"
      class="bmap-warning"
    >
      {{ error }}
    </div>
    <div class="bmap-actions">
      <input
        v-model="keyword"
        class="bmap-input"
        placeholder="公交线路名"
      >
      <button
        type="button"
        @click="search"
      >
        查询
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
  name: "BMapBusLine",
});

const containerRef = ref<HTMLElement | null>(null);
const error = ref("");
const keyword = ref("1路");
const result = ref("");
let map: BMapGLMap | null = null;
let busline: BMapGLBusLineSearch | null = null;

onMounted(async () => {
  try {
    await waitForBMapGL();
    if (!containerRef.value || !window.BMapGL) return;
    const BMapGL = window.BMapGL;
    map = new BMapGL.Map(containerRef.value);
    map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
    map.enableScrollWheelZoom(true);
    busline = new BMapGL.BusLineSearch(map, {
      onGetBusListComplete: (res: unknown) => {
        const r = res as {
          getNumBusList?: () => number;
          getBusListItem?: (i: number) => unknown;
        };
        if (r.getNumBusList && r.getNumBusList() > 0 && r.getBusListItem) {
          busline?.getBusLine(r.getBusListItem(0));
        } else {
          result.value = "未找到该公交线路";
        }
      },
      onGetBusLineComplete: (line: unknown) => {
        const m = map;
        if (!m || !window.BMapGL) return;
        const BMapGL = window.BMapGL;
        const l = line as {
          getPath?: () => unknown[];
          getNumBusStations?: () => number;
          getBusStation?: (i: number) => { getPosition: () => unknown };
        };
        const path = l.getPath ? l.getPath() : [];
        m.addOverlay(new BMapGL.Polyline(path, { strokeColor: "#1e90ff", strokeWeight: 6 }));
        const num = l.getNumBusStations ? l.getNumBusStations() : 0;
        for (let i = 0; i < num; i++) {
          const st = l.getBusStation?.(i);
          if (st) m.addOverlay(new BMapGL.Marker(st.getPosition()));
        }
        if (path.length) m.setViewport(path);
        result.value = `共 ${num} 个站点`;
      },
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "公交线路查询初始化失败";
  }
});

const search = () => {
  result.value = "";
  busline?.getBusList(keyword.value);
};

onBeforeUnmount(() => {
  if (map && typeof map.destroy === "function") map.destroy();
  map = null;
  busline = null;
});
</script>
