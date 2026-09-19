// 由 scripts/generate-registry.js 生成（仅覆盖 three-cesium-examples 与 cesium-examples 两个源；其余 registry 需手动维护）。
// 合并保护：重跑本脚本会从 public/external-examples 重新解析并覆盖本文件，title/description/thumbnail/tags 等手工改动会被尽量保留，但结构性改动仍可能丢失，建议重跑前先 git diff 确认。

export default {
  "source": "cesium-examples",
  "label": "Cesium 案例",
  "examples": [
    {
      "id": "test",
      "category": "cesiumExamples/tools",
      "title": "测试",
      "titleEn": "test",
      "description": "这是一个基于 Cesium 的示例。运用了 影像图层 技术。",
      "thumbnail": "/example-thumbs/cesium-examples/cesiumExamples/tools/test.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/tools/test.js",
      "tags": [
        "Cesium",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "computerNewPoint",
      "category": "cesiumExamples/tools",
      "title": "计算新坐标",
      "titleEn": "computerNewPoint",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、Cesium Viewer、实体(Entity)、影像图层、相机飞行 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/tools/computerNewPoint.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/tools/computerNewPoint.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "computerAngle",
      "category": "cesiumExamples/tools",
      "title": "计算方位角",
      "titleEn": "computerAngle",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、Cesium Viewer、实体(Entity)、影像图层、矢量几何 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/tools/computerAngle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/tools/computerAngle.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "transformControls",
      "category": "cesiumExamples/tools",
      "title": "Cesium 3D 变换控制器",
      "titleEn": "Cesium 3D Transform Controls",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、Cesium Viewer、实体(Entity)、3D Tiles、影像图层 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/tools/transformControls.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/tools/transformControls.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "Cesium Viewer",
        "实体(Entity)",
        "3D Tiles"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "defaultLayer",
      "category": "cesiumExamples/layer",
      "title": "默认图层",
      "titleEn": "Default Layer",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/defaultLayer.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/defaultLayer.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "coordLayer",
      "category": "cesiumExamples/layer",
      "title": "坐标参考",
      "titleEn": "Coordinate",
      "description": "这是一个基于 Cesium 的示例。运用了 影像图层 技术。",
      "thumbnail": "/example-thumbs/cesium-examples/cesiumExamples/layer/coordLayer.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/coordLayer.js",
      "tags": [
        "Cesium",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "baiduLayer",
      "category": "cesiumExamples/layer",
      "title": "百度图层",
      "titleEn": "Baidu Layer",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/baiduLayer.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/baiduLayer.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "arcgisLayer",
      "category": "cesiumExamples/layer",
      "title": "arcgis图层",
      "titleEn": "ArcGIS Layer",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/arcgisLayer.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/arcgisLayer.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gaodeLayer",
      "category": "cesiumExamples/layer",
      "title": "高德图层",
      "titleEn": "Gaode Layer",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/gaodeLayer.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/gaodeLayer.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "mapfilterLayer",
      "category": "cesiumExamples/layer",
      "title": "地图滤镜",
      "titleEn": "Map Filter",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/mapfilterLayer.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/mapfilterLayer.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "tiandituLayer",
      "category": "cesiumExamples/layer",
      "title": "天地图",
      "titleEn": "Tianditu Layer",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/tiandituLayer.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/tiandituLayer.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "xyz",
      "category": "cesiumExamples/layer",
      "title": "OGC- xyz服务",
      "titleEn": "OGC-XYZ",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/xyz.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/xyz.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "tms",
      "category": "cesiumExamples/layer",
      "title": "OGC- tms服务",
      "titleEn": "OGC-TMS",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/tms.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/tms.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "wms",
      "category": "cesiumExamples/layer",
      "title": "OGC- wms服务",
      "titleEn": "OGC- WMS",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/wms.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/wms.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "wmts",
      "category": "cesiumExamples/layer",
      "title": "OGC- wmts服务",
      "titleEn": "OGC- WMTS",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/wmts.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/wmts.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "terrainLayer",
      "category": "cesiumExamples/layer",
      "title": "地形",
      "titleEn": "Terrain",
      "description": "这是一个基于 Cesium 的示例。运用了 水面模拟、Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/terrainLayer.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/terrainLayer.js",
      "tags": [
        "Cesium",
        "水面模拟",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gaodeTrans",
      "category": "cesiumExamples/layer",
      "title": "高德纠偏",
      "titleEn": "Gaode Transform",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、实体(Entity)、影像图层、相机飞行 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/layer/gaodeTrans.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/layer/gaodeTrans.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "day",
      "category": "cesiumExamples/offline",
      "title": "夜间",
      "titleEn": "Night Map",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/offline/day.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/offline/day.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "img",
      "category": "cesiumExamples/offline",
      "title": "影像",
      "titleEn": "Image Map",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/offline/img.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/offline/img.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "night",
      "category": "cesiumExamples/offline",
      "title": "夜间",
      "titleEn": "Night Map",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/offline/night.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/offline/night.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "baiDu",
      "category": "cesiumExamples/offline",
      "title": "内网百度",
      "titleEn": "Intranet Baidu",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/offline/baiDu.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/offline/baiDu.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gaode",
      "category": "cesiumExamples/offline",
      "title": "内网高德",
      "titleEn": "Intranet Gaode",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/offline/gaode.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/offline/gaode.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "switchView",
      "category": "cesiumExamples/basic",
      "title": "视角切换",
      "titleEn": "Switch View",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、Cesium Viewer、实体(Entity)、3D Tiles、影像图层 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/switchView.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/switchView.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "Cesium Viewer",
        "实体(Entity)",
        "3D Tiles"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cameraView",
      "category": "cesiumExamples/basic",
      "title": "记录视角",
      "titleEn": "Camera View",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、Cesium Viewer、影像图层、相机飞行、图元(Primitive) 技术。",
      "thumbnail": "/example-thumbs/cesium-examples/cesiumExamples/basic/cameraView.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/cameraView.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "Cesium Viewer",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "autoRotate",
      "category": "cesiumExamples/basic",
      "title": "自动旋转",
      "titleEn": "Auto Rotate",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、影像图层 技术。",
      "thumbnail": "/example-thumbs/cesium-examples/cesiumExamples/basic/autoRotate.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/autoRotate.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cesiumText",
      "category": "cesiumExamples/basic",
      "title": "绘制文字",
      "titleEn": "Draw Text",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层、相机飞行 等 技术。",
      "thumbnail": "/example-thumbs/cesium-examples/cesiumExamples/basic/cesiumText.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/cesiumText.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cssElement",
      "category": "cesiumExamples/basic",
      "title": "css2D元素",
      "titleEn": "CSS2D Element",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、影像图层、相机飞行 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/cssElement.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/cssElement.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "clickEvent",
      "category": "cesiumExamples/basic",
      "title": "点击事件",
      "titleEn": "Click Event",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、影像图层、相机飞行、矢量几何 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/clickEvent.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/clickEvent.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "skyBox",
      "category": "cesiumExamples/basic",
      "title": "天空盒",
      "titleEn": "Sky Box",
      "description": "这是一个基于 Cesium 的示例。运用了 天空盒、Cesium Viewer、实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/skyBox.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/skyBox.js",
      "tags": [
        "Cesium",
        "天空盒",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "geojsonFace",
      "category": "cesiumExamples/basic",
      "title": "geojson面",
      "titleEn": "GeoJSON Face",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、影像图层、相机飞行、GeoJSON 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/geojsonFace.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/geojsonFace.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "multPoint",
      "category": "cesiumExamples/basic",
      "title": "cesium大量点",
      "titleEn": "Multiple Points",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、影像图层、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/multPoint.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/multPoint.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "影像图层",
        "图元(Primitive)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "multPointCluster",
      "category": "cesiumExamples/basic",
      "title": "cesium大量点聚合",
      "titleEn": "Points Cluster",
      "description": "这是一个基于 Cesium 的示例。运用了 粒子/点云、Cesium Viewer、实体(Entity)、影像图层、图元(Primitive) 技术。",
      "thumbnail": "/example-thumbs/cesium-examples/cesiumExamples/basic/multPointCluster.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/multPointCluster.js",
      "tags": [
        "Cesium",
        "粒子/点云",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "multFaceLine",
      "category": "cesiumExamples/basic",
      "title": "cesium大量面线",
      "titleEn": "Face & Line",
      "description": "这是一个基于 Cesium 的示例。运用了 线条/线框、Cesium Viewer、实体(Entity)、影像图层、图元(Primitive) 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/multFaceLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/multFaceLine.js",
      "tags": [
        "Cesium",
        "线条/线框",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "multCurve",
      "category": "cesiumExamples/basic",
      "title": "cesium大量曲线",
      "titleEn": "Multiple Curves",
      "description": "这是一个基于 Cesium 的示例。运用了 粒子/点云、线条/线框、Cesium Viewer、实体(Entity)、影像图层 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/multCurve.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/multCurve.js",
      "tags": [
        "Cesium",
        "粒子/点云",
        "线条/线框",
        "Cesium Viewer",
        "实体(Entity)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "multText",
      "category": "cesiumExamples/basic",
      "title": "cesium大量文字",
      "titleEn": "Multiple Texts",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、影像图层、相机飞行、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/multText.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/multText.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "multBox",
      "category": "cesiumExamples/basic",
      "title": "cesium大量立方体",
      "titleEn": "Multiple Cubes",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、影像图层、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/multBox.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/multBox.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层",
        "图元(Primitive)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "loadModel",
      "category": "cesiumExamples/basic",
      "title": "加载模型",
      "titleEn": "Load Model",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、3D Tiles、影像图层、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/loadModel.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/loadModel.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "3D Tiles",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "drawLine",
      "category": "cesiumExamples/basic",
      "title": "绘制线段",
      "titleEn": "Draw drawLine",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、Cesium Viewer、实体(Entity)、影像图层、相机飞行 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/drawLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/drawLine.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "keyboardRoam",
      "category": "cesiumExamples/basic",
      "title": "键盘控制相机",
      "titleEn": "KeyboardRoam",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/keyboardRoam.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/keyboardRoam.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "officialPointCluster",
      "category": "cesiumExamples/basic",
      "title": "官方点聚合",
      "titleEn": "Official Points Cluster",
      "description": "这是一个基于 Cesium 的示例。运用了 粒子/点云、实体(Entity)、影像图层、KML、GeoJSON 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/officialPointCluster.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/officialPointCluster.js",
      "tags": [
        "Cesium",
        "粒子/点云",
        "实体(Entity)",
        "影像图层",
        "KML"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "drawDivElement",
      "category": "cesiumExamples/basic",
      "title": "div元素绘制",
      "titleEn": "drawDivElement",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层、相机飞行 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/drawDivElement.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/drawDivElement.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "boundBorder",
      "category": "cesiumExamples/basic",
      "title": "边界框",
      "titleEn": "Bound Border",
      "description": "这是一个基于 Cesium 的示例。运用了 雾化、Cesium Viewer、实体(Entity)、影像图层、相机飞行 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/boundBorder.webp",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/boundBorder.js",
      "tags": [
        "Cesium",
        "雾化",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "tilesShader",
      "category": "cesiumExamples/basic",
      "title": "智慧城市着色器",
      "titleEn": "SmartCity",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、3D Tiles、影像图层、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/tilesShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/tilesShader.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "3D Tiles",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "smartCity",
      "category": "cesiumExamples/basic",
      "title": "智慧城市光",
      "titleEn": "City Light",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、3D Tiles、影像图层、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/smartCity.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/smartCity.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "3D Tiles",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "flyLine",
      "category": "cesiumExamples/basic",
      "title": "流动飞线运动",
      "titleEn": "Flowing Line",
      "description": "这是一个基于 Cesium 的示例。运用了 粒子/点云、实体(Entity)、影像图层、相机飞行、矢量几何 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/flyLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/flyLine.js",
      "tags": [
        "Cesium",
        "粒子/点云",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "curvePipe",
      "category": "cesiumExamples/basic",
      "title": "曲线管道",
      "titleEn": "Curve Pipe",
      "description": "这是一个基于 Cesium 的示例。运用了 粒子/点云、实体(Entity)、影像图层、相机飞行、矢量几何 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/curvePipe.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/curvePipe.js",
      "tags": [
        "Cesium",
        "粒子/点云",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "routeNavigation",
      "category": "cesiumExamples/basic",
      "title": "路线导航",
      "titleEn": "Route Nav",
      "description": "这是一个基于 Cesium 的示例。运用了 粒子/点云、实体(Entity)、影像图层、矢量几何、运动轨迹 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/routeNavigation.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/routeNavigation.js",
      "tags": [
        "Cesium",
        "粒子/点云",
        "实体(Entity)",
        "影像图层",
        "矢量几何"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cameraCurveRoam",
      "category": "cesiumExamples/basic",
      "title": "曲线漫游",
      "titleEn": "Curve Roam",
      "description": "这是一个基于 Cesium 的示例。运用了 飞行控制、粒子/点云、GUI调试面板、Cesium Viewer、实体(Entity) 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/basic/cameraCurveRoam.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/basic/cameraCurveRoam.js",
      "tags": [
        "Cesium",
        "飞行控制",
        "粒子/点云",
        "GUI调试面板",
        "Cesium Viewer"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "fire",
      "category": "cesiumExamples/expand",
      "title": "粒子（火焰）",
      "titleEn": "Particle(Fire)",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/fire.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/fire.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "ripple",
      "category": "cesiumExamples/expand",
      "title": "水波纹",
      "titleEn": "Ripple",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/ripple.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/ripple.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cesiumShadertoy",
      "category": "cesiumExamples/expand",
      "title": "使用Shadertoy",
      "titleEn": "Use Shadertoy",
      "description": "这是一个基于 Cesium 的示例。运用了 雾化、Cesium Viewer、实体(Entity)、影像图层、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/cesiumShadertoy.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/cesiumShadertoy.js",
      "tags": [
        "Cesium",
        "雾化",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "waterMaterial",
      "category": "cesiumExamples/expand",
      "title": "水波材质",
      "titleEn": "Water Material",
      "description": "这是一个基于 Cesium 的示例。运用了 水面模拟、Cesium Viewer、实体(Entity)、影像图层、相机飞行 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/waterMaterial.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/waterMaterial.js",
      "tags": [
        "Cesium",
        "水面模拟",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "snow",
      "category": "cesiumExamples/expand",
      "title": "雪景",
      "titleEn": "Snow Scene",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、3D Tiles、影像图层、相机飞行 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/snow.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/snow.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "3D Tiles",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "rain",
      "category": "cesiumExamples/expand",
      "title": "下雨",
      "titleEn": "Rain",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、3D Tiles、影像图层、相机飞行 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/rain.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/rain.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "3D Tiles",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "lensFlare",
      "category": "cesiumExamples/expand",
      "title": "镜头光晕",
      "titleEn": "Lens Flare",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层、相机飞行 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/lensFlare.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/lensFlare.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cityLight",
      "category": "cesiumExamples/expand",
      "title": "城市光影",
      "titleEn": "City Light",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、Cesium Viewer、实体(Entity)、3D Tiles、影像图层 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/cityLight.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/cityLight.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "Cesium Viewer",
        "实体(Entity)",
        "3D Tiles"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "volumetricCloud",
      "category": "cesiumExamples/expand",
      "title": "cesium体积云",
      "titleEn": "volumetricCloud",
      "description": "这是一个基于 Cesium 的示例。运用了 天空盒、Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/volumetricCloud.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/volumetricCloud.js",
      "tags": [
        "Cesium",
        "天空盒",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "dynamicWater",
      "category": "cesiumExamples/expand",
      "title": "cesium动态体积水",
      "titleEn": "dynamicWater",
      "description": "这是一个基于 Cesium 的示例。运用了 粒子/点云、水面模拟、GUI调试面板、Cesium Viewer、实体(Entity) 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/dynamicWater.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/dynamicWater.js",
      "tags": [
        "Cesium",
        "粒子/点云",
        "水面模拟",
        "GUI调试面板",
        "Cesium Viewer"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gradienGeojsonFace",
      "category": "cesiumExamples/expand",
      "title": "渐变行政区",
      "titleEn": "Gradient Area",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层、相机飞行、GeoJSON、矢量几何 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/gradienGeojsonFace.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/gradienGeojsonFace.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层",
        "相机飞行",
        "GeoJSON"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cesiumAndThree",
      "category": "cesiumExamples/expand",
      "title": "cesium融合three",
      "titleEn": "Cesium+Three",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层、相机飞行 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/cesiumAndThree.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/cesiumAndThree.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cesium_three",
      "category": "cesiumExamples/expand",
      "title": "cesium深度融合three",
      "titleEn": "Cesium && Three",
      "description": "这是一个基于 Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GLTF模型加载、水面模拟、射线拾取交互 等 技术。",
      "thumbnail": "/example-thumbs/cesium-examples/cesiumExamples/expand/cesium_three.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/cesium_three.js",
      "tags": [
        "Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GLTF模型加载",
        "水面模拟"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cesiumSwitch",
      "category": "cesiumExamples/expand",
      "title": "Cesium Three切换",
      "titleEn": "Cesium Switch",
      "description": "这是一个基于 Cesium 的示例。运用了 轨道控制、GLTF模型加载、GUI调试面板、Cesium Viewer、实体(Entity) 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/cesiumSwitch.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/cesiumSwitch.js",
      "tags": [
        "Cesium",
        "轨道控制",
        "GLTF模型加载",
        "GUI调试面板",
        "Cesium Viewer"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "echartsFlyLine",
      "category": "cesiumExamples/expand",
      "title": "echarts飞线",
      "titleEn": "EchartsFlyLine",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层、相机飞行 技术。",
      "thumbnail": "/example-thumbs/cesium-examples/cesiumExamples/expand/echartsFlyLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/echartsFlyLine.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "heatMap",
      "category": "cesiumExamples/expand",
      "title": "热力图",
      "titleEn": "Heat Map",
      "description": "这是一个基于 Cesium 的示例。运用了 粒子/点云、实体(Entity)、影像图层 技术。",
      "thumbnail": "/example-thumbs/cesium-examples/cesiumExamples/expand/heatMap.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/heatMap.js",
      "tags": [
        "Cesium",
        "粒子/点云",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "3DheatMap",
      "category": "cesiumExamples/expand",
      "title": "3D热力图",
      "titleEn": "3D Heat Map",
      "description": "这是一个基于 Cesium 的示例。运用了 粒子/点云、实体(Entity)、影像图层、相机飞行、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/3DheatMap.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/3DheatMap.js",
      "tags": [
        "Cesium",
        "粒子/点云",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "transportLine",
      "category": "cesiumExamples/expand",
      "title": "交通线路",
      "titleEn": "Transport Line",
      "description": "这是一个基于 Cesium 的示例。运用了 粒子/点云、线条/线框、GUI调试面板、Cesium Viewer、实体(Entity) 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/transportLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/transportLine.js",
      "tags": [
        "Cesium",
        "粒子/点云",
        "线条/线框",
        "GUI调试面板",
        "Cesium Viewer"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "viewshedSphere",
      "category": "cesiumExamples/expand",
      "title": "可视域分析-球面",
      "titleEn": "ViewshedSphere",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、Cesium Viewer、实体(Entity)、3D Tiles、地形(Terrain) 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/expand/viewshedSphere.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/expand/viewshedSphere.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "Cesium Viewer",
        "实体(Entity)",
        "3D Tiles"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "radar",
      "category": "cesiumExamples/effect",
      "title": "雷达扫描",
      "titleEn": "Radar Scan",
      "description": "这是一个基于 Cesium 的示例。运用了 粒子/点云、实体(Entity)、影像图层、相机飞行 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/effect/radar.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/effect/radar.js",
      "tags": [
        "Cesium",
        "粒子/点云",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "radarEmission",
      "category": "cesiumExamples/effect",
      "title": "雷达探测",
      "titleEn": "Radar Emission",
      "description": "这是一个基于 Cesium 的示例。运用了 实体(Entity)、影像图层、相机飞行、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/effect/radarEmission.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/effect/radarEmission.js",
      "tags": [
        "Cesium",
        "实体(Entity)",
        "影像图层",
        "相机飞行",
        "图元(Primitive)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "dynamicWall",
      "category": "cesiumExamples/effect",
      "title": "动态围墙",
      "titleEn": "Dynamic Wall",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、影像图层、相机飞行 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/effect/dynamicWall.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/effect/dynamicWall.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "smokeEffect",
      "category": "cesiumExamples/effect",
      "title": "烟雾效果",
      "titleEn": "Smoke Effect",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/effect/smokeEffect.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/effect/smokeEffect.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "dynamicWallSimple",
      "category": "cesiumExamples/effect",
      "title": "动态围墙(简易版)",
      "titleEn": "dynamicWall Simple",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/effect/dynamicWallSimple.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/effect/dynamicWallSimple.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gradientWall",
      "category": "cesiumExamples/effect",
      "title": "渐变色墙体",
      "titleEn": "Gradient Wall",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层、相机飞行 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/effect/gradientWall.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/effect/gradientWall.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "postProcessStage",
      "category": "cesiumExamples/effect",
      "title": "cesium后期处理",
      "titleEn": "postProcessStage",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/effect/postProcessStage.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/effect/postProcessStage.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "instanceRender",
      "category": "cesiumExamples/application",
      "title": "实例化渲染",
      "titleEn": "Instance Render",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、影像图层、相机飞行、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/application/instanceRender.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/application/instanceRender.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "影像图层",
        "相机飞行",
        "图元(Primitive)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "globeMap",
      "category": "cesiumExamples/application",
      "title": "地球贴图",
      "titleEn": "Globe Map",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、影像图层、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/application/globeMap.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/application/globeMap.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层",
        "图元(Primitive)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "controlModel",
      "category": "cesiumExamples/application",
      "title": "键盘控制飞行",
      "titleEn": "controlModel",
      "description": "这是一个基于 Cesium 的示例。运用了 GUI调试面板、Cesium Viewer、实体(Entity)、影像图层、相机飞行 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/application/controlModel.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/application/controlModel.js",
      "tags": [
        "Cesium",
        "GUI调试面板",
        "Cesium Viewer",
        "实体(Entity)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cssElementTrack",
      "category": "cesiumExamples/application",
      "title": "div随轨迹运动",
      "titleEn": "cssElementTrack",
      "description": "这是一个基于 Cesium 的示例。运用了 Cesium Viewer、实体(Entity)、地形(Terrain)、影像图层、相机飞行 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/cesiumExamples/application/cssElementTrack.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/cesiumExamples/application/cssElementTrack.js",
      "tags": [
        "Cesium",
        "Cesium Viewer",
        "实体(Entity)",
        "地形(Terrain)",
        "影像图层"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    }
  ]
}
