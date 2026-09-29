<template>
  <section class="bmap-page">
    <header class="bmap-header">
      <h1>百度地图示例集成</h1>
      <p>将入门、进阶与可视化示例整合到当前项目中。</p>
    </header>
    <div
      v-if="scriptError"
      class="bmap-warning"
    >
      {{ scriptError }}
    </div>
    <div
      v-else-if="!scriptReady"
      class="bmap-loading"
    >
      正在加载百度地图 SDK…
    </div>
    <template v-else>
      <nav class="bmap-nav">
        <section
          v-for="group in groupedTabs"
          :key="group.id"
          class="bmap-group"
          :class="{ open: openGroups.has(group.id) }"
        >
          <button
            type="button"
            class="bmap-group-head"
            :aria-expanded="openGroups.has(group.id)"
            @click="toggleGroup(group.id)"
          >
            <span class="bmap-group-title">{{ group.label }}</span>
            <span class="bmap-group-count">{{ group.tabs.length }}</span>
            <UiIcon
              class="bmap-group-chevron"
              name="chevron-down"
              :size="14"
            />
          </button>
          <div
            v-show="openGroups.has(group.id)"
            class="bmap-group-tabs"
          >
            <button
              v-for="tab in group.tabs"
              :key="tab.id"
              type="button"
              :class="['bmap-tab', { active: activeTab === tab.id }]"
              @click="pickTab(tab.id, group.id)"
            >
              {{ tab.label }}
            </button>
          </div>
        </section>
      </nav>
      <div class="bmap-content">
        <component
          :is="currentTab.component"
          :key="currentTab.id"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Component } from "vue";
import { ensureBMapSDK } from "./composables/useBMap";
import UiIcon from "../../components/UiIcon";
import BMapBasic from "./components/BMapBasic.vue";
import BMapControls from "./components/BMapControls.vue";
import BMapBoundary from "./components/BMapBoundary.vue";
import BMapDrivingRoute from "./components/BMapDrivingRoute.vue";
import BMapTransitRoute from "./components/BMapTransitRoute.vue";
import BMapLocalSearch from "./components/BMapLocalSearch.vue";
import BMapCustomStyle from "./components/BMapCustomStyle.vue";
import BMapEarthMode from "./components/BMapEarthMode.vue";
import BMapThreeD from "./components/BMapThreeD.vue";
import BMapDraw from "./components/BMapDraw.vue";
import BMapAnimation from "./components/BMapAnimation.vue";
import BMapTrack from "./components/BMapTrack.vue";
import BMapViz from "./components/BMapViz.vue";
import BMapFlyline from "./components/BMapFlyline.vue";
import BMapMapvglHeatmap from "./components/BMapMapvglHeatmap.vue";
import BMapIconLayer from "./components/BMapIconLayer.vue";
import BMapShapeLayer from "./components/BMapShapeLayer.vue";
import BMapLineLayer from "./components/BMapLineLayer.vue";
import BMapLineTrip from "./components/BMapLineTrip.vue";
import BMapLinePoint from "./components/BMapLinePoint.vue";
import BMapWallLayer from "./components/BMapWallLayer.vue";
import BMapHeatmap from "./components/BMapHeatmap.vue";
import BMapMarkerClusterer from "./components/BMapMarkerClusterer.vue";
import BMapLushu from "./components/BMapLushu.vue";
import BMapCurveLine from "./components/BMapCurveLine.vue";
import BMapDrawingManager from "./components/BMapDrawingManager.vue";
import BMapDistanceTool from "./components/BMapDistanceTool.vue";
import BMapRichMarker from "./components/BMapRichMarker.vue";
import BMapCustomOverlay from "./components/BMapCustomOverlay.vue";
import BMapInfoWindow from "./components/BMapInfoWindow.vue";
import BMapMapEvents from "./components/BMapMapEvents.vue";
import BMapBuilding from "./components/BMapBuilding.vue";
import BMapWaimai from "./components/BMapWaimai.vue";
// 新增示例：数据可视化
import BMapPointCollection from "./components/BMapPointCollection.vue";
import BMapRegionColor from "./components/BMapRegionColor.vue";
import BMapTraffic from "./components/BMapTraffic.vue";
import BMapSatellite from "./components/BMapSatellite.vue";
// 新增示例：标注与交互
import BMapIconMarker from "./components/BMapIconMarker.vue";
import BMapContextMenu from "./components/BMapContextMenu.vue";
import BMapDraggableMarker from "./components/BMapDraggableMarker.vue";
import BMapInfoWindowStyle from "./components/BMapInfoWindowStyle.vue";
// 新增示例：地理编码与检索
import BMapGeocoder from "./components/BMapGeocoder.vue";
import BMapBusLine from "./components/BMapBusLine.vue";
import BMapAutocomplete from "./components/BMapAutocomplete.vue";
// 新增示例：量算与绘制
import BMapMeasure from "./components/BMapMeasure.vue";
import BMapCustomOverlayAdv from "./components/BMapCustomOverlayAdv.vue";

defineOptions({
  name: "BaiduMapView",
});

const scriptReady = ref(false);
const scriptError = ref("");

onMounted(async () => {
  try {
    await ensureBMapSDK();
    scriptReady.value = true;
  } catch (err) {
    scriptError.value = err instanceof Error ? err.message : "百度地图脚本加载失败";
  }
});

type TabItem = {
  id: string;
  label: string;
  component: Component;
};

const tabs: TabItem[] = [
  { id: "custom-style", label: "个性化地图", component: BMapCustomStyle },
  { id: "earth-mode", label: "地球模式", component: BMapEarthMode },
  { id: "basic", label: "基本用法", component: BMapBasic },
  { id: "controls", label: "地图控件", component: BMapControls },
  { id: "boundary", label: "行政区划", component: BMapBoundary },
  { id: "driving-route", label: "驾车规划", component: BMapDrivingRoute },
  { id: "transit-route", label: "公交规划", component: BMapTransitRoute },
  { id: "local-search", label: "周边搜索", component: BMapLocalSearch },
  { id: "heatmap", label: "热力图", component: BMapHeatmap },
  { id: "marker-clusterer", label: "标注聚合", component: BMapMarkerClusterer },
  { id: "lushu", label: "路书动画", component: BMapLushu },
  { id: "curve-line", label: "弧线", component: BMapCurveLine },
  { id: "drawing-manager", label: "绘制工具", component: BMapDrawingManager },
  { id: "distance-tool", label: "测距工具", component: BMapDistanceTool },
  { id: "rich-marker", label: "富标注", component: BMapRichMarker },
  { id: "custom-overlay", label: "自定义覆盖物", component: BMapCustomOverlay },
  { id: "info-window", label: "信息窗口", component: BMapInfoWindow },
  { id: "map-events", label: "地图事件", component: BMapMapEvents },
  { id: "three-d", label: "3D地图", component: BMapThreeD },
  { id: "draw", label: "绘制元素", component: BMapDraw },
  { id: "animation", label: "动画", component: BMapAnimation },
  { id: "track", label: "轨迹动画", component: BMapTrack },
  { id: "visualization", label: "可视化", component: BMapViz },
  { id: "flyline", label: "飞线", component: BMapFlyline },
  { id: "mapvgl-heatmap", label: "mapvgl热力", component: BMapMapvglHeatmap },
  { id: "icon-layer", label: "图标图层", component: BMapIconLayer },
  { id: "shape-layer", label: "形状图层", component: BMapShapeLayer },
  { id: "line-layer", label: "线图层", component: BMapLineLayer },
  { id: "line-trip", label: "迁徙图", component: BMapLineTrip },
  { id: "line-point", label: "线动画", component: BMapLinePoint },
  { id: "wall-layer", label: "3D墙体", component: BMapWallLayer },
  { id: "building", label: "3D建筑", component: BMapBuilding },
  { id: "waimai", label: "外卖指数", component: BMapWaimai },
  // 新增示例：数据可视化
  { id: "point-collection", label: "海量点", component: BMapPointCollection },
  { id: "region-color", label: "行政区分级上色", component: BMapRegionColor },
  { id: "traffic", label: "路况图层", component: BMapTraffic },
  { id: "satellite", label: "卫星图切换", component: BMapSatellite },
  // 新增示例：标注与交互
  { id: "icon-marker", label: "自定义图标标注", component: BMapIconMarker },
  { id: "context-menu", label: "右键菜单", component: BMapContextMenu },
  { id: "draggable-marker", label: "可拖拽标注", component: BMapDraggableMarker },
  { id: "info-window-style", label: "信息窗样式", component: BMapInfoWindowStyle },
  // 新增示例：地理编码与检索
  { id: "geocoder", label: "正/逆地理编码", component: BMapGeocoder },
  { id: "bus-line", label: "公交线路查询", component: BMapBusLine },
  { id: "autocomplete", label: "输入提示", component: BMapAutocomplete },
  // 新增示例：量算与绘制
  { id: "measure", label: "绘制与量算", component: BMapMeasure },
  { id: "custom-overlay-adv", label: "自定义覆盖物(进阶)", component: BMapCustomOverlayAdv },
];

const activeTab = ref(tabs[0]!.id);
const currentTab = computed(() => tabs.find((tab) => tab.id === activeTab.value) ?? tabs[0]!);

// ── 分类收纳(M0 审计 P1:46 个 chip 平铺无层级)──
// 归组映射全量显式:新增示例必须落组,不落组的会被归组断言拦下(见 groupedTabs 后的校验)
type GroupId = "basics" | "overlays" | "draw" | "routes" | "viz" | "search";

const GROUP_META: Record<GroupId, string> = {
  basics: "基础与地图模式",
  overlays: "覆盖物与标注",
  draw: "绘制与量算",
  routes: "路径与动画",
  viz: "可视化与热力",
  search: "检索与编码",
};

const GROUP_ORDER: GroupId[] = ["basics", "overlays", "draw", "routes", "viz", "search"];

const GROUP_OF: Record<string, GroupId> = {
  "custom-style": "basics",
  "earth-mode": "basics",
  basic: "basics",
  controls: "basics",
  "map-events": "basics",
  "three-d": "basics",
  satellite: "basics",
  boundary: "basics",
  "rich-marker": "overlays",
  "custom-overlay": "overlays",
  "custom-overlay-adv": "overlays",
  "info-window": "overlays",
  "info-window-style": "overlays",
  "icon-marker": "overlays",
  "draggable-marker": "overlays",
  "context-menu": "overlays",
  "marker-clusterer": "overlays",
  building: "overlays",
  "wall-layer": "overlays",
  "drawing-manager": "draw",
  "distance-tool": "draw",
  draw: "draw",
  measure: "draw",
  "driving-route": "routes",
  "transit-route": "routes",
  lushu: "routes",
  track: "routes",
  animation: "routes",
  "line-trip": "routes",
  "line-point": "routes",
  "bus-line": "routes",
  heatmap: "viz",
  visualization: "viz",
  flyline: "viz",
  "mapvgl-heatmap": "viz",
  "icon-layer": "viz",
  "shape-layer": "viz",
  "line-layer": "viz",
  "point-collection": "viz",
  "region-color": "viz",
  traffic: "viz",
  "curve-line": "viz",
  waimai: "viz",
  "local-search": "search",
  geocoder: "search",
  autocomplete: "search",
};

const groupedTabs = computed(() => {
  const ungrouped = tabs.filter((t) => !GROUP_OF[t.id]);
  if (ungrouped.length) throw new Error(`bmap 示例未归组:${ungrouped.map((t) => t.id).join(", ")}`);
  return GROUP_ORDER.map((id) => ({
    id,
    label: GROUP_META[id],
    tabs: tabs.filter((t) => GROUP_OF[t.id] === id),
  }));
});

const openGroups = ref(new Set<string>(["basics"]));

function toggleGroup(id: GroupId) {
  const next = new Set(openGroups.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  openGroups.value = next;
}

/** 激活某示例时保证其所在组是展开的(chip 只在展开组里可见,此处兜底编程式激活) */
function pickTab(id: string, groupId: GroupId) {
  activeTab.value = id;
  if (!openGroups.value.has(groupId)) {
    const next = new Set(openGroups.value);
    next.add(groupId);
    openGroups.value = next;
  }
}
</script>

<style>
/* 不使用 scoped，让子组件共享 bmap- 系列样式 */
.bmap-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100dvh;
  padding-top: calc(var(--cu-top-nav-height) + var(--cu-lg));
  padding-right: var(--cu-margin);
  padding-bottom: var(--cu-xl);
  padding-left: var(--cu-margin);
  background-color: var(--cu-background);
  color: var(--cu-on-surface);
}

.bmap-header p {
  margin: 0.5rem 0 0;
  color: var(--cu-on-surface-variant);
}

.bmap-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bmap-group {
  border: 1px solid var(--cu-outline-variant);
  border-radius: var(--cu-radius-lg);
  overflow: hidden;
}

.bmap-group-head {
  display: flex;
  align-items: center;
  gap: var(--cu-sm);
  width: 100%;
  padding: 0.55rem 0.9rem;
  border: none;
  background: var(--cu-surface-container-low);
  color: var(--cu-on-surface);
  font-weight: 600;
  font-size: var(--cu-fs-sm);
  cursor: pointer;
  transition: background var(--cu-dur-fast) var(--cu-ease);
}

.bmap-group-head:hover {
  background: var(--cu-surface-container);
}

.bmap-group-count {
  padding: 0 7px;
  border-radius: var(--cu-radius-full);
  background: var(--cu-surface-container-high);
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-xs);
  font-weight: 600;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
}

.bmap-group-chevron {
  margin-left: auto;
  color: var(--cu-on-surface-variant);
  transition: transform var(--cu-dur-fast) var(--cu-ease);
}

.bmap-group.open .bmap-group-chevron {
  transform: rotate(180deg);
}

.bmap-group-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 0.9rem 0.9rem;
  border-top: 1px solid var(--cu-outline-variant);
}

.bmap-tab {
  color: var(--cu-on-surface-variant);
  text-decoration: none;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: none;
  background: var(--cu-surface-container-high);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.bmap-tab:hover {
  background: var(--cu-surface-container-highest);
  color: var(--cu-on-surface);
}

.bmap-tab.active {
  background: var(--cu-primary);
  color: var(--cu-on-primary);
}

.bmap-content {
  min-height: 420px;
}

.bmap-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bmap-warning {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--cu-tertiary-container);
  color: var(--cu-on-tertiary-container);
  font-weight: 600;
}

.bmap-loading {
  padding: 2rem;
  text-align: center;
  color: var(--cu-on-surface-variant);
  font-size: 1rem;
}

.bmap-meta {
  color: var(--cu-on-surface-variant);
  font-size: 0.9rem;
}

.bmap-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.bmap-actions button {
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: 1px solid var(--cu-outline);
  background: var(--cu-surface-container-high);
  color: var(--cu-on-surface);
  cursor: pointer;
}

/* 子组件（LocalSearch / Boundary / DrivingRoute / TransitRoute）共用，各自只覆盖 min-width */
.bmap-actions input {
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--cu-outline);
  background: var(--cu-surface-container-lowest);
  color: var(--cu-on-surface);
  font-size: 0.9rem;
  min-width: 140px;
}

.bmap-container {
  position: relative;
  width: 100%;
  height: 420px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--cu-surface-container);
}

.bmap-input {
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--cu-outline);
  background: var(--cu-surface-container-lowest);
  color: var(--cu-on-surface);
  font-size: 0.9rem;
  min-width: 220px;
}

.bmap-ctx-menu {
  position: absolute;
  z-index: 20;
  background: var(--cu-surface-container-high);
  border: 1px solid var(--cu-outline);
  border-radius: 8px;
  box-shadow: var(--cu-shadow-3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bmap-ctx-menu button {
  border: none;
  background: transparent;
  color: var(--cu-on-surface);
  padding: 0.55rem 1rem;
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
}

.bmap-ctx-menu button:hover {
  background: var(--cu-surface-container-highest);
}

.data-card {
  position: absolute;
  transform: translate(-50%, -120%);
  background: var(--cu-surface-container-highest);
  border: 1px solid var(--cu-outline);
  border-left: 4px solid var(--cu-primary);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--cu-on-surface);
  white-space: nowrap;
  box-shadow: var(--cu-shadow-2);
  pointer-events: none;
}

.data-card strong {
  display: block;
  color: var(--cu-on-surface);
}

.data-card span {
  color: var(--cu-on-surface-variant);
}

</style>
