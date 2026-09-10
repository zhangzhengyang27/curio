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
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="['bmap-tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
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
</script>

<style>
/* 不使用 scoped，让子组件共享 bmap- 系列样式 */
.bmap-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.bmap-header p {
  margin: 0.5rem 0 0;
  color: #6b7280;
}

.bmap-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.bmap-tab {
  color: inherit;
  text-decoration: none;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: none;
  background: #f3f4f6;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.bmap-tab:hover {
  background: #e5e7eb;
}

.bmap-tab.active {
  background: #1e90ff;
  color: #fff;
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
  background: #fff7ed;
  color: #9a3412;
  font-weight: 600;
}

.bmap-loading {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 1rem;
}

.bmap-meta {
  color: #6b7280;
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
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
}

.bmap-container {
  position: relative;
  width: 100%;
  height: 420px;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
}

.bmap-input {
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
  min-width: 220px;
}

.bmap-ctx-menu {
  position: absolute;
  z-index: 20;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bmap-ctx-menu button {
  border: none;
  background: #fff;
  padding: 0.55rem 1rem;
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
}

.bmap-ctx-menu button:hover {
  background: #f3f4f6;
}

.data-card {
  position: absolute;
  transform: translate(-50%, -120%);
  background: #fff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #1e90ff;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: #374151;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  pointer-events: none;
}

.data-card strong {
  display: block;
  color: #111827;
}

.data-card span {
  color: #6b7280;
}

</style>
