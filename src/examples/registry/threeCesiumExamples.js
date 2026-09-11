// 由 scripts/generate-registry.js 生成（仅覆盖 three-cesium-examples 与 cesium-examples 两个源；其余 registry 需手动维护）。
// 合并保护：重跑本脚本会从 public/external-examples 重新解析并覆盖本文件，title/description/thumbnail/tags 等手工改动会被尽量保留，但结构性改动仍可能丢失，建议重跑前先 git diff 确认。

export default {
  "source": "three-cesium-examples",
  "label": "Three.js 案例",
  "examples": [
    {
      "id": "test",
      "category": "threeExamples/other",
      "title": "测试",
      "titleEn": "test",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/other/test.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/other/test.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "areaMap",
      "category": "threeExamples/other",
      "title": "分级地图",
      "titleEn": "Area Map",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、纹理加载、线条/线框、射线拾取交互、CSS2D渲染 等 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/other/areaMap.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/other/areaMap.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "纹理加载",
        "线条/线框",
        "射线拾取交互"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "2025Year",
      "category": "threeExamples/application",
      "title": "2025",
      "titleEn": "2025 Year",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、着色器后处理、WebGPU后处理、线条/线框、环境反射(PBR) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/2025Year.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/2025Year.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "着色器后处理",
        "WebGPU后处理",
        "线条/线框"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "700stars",
      "category": "threeExamples/application",
      "title": "1000stars留念",
      "titleEn": "1000stars",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 线框模式、雾化、地形(Terrain) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/700stars.jpg",
      "tag": "tag: TEXTS['共享'] + '-rgb(198,0,0)'",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/700stars.js",
      "tags": [
        "Three.js+Cesium",
        "线框模式",
        "雾化",
        "地形(Terrain)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "z2586300277",
      "category": "threeExamples/application",
      "title": "优雅永不过时",
      "titleEn": "Elegant Always",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、OBJ模型加载、纹理加载、线框模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/z2586300277.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/z2586300277.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "OBJ模型加载",
        "纹理加载",
        "线框模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "magicCircle",
      "category": "threeExamples/application",
      "title": "魔法阵",
      "titleEn": "Magic Circle",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、粒子/点云、纹理加载、实时阴影、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/magicCircle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/magicCircle.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "粒子/点云",
        "纹理加载",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "codeCloud",
      "category": "threeExamples/application",
      "title": "代码云",
      "titleEn": "Code Cloud",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/codeCloud.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/codeCloud.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "ghostHouse",
      "category": "threeExamples/application",
      "title": "鬼屋",
      "titleEn": "Ghost House",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载、GUI调试面板、雾化、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/ghostHouse.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/ghostHouse.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载",
        "GUI调试面板",
        "雾化",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "canvasTexture",
      "category": "threeExamples/application",
      "title": "Canvas贴图",
      "titleEn": "Canvas Texture",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/canvasTexture.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/canvasTexture.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "flowLine",
      "category": "threeExamples/application",
      "title": "贴图飞线",
      "titleEn": "Flow Line",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/flowLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/flowLine.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "flyLine",
      "category": "threeExamples/application",
      "title": "飞线效果",
      "titleEn": "Fly Line",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、纹理加载 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/application/flyLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/flyLine.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "pipeFlow",
      "category": "threeExamples/application",
      "title": "管道流动",
      "titleEn": "Pipe Flow",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载、线条/线框、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/pipeFlow.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/pipeFlow.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载",
        "线条/线框",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "buildingLine",
      "category": "threeExamples/application",
      "title": "建筑线条",
      "titleEn": "Building Line",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、纹理加载、线条/线框、天空盒、立方体/全景环境 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/buildingLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/buildingLine.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "纹理加载",
        "线条/线框",
        "天空盒"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "videoModel",
      "category": "threeExamples/application",
      "title": "模型视频材质",
      "titleEn": "Video Model",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、纹理加载、天空盒、视频纹理、立方体/全景环境 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/videoModel.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/videoModel.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "纹理加载",
        "天空盒",
        "视频纹理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "spriteText",
      "category": "threeExamples/application",
      "title": "精灵文字",
      "titleEn": "Sprite Text",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/spriteText.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/spriteText.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "diffuseLine",
      "category": "threeExamples/application",
      "title": "发散飞线",
      "titleEn": "Diffuse Line",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、纹理加载、射线拾取交互 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/diffuseLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/diffuseLine.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "纹理加载",
        "射线拾取交互"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "lampshade",
      "category": "threeExamples/application",
      "title": "灯罩",
      "titleEn": "Lampshade",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/lampshade.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/lampshade.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "smokeAir",
      "category": "threeExamples/application",
      "title": "烟雾效果",
      "titleEn": "Smoke Air",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、WebXR沉浸、KML 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/application/smokeAir.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/smokeAir.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "WebXR沉浸",
        "KML"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "lightIcon",
      "category": "threeExamples/application",
      "title": "亮光标记",
      "titleEn": "Light Icon",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/lightIcon.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/lightIcon.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "topology",
      "category": "threeExamples/application",
      "title": "简单3d拓扑图",
      "titleEn": "3D Topology",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/topology.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/topology.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "pieCharts",
      "category": "threeExamples/application",
      "title": "3D饼图",
      "titleEn": "3D Pie",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 3D文字 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/pieCharts.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/pieCharts.js",
      "tags": [
        "Three.js+Cesium",
        "3D文字"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "drawFace",
      "category": "threeExamples/application",
      "title": "绘制面",
      "titleEn": "Draw Face",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 射线拾取交互 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/drawFace.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/drawFace.js",
      "tags": [
        "Three.js+Cesium",
        "射线拾取交互"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "roadShader",
      "category": "threeExamples/application",
      "title": "道路流光",
      "titleEn": "Road Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、输出合成、自定义GLSL着色器、WebGPU后处理 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/roadShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/roadShader.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "输出合成",
        "自定义GLSL着色器",
        "WebGPU后处理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "lineMeasure",
      "category": "threeExamples/application",
      "title": "测量",
      "titleEn": "Line Measure",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 变换控制(Gizmo)、粒子/点云、线条/线框、射线拾取交互 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/lineMeasure.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/lineMeasure.js",
      "tags": [
        "Three.js+Cesium",
        "变换控制(Gizmo)",
        "粒子/点云",
        "线条/线框",
        "射线拾取交互"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "textSphere",
      "category": "threeExamples/application",
      "title": "球体文字",
      "titleEn": "Text Sphere",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 3D文字、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/textSphere.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/textSphere.js",
      "tags": [
        "Three.js+Cesium",
        "3D文字",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "coffeeMug",
      "category": "threeExamples/application",
      "title": "咖啡",
      "titleEn": "Coffee Mug",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GLTF模型加载、纹理加载、GUI调试面板、线框模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/coffeeMug.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/coffeeMug.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GLTF模型加载",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "lightBar",
      "category": "threeExamples/application",
      "title": "光柱",
      "titleEn": "Light Bar",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/lightBar.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/lightBar.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gridFloor",
      "category": "threeExamples/application",
      "title": "贴图网格地面",
      "titleEn": "Grid Floor",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/gridFloor.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/gridFloor.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "flowerRain",
      "category": "threeExamples/application",
      "title": "花瓣雨",
      "titleEn": "Flower Rain",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/flowerRain.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/flowerRain.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "houseScene",
      "category": "threeExamples/application",
      "title": "第一人称房屋",
      "titleEn": "House Scene",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 第一人称控制、FBX模型加载、纹理加载、雾化 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/houseScene.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/houseScene.js",
      "tags": [
        "Three.js+Cesium",
        "第一人称控制",
        "FBX模型加载",
        "纹理加载",
        "雾化"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "3DCircle",
      "category": "threeExamples/application",
      "title": "扩散半球",
      "titleEn": "3D Circle",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、纹理加载 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/application/3DCircle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/3DCircle.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "happyNewYear",
      "category": "threeExamples/application",
      "title": "新年快乐",
      "titleEn": "Happy Year",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、线框模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/happyNewYear.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/happyNewYear.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "线框模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "windMove",
      "category": "threeExamples/application",
      "title": "风吹动画",
      "titleEn": "Wind Move",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GLTF模型加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/windMove.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/windMove.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GLTF模型加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "imageMove",
      "category": "threeExamples/application",
      "title": "图片移动",
      "titleEn": "Image Move",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/imageMove.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/imageMove.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "vrVideo",
      "category": "threeExamples/application",
      "title": "VR 全景视频",
      "titleEn": "VR Video",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 WebXR沉浸、视频纹理 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/vrVideo.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/vrVideo.js",
      "tags": [
        "Three.js+Cesium",
        "WebXR沉浸",
        "视频纹理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "customGrid",
      "category": "threeExamples/application",
      "title": "自定义网格",
      "titleEn": "Custom Grid",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 线条/线框 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/customGrid.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/customGrid.js",
      "tags": [
        "Three.js+Cesium",
        "线条/线框"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "faceMesh",
      "category": "threeExamples/application",
      "title": "表情",
      "titleEn": "Face Mesh",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载、立方体/全景环境、环境反射(PBR)、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/faceMesh.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/faceMesh.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载",
        "立方体/全景环境",
        "环境反射(PBR)",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "sportFence",
      "category": "threeExamples/application",
      "title": "流动围栏",
      "titleEn": "Sport Fence",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、纹理加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/sportFence.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/sportFence.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "isoline",
      "category": "threeExamples/application",
      "title": "等值线",
      "titleEn": "Isoline",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 地形(Terrain) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/isoline.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/isoline.js",
      "tags": [
        "Three.js+Cesium",
        "地形(Terrain)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "flowTube",
      "category": "threeExamples/application",
      "title": "管道表面运动",
      "titleEn": "Flow Tube",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/flowTube.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/flowTube.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "videoEffect",
      "category": "threeExamples/application",
      "title": "视频碎片",
      "titleEn": "Video Effect",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 视频纹理 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/videoEffect.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/videoEffect.js",
      "tags": [
        "Three.js+Cesium",
        "视频纹理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "drawFence",
      "category": "threeExamples/application",
      "title": "绘制围栏",
      "titleEn": "Draw Fence",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、纹理加载、射线拾取交互 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/drawFence.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/drawFence.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "纹理加载",
        "射线拾取交互"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "punk",
      "category": "threeExamples/application",
      "title": "朋克风",
      "titleEn": "Style Punk",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/punk.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/punk.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "radarScan",
      "category": "threeExamples/application",
      "title": "雷达扫描",
      "titleEn": "Radar Scan",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/radarScan.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/radarScan.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "model_base",
      "category": "threeExamples/application",
      "title": "生成模型底座",
      "titleEn": "Model Base",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、Draco压缩 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/model_base.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/model_base.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "Draco压缩"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "coneMesh",
      "category": "threeExamples/application",
      "title": "圆锥网格",
      "titleEn": "Cone Mesh",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、辉光(Bloom)、WebGPU后处理、纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/coneMesh.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/coneMesh.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "辉光(Bloom)",
        "WebGPU后处理",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "videoFloor",
      "category": "threeExamples/application",
      "title": "视频地板",
      "titleEn": "Video Floor",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 视频纹理 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/videoFloor.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/videoFloor.js",
      "tags": [
        "Three.js+Cesium",
        "视频纹理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "rainRoof",
      "category": "threeExamples/application",
      "title": "下雨效果",
      "titleEn": "Rain Roof",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、纹理加载、线条/线框 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/rainRoof.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/rainRoof.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "纹理加载",
        "线条/线框"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "samplexWave",
      "category": "threeExamples/application",
      "title": "采样波",
      "titleEn": "Samplex Wave",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、辉光(Bloom)、WebGPU后处理、粒子/点云、射线拾取交互 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/samplexWave.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/samplexWave.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "辉光(Bloom)",
        "WebGPU后处理",
        "粒子/点云"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "tweenFire",
      "category": "threeExamples/application",
      "title": "精灵火花",
      "titleEn": "Tween Fire",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GUI调试面板、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/tweenFire.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/tweenFire.js",
      "tags": [
        "Three.js+Cesium",
        "GUI调试面板",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelHeatmap",
      "category": "threeExamples/application",
      "title": "模型热力图",
      "titleEn": "Model Heatmap",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GLTF模型加载、GUI调试面板、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/modelHeatmap.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/modelHeatmap.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GLTF模型加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "geometryMerge",
      "category": "threeExamples/application",
      "title": "几何合并",
      "titleEn": "Geometry Merge",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、纹理加载、天空盒、Draco压缩、立方体/全景环境 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/geometryMerge.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/geometryMerge.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "纹理加载",
        "天空盒",
        "Draco压缩"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "measurement",
      "category": "threeExamples/application",
      "title": "测量",
      "titleEn": "Measurement",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、线条/线框 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/measurement.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/measurement.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "线条/线框"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gsapTimeLine",
      "category": "threeExamples/application",
      "title": "时间轴动画",
      "titleEn": "Gsap TimeLine",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/gsapTimeLine.jpg",
      "tag": "GSAP",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/gsapTimeLine.js",
      "tags": [
        "Three.js+Cesium",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelBorder",
      "category": "threeExamples/application",
      "title": "模型边框",
      "titleEn": "Model Border",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、线条/线框、Draco压缩 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/modelBorder.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/modelBorder.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "线条/线框",
        "Draco压缩"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelParticle",
      "category": "threeExamples/application",
      "title": "模型粒子化",
      "titleEn": "Model Particle",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、GLTF模型加载、纹理加载、Draco压缩 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/modelParticle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/modelParticle.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "GLTF模型加载",
        "纹理加载",
        "Draco压缩"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "dynamicTube",
      "category": "threeExamples/application",
      "title": "动态管道",
      "titleEn": "Dynamic Tube",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、辉光(Bloom)、WebGPU后处理、粒子/点云、纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/dynamicTube.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/dynamicTube.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "辉光(Bloom)",
        "WebGPU后处理",
        "粒子/点云"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "girdMaterial",
      "category": "threeExamples/application",
      "title": "网格材质",
      "titleEn": "Gird Material",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/girdMaterial.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/girdMaterial.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "jumpAnimate",
      "category": "threeExamples/application",
      "title": "跳跃动画",
      "titleEn": "Jump Animate",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GUI调试面板、线框模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/jumpAnimate.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/jumpAnimate.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GUI调试面板",
        "线框模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "pointCloudFpsOctree",
      "category": "threeExamples/application",
      "title": "点云第一人称漫游,碰撞检测",
      "titleEn": "Point Cloud FPS Octree",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 指针锁定(FPS)控制、粒子/点云、线条/线框、射线拾取交互、八叉树碰撞 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/pointCloudFpsOctree.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/pointCloudFpsOctree.js",
      "tags": [
        "Three.js+Cesium",
        "指针锁定(FPS)控制",
        "粒子/点云",
        "线条/线框",
        "射线拾取交互"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "windTurbineWake",
      "category": "threeExamples/application",
      "title": "风力涡轮机尾迹",
      "titleEn": "Wind Turbine Wake",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、纹理加载、水面模拟、雾化、实时阴影 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/windTurbineWake.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/windTurbineWake.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "纹理加载",
        "水面模拟",
        "雾化"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gsapCollection",
      "category": "threeExamples/application",
      "title": "动画合集",
      "titleEn": "GSAP",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 雾化 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/gsapCollection.jpg",
      "tag": "GSAP",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/gsapCollection.js",
      "tags": [
        "Three.js+Cesium",
        "雾化"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "pointLockControls",
      "category": "threeExamples/application",
      "title": "第一人称漫游控制",
      "titleEn": "Person Move",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 指针锁定(FPS)控制、FBX模型加载、纹理加载、天空盒、GUI调试面板 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/application/pointLockControls.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/application/pointLockControls.js",
      "tags": [
        "Three.js+Cesium",
        "指针锁定(FPS)控制",
        "FBX模型加载",
        "纹理加载",
        "天空盒"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cityEffect",
      "category": "threeExamples/shader",
      "title": "城市光效",
      "titleEn": "City Effect",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 FBX模型加载、纹理加载、线条/线框、天空盒、立方体/全景环境 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/cityEffect.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/cityEffect.js",
      "tags": [
        "Three.js+Cesium",
        "FBX模型加载",
        "纹理加载",
        "线条/线框",
        "天空盒"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "grassShader",
      "category": "threeExamples/shader",
      "title": "草地着色器",
      "titleEn": "Grass Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、天空盒、立方体/全景环境 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/grassShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/grassShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "天空盒",
        "立方体/全景环境"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "audioSolutions",
      "category": "threeExamples/shader",
      "title": "音乐可视化",
      "titleEn": "Audio visual",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、空间音频(WebAudio)、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/audioSolutions.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/audioSolutions.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "空间音频(WebAudio)",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cityBlendLight",
      "category": "threeExamples/shader",
      "title": "城市混合扫光",
      "titleEn": "City Blend",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 FBX模型加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/cityBlendLight.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/cityBlendLight.js",
      "tags": [
        "Three.js+Cesium",
        "FBX模型加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "oceanShader",
      "category": "threeExamples/shader",
      "title": "海面",
      "titleEn": "Ocean Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、纹理加载、水面模拟、天空盒、GUI调试面板 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/oceanShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/oceanShader.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "纹理加载",
        "水面模拟",
        "天空盒"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "chinaFlag",
      "category": "threeExamples/shader",
      "title": "中国旗帜",
      "titleEn": "China Flag",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/chinaFlag.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/chinaFlag.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "circleWave",
      "category": "threeExamples/shader",
      "title": "圆波扫光",
      "titleEn": "Circle Wave",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、GUI调试面板、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/circleWave.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/circleWave.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "GUI调试面板",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "fenceWall",
      "category": "threeExamples/shader",
      "title": "围墙着色器",
      "titleEn": "Fence Wall",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/fenceWall.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/fenceWall.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "transparentGradient",
      "category": "threeExamples/shader",
      "title": "透明渐变",
      "titleEn": "Trans Grad",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、纹理加载、天空盒、GUI调试面板 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/transparentGradient.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/transparentGradient.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "纹理加载",
        "天空盒"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "fenceShader",
      "category": "threeExamples/shader",
      "title": "围栏着色器",
      "titleEn": "Fence Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/fenceShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/fenceShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "loveShader",
      "category": "threeExamples/shader",
      "title": "爱心",
      "titleEn": "Love Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/loveShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/loveShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cityMixShader",
      "category": "threeExamples/shader",
      "title": "城市混合Shader",
      "titleEn": "CityMixShader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 FBX模型加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/cityMixShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/cityMixShader.js",
      "tags": [
        "Three.js+Cesium",
        "FBX模型加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "tachnologyFloor",
      "category": "threeExamples/shader",
      "title": "科技风地面",
      "titleEn": "TachnologyFloor",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、纹理加载、雾化、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/tachnologyFloor.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/tachnologyFloor.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "纹理加载",
        "雾化",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "threeLogo",
      "category": "threeExamples/shader",
      "title": "three.js Logo",
      "titleEn": "Three Logo",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/threeLogo.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/threeLogo.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "raningSea",
      "category": "threeExamples/shader",
      "title": "波涛海浪",
      "titleEn": "move Sea",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、水面模拟、GUI调试面板、雾化 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/raningSea.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/raningSea.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "水面模拟",
        "GUI调试面板",
        "雾化"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "warnInfo",
      "category": "threeExamples/shader",
      "title": "警告信息",
      "titleEn": "Warn Info",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GLTF模型加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/warnInfo.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/warnInfo.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GLTF模型加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "textStarShader",
      "category": "threeExamples/shader",
      "title": "点星感谢",
      "titleEn": "Text Star",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨迹球控制、自定义GLSL着色器、3D文字、线框模式、网格简化 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/textStarShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/textStarShader.js",
      "tags": [
        "Three.js+Cesium",
        "轨迹球控制",
        "自定义GLSL着色器",
        "3D文字",
        "线框模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cityMoveLight",
      "category": "threeExamples/shader",
      "title": "智慧城市扫光",
      "titleEn": "City Move",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、FBX模型加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/cityMoveLight.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/cityMoveLight.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "FBX模型加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cityLight",
      "category": "threeExamples/shader",
      "title": "城市光影",
      "titleEn": "City Light",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、FBX模型加载、Draco压缩、线框模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/cityLight.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/cityLight.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "FBX模型加载",
        "Draco压缩",
        "线框模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "audioDance",
      "category": "threeExamples/shader",
      "title": "音乐舞动",
      "titleEn": "Audio Dance",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GUI调试面板、空间音频(WebAudio) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/audioDance.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/audioDance.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GUI调试面板",
        "空间音频(WebAudio)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "shaderSky",
      "category": "threeExamples/shader",
      "title": "着色器天空",
      "titleEn": "Shader Sky",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、天空盒 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/shaderSky.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/shaderSky.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "天空盒"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelBlendShader",
      "category": "threeExamples/shader",
      "title": "模型混合着色器",
      "titleEn": "Model Blend",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、Draco压缩 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/modelBlendShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/modelBlendShader.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "Draco压缩"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "planeScan",
      "category": "threeExamples/shader",
      "title": "平面扫描",
      "titleEn": "Plane Scan",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/planeScan.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/planeScan.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cityLine",
      "category": "threeExamples/shader",
      "title": "城市线条",
      "titleEn": "City Line",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、FBX模型加载、线条/线框 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/cityLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/cityLine.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "FBX模型加载",
        "线条/线框"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "wallShader",
      "category": "threeExamples/shader",
      "title": "扩散圆墙",
      "titleEn": "Wall Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/wallShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/wallShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "radarShader",
      "category": "threeExamples/shader",
      "title": "雷达着色器",
      "titleEn": "Radar Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/radarShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/radarShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "candleShader",
      "category": "threeExamples/shader",
      "title": "蜡烛",
      "titleEn": "Candle Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、纹理加载、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/candleShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/candleShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "纹理加载",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "ringShader",
      "category": "threeExamples/shader",
      "title": "环形着色器",
      "titleEn": "Ring Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/ringShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/ringShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "smokeCircle",
      "category": "threeExamples/shader",
      "title": "圆泡吸附",
      "titleEn": "Smoke Circle",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 雾化、实时阴影、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/smokeCircle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/smokeCircle.js",
      "tags": [
        "Three.js+Cesium",
        "雾化",
        "实时阴影",
        "图元(Primitive)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "radarScanShader",
      "category": "threeExamples/shader",
      "title": "雷达扫描",
      "titleEn": "Radar Scan",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/radarScan.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/radarScanShader.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "imageParticle",
      "category": "threeExamples/shader",
      "title": "颗粒图像",
      "titleEn": "Image Part",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/imageParticle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/imageParticle.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gaussianBlur",
      "category": "threeExamples/shader",
      "title": "高斯模糊",
      "titleEn": "Gaussian Blur",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/gaussianBlur.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/gaussianBlur.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gridShader",
      "category": "threeExamples/shader",
      "title": "网格着色器",
      "titleEn": "Grid Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/gridShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/gridShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "compassShader",
      "category": "threeExamples/shader",
      "title": "罗盘",
      "titleEn": "Compass Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/compassShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/compassShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "halfCircle",
      "category": "threeExamples/shader",
      "title": "半圆",
      "titleEn": "Half Circle",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/halfCircle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/halfCircle.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "vortexShader",
      "category": "threeExamples/shader",
      "title": "扭曲",
      "titleEn": "Vortex Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/vortexShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/vortexShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "ringsShader",
      "category": "threeExamples/shader",
      "title": "环彩虹着色器",
      "titleEn": "Rings Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/ringsShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/ringsShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "videoShader",
      "category": "threeExamples/shader",
      "title": "视频着色器",
      "titleEn": "Video Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GUI调试面板、视频纹理 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/videoShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/videoShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GUI调试面板",
        "视频纹理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "steamWaveSun",
      "category": "threeExamples/shader",
      "title": "蒸汽波太阳",
      "titleEn": "Steam Sun",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/steamWaveSun.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/steamWaveSun.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "groundglass",
      "category": "threeExamples/shader",
      "title": "毛玻璃",
      "titleEn": "Groundglass",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/groundglass.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/groundglass.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "infiniteGrid",
      "category": "threeExamples/shader",
      "title": "无限网格",
      "titleEn": "Infinite Grid",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、天空盒 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/infiniteGrid.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/infiniteGrid.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "天空盒"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cobwebBox",
      "category": "threeExamples/shader",
      "title": "蛛网箱子",
      "titleEn": "Cobweb Box",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/cobwebBox.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/cobwebBox.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "jumpHeart",
      "category": "threeExamples/shader",
      "title": "跳动的心",
      "titleEn": "Jump Heart",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/jumpHeart.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/jumpHeart.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "rasterGrid",
      "category": "threeExamples/shader",
      "title": "栅格网格",
      "titleEn": "Raster Grid",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/rasterGrid.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/rasterGrid.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "flowLight",
      "category": "threeExamples/shader",
      "title": "流光",
      "titleEn": "Flow Light",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、辉光(Bloom)、输出合成、WebGPU后处理、纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/flowLight.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/flowLight.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "辉光(Bloom)",
        "输出合成",
        "WebGPU后处理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "grayShader",
      "category": "threeExamples/shader",
      "title": "灰度",
      "titleEn": "Gray Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/grayShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/grayShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "waveShader",
      "category": "threeExamples/shader",
      "title": "图像波动",
      "titleEn": "Wave Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/waveShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/waveShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "dissolve",
      "category": "threeExamples/shader",
      "title": "溶解",
      "titleEn": "Dissolve",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、GUI调试面板 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/shader/dissolve.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/dissolve.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "changeShaderToy",
      "category": "threeExamples/shader",
      "title": "切换ShaderToy",
      "titleEn": "shaderToy",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/changeShaderToy.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/changeShaderToy.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "waterA",
      "category": "threeExamples/shader",
      "title": "波浪效果",
      "titleEn": "Water Effect",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/waterA.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/waterA.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "reliefImage",
      "category": "threeExamples/shader",
      "title": "浮雕图像",
      "titleEn": "Relief Image",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/reliefImage.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/reliefImage.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "flowerShader",
      "category": "threeExamples/shader",
      "title": "花",
      "titleEn": "Flower Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GUI调试面板、线框模式、雾化 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/flowerShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/flowerShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GUI调试面板",
        "线框模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "dissolveAnimate",
      "category": "threeExamples/shader",
      "title": "溶解动画",
      "titleEn": "Dissolve",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/dissolveAnimate.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/dissolveAnimate.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "imageShake",
      "category": "threeExamples/shader",
      "title": "图片抖动",
      "titleEn": "Image Shake",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨迹球控制、自定义GLSL着色器、粒子/点云 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/imageShake.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/imageShake.js",
      "tags": [
        "Three.js+Cesium",
        "轨迹球控制",
        "自定义GLSL着色器",
        "粒子/点云"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "heartShader",
      "category": "threeExamples/shader",
      "title": "心",
      "titleEn": "Heart Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、辉光(Bloom)、自定义GLSL着色器、WebGPU后处理 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/heartShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/heartShader.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "辉光(Bloom)",
        "自定义GLSL着色器",
        "WebGPU后处理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "shaderBlock",
      "category": "threeExamples/shader",
      "title": "方块着色器",
      "titleEn": "Shader Block",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/shaderBlock.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/shaderBlock.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "blobShader",
      "category": "threeExamples/shader",
      "title": "一团揉动",
      "titleEn": "Blob Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GUI调试面板、实时阴影、图元(Primitive) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/blobShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/blobShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GUI调试面板",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "circleRotate",
      "category": "threeExamples/shader",
      "title": "旋转的圆",
      "titleEn": "Circle Rotate",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/circleRotate.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/circleRotate.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "shaderLight",
      "category": "threeExamples/shader",
      "title": "着色器光效",
      "titleEn": "Shader Light",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/shaderLight.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/shaderLight.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "whiteCloud",
      "category": "threeExamples/shader",
      "title": "白云",
      "titleEn": "White Cloud",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GLTF模型加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/whiteCloud.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/whiteCloud.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GLTF模型加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "waterSky",
      "category": "threeExamples/shader",
      "title": "水天一色",
      "titleEn": "Water Sky",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、水面模拟、天空盒 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/waterSky.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/waterSky.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "水面模拟",
        "天空盒"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cloudShader",
      "category": "threeExamples/shader",
      "title": "天空云",
      "titleEn": "Cloud Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、实例化(Instancing)、纹理加载、GUI调试面板、雾化 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/cloudShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/cloudShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "实例化(Instancing)",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "darkClouds",
      "category": "threeExamples/shader",
      "title": "乌云",
      "titleEn": "Dark Clouds",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/darkClouds.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/darkClouds.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cellShader",
      "category": "threeExamples/shader",
      "title": "细胞",
      "titleEn": "Cell Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/cellShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/cellShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "mushroom",
      "category": "threeExamples/shader",
      "title": "蘑菇",
      "titleEn": "Mushroom",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/mushroom.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/mushroom.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "mosaicShader",
      "category": "threeExamples/shader",
      "title": "马赛克",
      "titleEn": "Mosaic Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/mosaicShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/mosaicShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "shader_planet",
      "category": "threeExamples/shader",
      "title": "着色器行星",
      "titleEn": "Shader Planet",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、GUI调试面板、线框模式、地形(Terrain) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/shader_planet.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/shader_planet.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "GUI调试面板",
        "线框模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "contour",
      "category": "threeExamples/shader",
      "title": "魔幻山体",
      "titleEn": "Contour",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、雾化 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/contour.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/contour.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "雾化"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "softLight",
      "category": "threeExamples/shader",
      "title": "柔光",
      "titleEn": "Soft Light",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/softLight.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/softLight.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "earthScan",
      "category": "threeExamples/shader",
      "title": "地球扫描",
      "titleEn": "Earth Scan",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/earthScan.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/earthScan.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "waveScan",
      "category": "threeExamples/shader",
      "title": "波扫描",
      "titleEn": "Wave Scan",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/waveScan.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/waveScan.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "innerGlow",
      "category": "threeExamples/shader",
      "title": "内发光",
      "titleEn": "Inner Glow",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/innerGlow.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/innerGlow.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "fireShader",
      "category": "threeExamples/shader",
      "title": "火焰",
      "titleEn": "Fire Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/fireShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/fireShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "emitShader",
      "category": "threeExamples/shader",
      "title": "发散着色器",
      "titleEn": "Emit Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/emitShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/emitShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "ephemeralFlower",
      "category": "threeExamples/shader",
      "title": "幻影花烟",
      "titleEn": "Flower Smoke",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/ephemeralFlower.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/ephemeralFlower.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "fishShader",
      "category": "threeExamples/shader",
      "title": "鱼",
      "titleEn": "Fish",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、线框模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/fishShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/fishShader.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "线框模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "energyBallShader",
      "category": "threeExamples/shader",
      "title": "能量球",
      "titleEn": "Energy Ball",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/energyBallShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/energyBallShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "girdFloor",
      "category": "threeExamples/shader",
      "title": "网格地板",
      "titleEn": "Gird Floor",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、天空盒、GUI调试面板、雾化 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/girdFloor.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/girdFloor.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "天空盒",
        "GUI调试面板",
        "雾化"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "hologram",
      "category": "threeExamples/shader",
      "title": "全息投影",
      "titleEn": "Hologram",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GLTF模型加载、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/hologram.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/hologram.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GLTF模型加载",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "smoke",
      "category": "threeExamples/shader",
      "title": "燃烧烟雾",
      "titleEn": "Smoke",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载、WebXR沉浸 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/smoke.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/smoke.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载",
        "WebXR沉浸"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "fireMaterial",
      "category": "threeExamples/shader",
      "title": "火焰材质",
      "titleEn": "Fire Material",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/fireMaterial.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/fireMaterial.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "wifiShader",
      "category": "threeExamples/shader",
      "title": "着色器",
      "titleEn": "WiFi Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例，演示着色器。运用了 实例化(Instancing) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/wifiShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/wifiShader.js",
      "tags": [
        "Three.js+Cesium",
        "实例化(Instancing)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "buildGradient",
      "category": "threeExamples/shader",
      "title": "建筑渐变",
      "titleEn": "Building Gradient",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GLTF模型加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/buildGradient.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/buildGradient.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GLTF模型加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "iceFloor",
      "category": "threeExamples/shader",
      "title": "冰面",
      "titleEn": "Ice Floor",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/iceFloor.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/iceFloor.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "blackhole",
      "category": "threeExamples/shader",
      "title": "黑洞",
      "titleEn": "Black Hole",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、WebGPU后处理、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/blackhole.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/blackhole.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "WebGPU后处理",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "contourLine",
      "category": "threeExamples/shader",
      "title": "等高线",
      "titleEn": "Contour Line",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/contourLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/contourLine.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "redRose",
      "category": "threeExamples/shader",
      "title": "红玫瑰",
      "titleEn": "Red Rose",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/shader/redRose.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/redRose.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "heatmapShader",
      "category": "threeExamples/shader",
      "title": "热力图",
      "titleEn": "Heatmap Shader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/shader/heatmapShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/shader/heatmapShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "z2586300277Particle",
      "category": "threeExamples/particle",
      "title": "优雅永不过时",
      "titleEn": "Elegant Always",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、OBJ模型加载、纹理加载、线框模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/z2586300277.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/z2586300277Particle.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "OBJ模型加载",
        "纹理加载",
        "线框模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "bubble",
      "category": "threeExamples/particle",
      "title": "粒子泡泡",
      "titleEn": "Bubble",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、自定义GLSL着色器、粒子/点云、GUI调试面板 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/particle/bubble.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/bubble.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "自定义GLSL着色器",
        "粒子/点云",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "particleBlendShader",
      "category": "threeExamples/particle",
      "title": "粒子混合着色器",
      "titleEn": "BlendShader",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、纹理加载、GUI调试面板、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/particleBlendShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/particleBlendShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "particleScattered",
      "category": "threeExamples/particle",
      "title": "粒子聚散",
      "titleEn": "Scattered",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、纹理加载、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/particleScattered.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/particleScattered.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "纹理加载",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "downSnow",
      "category": "threeExamples/particle",
      "title": "下雪",
      "titleEn": "Snow",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/downSnow.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/downSnow.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "galaxyStar",
      "category": "threeExamples/particle",
      "title": "星系",
      "titleEn": "Galaxy Star",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、纹理加载、GUI调试面板、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/galaxyStar.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/galaxyStar.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "纹理加载",
        "GUI调试面板",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "pointsEarth",
      "category": "threeExamples/particle",
      "title": "粒子地球",
      "titleEn": "Points Earth",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、纹理加载、GUI调试面板、线框模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/pointsEarth.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/pointsEarth.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "waveParticleShader",
      "category": "threeExamples/particle",
      "title": "波浪粒子",
      "titleEn": "Wave",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/waveParticleShader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/waveParticleShader.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "particleLine",
      "category": "threeExamples/particle",
      "title": "粒子线条",
      "titleEn": "Line",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、辉光(Bloom)、着色器后处理、WebGPU后处理、粒子/点云 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/particleLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/particleLine.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "辉光(Bloom)",
        "着色器后处理",
        "WebGPU后处理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "sphereLine",
      "category": "threeExamples/particle",
      "title": "球体线条",
      "titleEn": "Sphere Line",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、线条/线框、GUI调试面板、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/sphereLine.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/sphereLine.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "线条/线框",
        "GUI调试面板",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "particleWire",
      "category": "threeExamples/particle",
      "title": "粒子线",
      "titleEn": "Wire",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、线条/线框、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/particleWire.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/particleWire.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "线条/线框",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "particleFire",
      "category": "threeExamples/particle",
      "title": "粒子烟花",
      "titleEn": "Fire",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、纹理加载、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/particleFire.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/particleFire.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "纹理加载",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "starrySky",
      "category": "threeExamples/particle",
      "title": "粒子星空",
      "titleEn": "Starry Sky",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、WebXR沉浸、雾化 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/starrySky.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/starrySky.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "WebXR沉浸",
        "雾化"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "technologyParticle",
      "category": "threeExamples/particle",
      "title": "科技粒子",
      "titleEn": "Technology",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、纹理加载、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/technologyParticle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/technologyParticle.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "纹理加载",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "particlesCursorAnimation",
      "category": "threeExamples/particle",
      "title": "鼠标轨迹粒子",
      "titleEn": "ParticlesCursorAnimation",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GLTF模型加载、纹理加载、射线拾取交互 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/particlesCursorAnimation.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/particlesCursorAnimation.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GLTF模型加载",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "textParticle",
      "category": "threeExamples/particle",
      "title": "文字采集成粒子",
      "titleEn": "Text Particle",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、3D文字 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/textParticle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/textParticle.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "3D文字"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "snowParticle",
      "category": "threeExamples/particle",
      "title": "雪花",
      "titleEn": "Snow",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/snowParticle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/snowParticle.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "imgParticle",
      "category": "threeExamples/particle",
      "title": "图片粒子",
      "titleEn": "Image Particle",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/imgParticle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/imgParticle.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "fireParticles",
      "category": "threeExamples/particle",
      "title": "粒子火焰",
      "titleEn": "Fire Particles",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/fireParticles.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/fireParticles.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "realFire",
      "category": "threeExamples/particle",
      "title": "真实火焰",
      "titleEn": "Real Fire",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/realFire.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/realFire.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "globeParticle",
      "category": "threeExamples/particle",
      "title": "地球粒子",
      "titleEn": "Globe Particle",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、辉光(Bloom)、着色器后处理、自定义GLSL着色器、WebGPU后处理 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/globeParticle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/globeParticle.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "辉光(Bloom)",
        "着色器后处理",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "spreadPartile",
      "category": "threeExamples/particle",
      "title": "发散粒子",
      "titleEn": "Spread Partile",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、纹理加载、物理引擎模拟、GUI调试面板 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/spreadPartile.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/spreadPartile.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "纹理加载",
        "物理引擎模拟"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "waterLeakage",
      "category": "threeExamples/particle",
      "title": "水流粒子",
      "titleEn": "Water Leakage",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、物理引擎模拟、GUI调试面板、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/waterLeakage.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/waterLeakage.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "物理引擎模拟",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "waterFlowParticle",
      "category": "threeExamples/particle",
      "title": "喷泉水流",
      "titleEn": "Water Flow",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GUI调试面板、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/waterFlowParticle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/waterFlowParticle.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GUI调试面板",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "steamParticle",
      "category": "threeExamples/particle",
      "title": "蒸汽粒子",
      "titleEn": "Steam Particle",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GUI调试面板、混合模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/particle/steamParticle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/particle/steamParticle.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GUI调试面板",
        "混合模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "zmdIndex",
      "category": "threeExamples/game",
      "title": "终末地-登录入口",
      "titleEn": "EndField Index",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、WebGPU后处理、粒子/点云、骨骼蒙皮动画、FBX模型加载 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/game/zmdIndex.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/game/zmdIndex.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "WebGPU后处理",
        "粒子/点云",
        "骨骼蒙皮动画"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "characterBlur",
      "category": "threeExamples/game",
      "title": "人物虚化",
      "titleEn": "Character Blur",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 FBX模型加载、GUI调试面板、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/game/characterBlur.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/game/characterBlur.js",
      "tags": [
        "Three.js+Cesium",
        "FBX模型加载",
        "GUI调试面板",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "zmdFence",
      "category": "threeExamples/game",
      "title": "终末地-据点围栏",
      "titleEn": "EndField Fence",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/game/zmdFence.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/game/zmdFence.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "animejsBasic",
      "category": "threeExamples/animation",
      "title": "animejs使用",
      "titleEn": "Animejs Basic",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、线框模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/animation/animejsBasic.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/animation/animejsBasic.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "线框模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gsapBasic",
      "category": "threeExamples/animation",
      "title": "gsap使用",
      "titleEn": "GSAP Basic",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GUI调试面板 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/animation/gsapBasic.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/animation/gsapBasic.js",
      "tags": [
        "Three.js+Cesium",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "Theatrejs",
      "category": "threeExamples/animation",
      "title": "Theatrejs",
      "titleEn": "Theatre.js",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/animation/Theatrejs.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/animation/Theatrejs.js",
      "tags": [
        "Three.js+Cesium",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "clipAnimation",
      "category": "threeExamples/animation",
      "title": "裁剪动画",
      "titleEn": "Clip Animation",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、Draco压缩、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/animation/clipAnimation.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/animation/clipAnimation.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "Draco压缩",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "personAnimation",
      "category": "threeExamples/animation",
      "title": "点击第三人称移动",
      "titleEn": "Person Move",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、射线拾取交互 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/animation/personAnimation.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/animation/personAnimation.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "射线拾取交互"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "personThirdMove",
      "category": "threeExamples/animation",
      "title": "第三人称移动",
      "titleEn": "Third Move",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、纹理加载、天空盒、立方体/全景环境、环境反射(PBR) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/animation/personThirdMove.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/animation/personThirdMove.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "纹理加载",
        "天空盒",
        "立方体/全景环境"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "personFirstMove",
      "category": "threeExamples/animation",
      "title": "第一人称移动",
      "titleEn": "First Move",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、GLTF模型加载、FBX模型加载、物理引擎模拟 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/animation/personFirstMove.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/animation/personFirstMove.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "GLTF模型加载",
        "FBX模型加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "downRotate",
      "category": "threeExamples/animation",
      "title": "下钻动画",
      "titleEn": "Down Rotate",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、粒子/点云、GLTF模型加载、线条/线框 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/animation/downRotate.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/animation/downRotate.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "粒子/点云",
        "GLTF模型加载",
        "线条/线框"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "curlAnimate",
      "category": "threeExamples/animation",
      "title": "卷曲动画",
      "titleEn": "Curl Animate",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、GUI调试面板、实时阴影、环境反射(PBR) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/animation/curlAnimate.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/animation/curlAnimate.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "GUI调试面板",
        "实时阴影",
        "环境反射(PBR)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "inspectionView",
      "category": "threeExamples/animation",
      "title": "巡检",
      "titleEn": "Inspection View",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 指针锁定(FPS)控制、GLTF模型加载、Draco压缩、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/animation/inspectionView.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/animation/inspectionView.js",
      "tags": [
        "Three.js+Cesium",
        "指针锁定(FPS)控制",
        "GLTF模型加载",
        "Draco压缩",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelUnpack",
      "category": "threeExamples/basic",
      "title": "模型拆解动画",
      "titleEn": "Model Unpack",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、GLTF模型加载、Draco压缩、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/modelUnpack.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/modelUnpack.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "GLTF模型加载",
        "Draco压缩",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "transformAnimate",
      "category": "threeExamples/basic",
      "title": "Mesh变换动画",
      "titleEn": "Transform Gsap",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、FBX模型加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/transformAnimate.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/transformAnimate.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "FBX模型加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "curveAnimate",
      "category": "threeExamples/basic",
      "title": "曲线动画",
      "titleEn": "Curve Animate",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、粒子/点云、GLTF模型加载、线条/线框、Draco压缩 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/curveAnimate.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/curveAnimate.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "粒子/点云",
        "GLTF模型加载",
        "线条/线框"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "localModel",
      "category": "threeExamples/basic",
      "title": "本地模型加载",
      "titleEn": "Local Model",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、纹理加载、天空盒、Draco压缩、立方体/全景环境 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/localModel.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/localModel.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "纹理加载",
        "天空盒",
        "Draco压缩"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelAnimation",
      "category": "threeExamples/basic",
      "title": "人物模型动画案例",
      "titleEn": "Model Animate",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 骨骼蒙皮动画、GLTF模型加载、GUI调试面板、雾化、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/modelAnimation.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/modelAnimation.js",
      "tags": [
        "Three.js+Cesium",
        "骨骼蒙皮动画",
        "GLTF模型加载",
        "GUI调试面板",
        "雾化"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelLoad",
      "category": "threeExamples/basic",
      "title": "gltf/fbx/obj模型加载",
      "titleEn": "Model Load",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、GLTF模型加载、FBX模型加载、OBJ模型加载、Draco压缩 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/modelLoad.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/modelLoad.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "GLTF模型加载",
        "FBX模型加载",
        "OBJ模型加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelShadow",
      "category": "threeExamples/basic",
      "title": "模型阴影",
      "titleEn": "Model Shadow",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、GUI调试面板、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/modelShadow.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/modelShadow.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "GUI调试面板",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "skyAndEnv",
      "category": "threeExamples/basic",
      "title": "天空盒",
      "titleEn": "Sky And Env",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载、天空盒、立方体/全景环境、环境反射(PBR) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/skyAndEnv.jpg",
      "tag": "tag: TEXTS['skybox'] + '-#d265bb'",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/skyAndEnv.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载",
        "天空盒",
        "立方体/全景环境",
        "环境反射(PBR)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cameraAttribute",
      "category": "threeExamples/basic",
      "title": "相机属性",
      "titleEn": "Camera",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/cameraAttribute.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/cameraAttribute.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "orbControls",
      "category": "threeExamples/basic",
      "title": "轨道控制器",
      "titleEn": "Orbit Controls",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载、GUI调试面板、相机飞行 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/orbControls.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/orbControls.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载",
        "GUI调试面板",
        "相机飞行"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelSky",
      "category": "threeExamples/basic",
      "title": "模型天空",
      "titleEn": "Model Sky",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、天空盒 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/modelSky.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/modelSky.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "天空盒"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "sceneFog",
      "category": "threeExamples/basic",
      "title": "场景雾化",
      "titleEn": "Scene Fog",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、GUI调试面板、雾化 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/sceneFog.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/sceneFog.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "GUI调试面板",
        "雾化"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gltfOptLoader",
      "category": "threeExamples/basic",
      "title": "Opt解压(su7 模型)",
      "titleEn": "GLTF Opt",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、Meshopt优化、立方体/全景环境、环境反射(PBR) 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/gltfOptLoader.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/gltfOptLoader.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "Meshopt优化",
        "立方体/全景环境",
        "环境反射(PBR)"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "loadingAnimate",
      "category": "threeExamples/basic",
      "title": "加载动画",
      "titleEn": "Load Animate",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、Draco压缩 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/loadingAnimate.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/loadingAnimate.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "Draco压缩"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "outlinePass",
      "category": "threeExamples/basic",
      "title": "轮廓光",
      "titleEn": "Outline Pass",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、描边高亮、输出合成、WebGPU后处理、射线拾取交互 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/outlinePass.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/outlinePass.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "描边高亮",
        "输出合成",
        "WebGPU后处理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "screenCoord",
      "category": "threeExamples/basic",
      "title": "三维转屏幕坐标",
      "titleEn": "Screen Coord",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/screenCoord.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/screenCoord.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gradientTriangle",
      "category": "threeExamples/basic",
      "title": "渐变三角形",
      "titleEn": "Triangle",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、线框模式 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/gradientTriangle.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/gradientTriangle.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "线框模式"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "扩散圈",
      "category": "threeExamples/basic",
      "title": "扩散圈",
      "titleEn": "Diffusion circle",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 纹理加载 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/扩散圈.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/扩散圈.js",
      "tags": [
        "Three.js+Cesium",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "changeMaterial",
      "category": "threeExamples/basic",
      "title": "材质修改动画",
      "titleEn": "ChangeMaterial",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、纹理加载、天空盒、Draco压缩、GUI调试面板 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/changeMaterial.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/changeMaterial.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "纹理加载",
        "天空盒",
        "Draco压缩"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "transformObject",
      "category": "threeExamples/basic",
      "title": "拖拽控制",
      "titleEn": "Transform Obj",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 变换控制(Gizmo)、GLTF模型加载、GUI调试面板、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/transformObject.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/transformObject.js",
      "tags": [
        "Three.js+Cesium",
        "变换控制(Gizmo)",
        "GLTF模型加载",
        "GUI调试面板",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "transformBox3",
      "category": "threeExamples/basic",
      "title": "变换Box3",
      "titleEn": "Transform Box3",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 变换控制(Gizmo)、GLTF模型加载、GUI调试面板、立方体/全景环境、实时阴影 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/transformBox3.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/transformBox3.js",
      "tags": [
        "Three.js+Cesium",
        "变换控制(Gizmo)",
        "GLTF模型加载",
        "GUI调试面板",
        "立方体/全景环境"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelAnimates",
      "category": "threeExamples/basic",
      "title": "单/多模型动画",
      "titleEn": "Model Animates",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、GLTF模型加载、Draco压缩、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/modelAnimates.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/modelAnimates.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "GLTF模型加载",
        "Draco压缩",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gsapAnimate",
      "category": "threeExamples/basic",
      "title": "GSAP动画",
      "titleEn": "GSAP Animate",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/gsapAnimate.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/gsapAnimate.js",
      "tags": [
        "Three.js+Cesium",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "spriteTexture",
      "category": "threeExamples/basic",
      "title": "精灵标签",
      "titleEn": "Sprite Text",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/spriteTexture.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/spriteTexture.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelView",
      "category": "threeExamples/basic",
      "title": "模型视图",
      "titleEn": "Model View",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/modelView.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/modelView.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cssElement",
      "category": "threeExamples/basic",
      "title": "CSS元素",
      "titleEn": "CSS Element",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 CSS3D渲染、CSS2D渲染 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/cssElement.jpg",
      "tag": "DOM",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/cssElement.js",
      "tags": [
        "Three.js+Cesium",
        "CSS3D渲染",
        "CSS2D渲染"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "domDisplay",
      "category": "threeExamples/basic",
      "title": "DOM遮挡",
      "titleEn": "DOM Display",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 射线拾取交互、CSS3D渲染 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/domDisplay.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/domDisplay.js",
      "tags": [
        "Three.js+Cesium",
        "射线拾取交互",
        "CSS3D渲染"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "cameraAnimate",
      "category": "threeExamples/basic",
      "title": "相机动画",
      "titleEn": "Camera Animate",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、纹理加载、天空盒、GUI调试面板、立方体/全景环境 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/cameraAnimate.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/cameraAnimate.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "纹理加载",
        "天空盒",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "screenShot",
      "category": "threeExamples/basic",
      "title": "截图",
      "titleEn": "Screen Shot",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、辉光(Bloom)、WebGPU后处理、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/screenShot.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/screenShot.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "辉光(Bloom)",
        "WebGPU后处理",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "skeletonBone",
      "category": "threeExamples/basic",
      "title": "骨骼动画",
      "titleEn": "Skeleton Bone",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 骨骼蒙皮动画、GUI调试面板 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/basic/skeletonBone.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/skeletonBone.js",
      "tags": [
        "Three.js+Cesium",
        "骨骼蒙皮动画",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "viewHelper",
      "category": "threeExamples/basic",
      "title": "视图辅助",
      "titleEn": "View Helper",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/viewHelper.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/viewHelper.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "renderFrame",
      "category": "threeExamples/basic",
      "title": "帧率控制",
      "titleEn": "Render Frame",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、纹理加载、天空盒、Draco压缩、GUI调试面板 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/renderFrame.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/renderFrame.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "纹理加载",
        "天空盒",
        "Draco压缩"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "renderTarget",
      "category": "threeExamples/basic",
      "title": "渲染贴图物体",
      "titleEn": "Render Target",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、GLTF模型加载、纹理加载、天空盒、立方体/全景环境 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/renderTarget.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/renderTarget.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "GLTF模型加载",
        "纹理加载",
        "天空盒"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "sceneScissor",
      "category": "threeExamples/basic",
      "title": "场景剪切-后处理",
      "titleEn": "Scene Scissor",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、辉光(Bloom)、WebGPU后处理 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/sceneScissor.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/sceneScissor.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "辉光(Bloom)",
        "WebGPU后处理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "multOutlinePass",
      "category": "threeExamples/basic",
      "title": "多轮廓光",
      "titleEn": "Mult Outline Pass",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、描边高亮、输出合成、WebGPU后处理 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/multOutlinePass.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/multOutlinePass.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "描边高亮",
        "输出合成",
        "WebGPU后处理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "effectComposer",
      "category": "threeExamples/basic",
      "title": "渲染器配置",
      "titleEn": "Effect Composer",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、输出合成、WebGPU后处理、GLTF模型加载、Draco压缩 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/effectComposer.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/effectComposer.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "输出合成",
        "WebGPU后处理",
        "GLTF模型加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelExport",
      "category": "threeExamples/basic",
      "title": "模型导出",
      "titleEn": "Model Export",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 OBJ模型加载、纹理加载、天空盒、立方体/全景环境 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/modelExport.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/modelExport.js",
      "tags": [
        "Three.js+Cesium",
        "OBJ模型加载",
        "纹理加载",
        "天空盒",
        "立方体/全景环境"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "fileChunks",
      "category": "threeExamples/basic",
      "title": "文件分片(打包zip)",
      "titleEn": "File Chunks",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、纹理加载、天空盒、Draco压缩、立方体/全景环境 等 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/basic/fileChunks.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/fileChunks.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "纹理加载",
        "天空盒",
        "Draco压缩"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "入门",
      "category": "threeExamples/basic",
      "title": "入门",
      "titleEn": "Introduction",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/入门.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/入门.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "辅助线",
      "category": "threeExamples/basic",
      "title": "辅助线",
      "titleEn": "Helper Line",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/辅助线.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/辅助线.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "光线",
      "category": "threeExamples/basic",
      "title": "光线",
      "titleEn": "Light",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/光线.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/光线.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "相机控件",
      "category": "threeExamples/basic",
      "title": "相机控件",
      "titleEn": "Camera",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/相机控件.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/相机控件.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "动画",
      "category": "threeExamples/basic",
      "title": "动画",
      "titleEn": "Animation",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/动画.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/动画.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "全屏",
      "category": "threeExamples/basic",
      "title": "全屏",
      "titleEn": "Fullscreen",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/全屏.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/全屏.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "帧率",
      "category": "threeExamples/basic",
      "title": "帧率",
      "titleEn": "Frame Rate",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/帧率.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/帧率.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "阵列模型",
      "category": "threeExamples/basic",
      "title": "阵列模型",
      "titleEn": "Array Model",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/阵列模型.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/阵列模型.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "几何体",
      "category": "threeExamples/basic",
      "title": "几何体",
      "titleEn": "Geometry",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/几何体.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/几何体.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "点线",
      "category": "threeExamples/basic",
      "title": "点、线",
      "titleEn": "Points Lines",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、线条/线框 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/basic/%E7%82%B9%E7%BA%BF.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/点线.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "线条/线框"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "网格",
      "category": "threeExamples/basic",
      "title": "网格",
      "titleEn": "Grid",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/网格.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/网格.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "索引",
      "category": "threeExamples/basic",
      "title": "索引",
      "titleEn": "Index",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、线条/线框 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/索引.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/索引.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "线条/线框"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "自带几何体顶点",
      "category": "threeExamples/basic",
      "title": "自带几何体顶点",
      "titleEn": "Vertices",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/自带几何体顶点.png",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/自带几何体顶点.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "顶点颜色",
      "category": "threeExamples/basic",
      "title": "顶点颜色",
      "titleEn": "Vertex Color",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/basic/顶点颜色.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/basic/顶点颜色.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "physicsMesh",
      "category": "threeExamples/physics",
      "title": "物理cannon使用",
      "titleEn": "Physics Mesh",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 物理引擎模拟 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/physics/physicsMesh.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/physics/physicsMesh.js",
      "tags": [
        "Three.js+Cesium",
        "物理引擎模拟"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "ammoPhysics",
      "category": "threeExamples/physics",
      "title": "物理ammo使用",
      "titleEn": "Ammo Physics",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 物理引擎模拟 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/physics/ammoPhysics.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/physics/ammoPhysics.js",
      "tags": [
        "Three.js+Cesium",
        "物理引擎模拟"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "rapierPhysics",
      "category": "threeExamples/physics",
      "title": "物理rapier使用",
      "titleEn": "Rapier Physics",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 物理引擎模拟、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/physics/rapierPhysics.webp",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/physics/rapierPhysics.js",
      "tags": [
        "Three.js+Cesium",
        "物理引擎模拟",
        "实时阴影"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "loadTiles",
      "category": "threeExamples/expand",
      "title": "加载3dtiles",
      "titleEn": "Load Tiles",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、纹理加载、Draco压缩、3D Tiles 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/loadTiles.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/loadTiles.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "纹理加载",
        "Draco压缩",
        "3D Tiles"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "geoBorder",
      "category": "threeExamples/expand",
      "title": "地理边界",
      "titleEn": "Geo Border",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 粒子/点云、纹理加载、矢量几何 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/geoBorder.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/geoBorder.js",
      "tags": [
        "Three.js+Cesium",
        "粒子/点云",
        "纹理加载",
        "矢量几何"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "heatmap3D",
      "category": "threeExamples/expand",
      "title": "3D热力图",
      "titleEn": "Heatmap 3D",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/heatmap3D.jpg",
      "tag": "tag: TEXTS['normal'] + '-#e1d100'",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/heatmap3D.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "heatmapModel",
      "category": "threeExamples/expand",
      "title": "模型热力图",
      "titleEn": "Heatmap Model",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器、粒子/点云、OBJ模型加载、GUI调试面板 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/heatmapModel.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/heatmapModel.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器",
        "粒子/点云",
        "OBJ模型加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "modelBlendReflector",
      "category": "threeExamples/expand",
      "title": "模型反射效果",
      "titleEn": "Model Blend",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、自定义GLSL着色器、GLTF模型加载、Draco压缩、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/modelBlendReflector.jpg",
      "tag": "tag: TEXTS['模型反射'] + '--14'",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/modelBlendReflector.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "自定义GLSL着色器",
        "GLTF模型加载",
        "Draco压缩"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "multWindowScene",
      "category": "threeExamples/expand",
      "title": "多浏览器窗口连接",
      "titleEn": "Mult Window",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/multWindowScene.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/multWindowScene.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "combineEcharts",
      "category": "threeExamples/expand",
      "title": "Echarts结合",
      "titleEn": "Combine Echarts",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 GLTF模型加载、CSS3D渲染 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/combineEcharts.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/combineEcharts.js",
      "tags": [
        "Three.js+Cesium",
        "GLTF模型加载",
        "CSS3D渲染"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "gaussianSplats3D",
      "category": "threeExamples/expand",
      "title": "高斯溅射",
      "titleEn": "gaussianSplats3D",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/gaussianSplats3D.webp",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/gaussianSplats3D.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "sparkjs",
      "category": "threeExamples/expand",
      "title": "高斯sparkjs",
      "titleEn": "sparkjs",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/sparkjs.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/sparkjs.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "tilesMap",
      "category": "threeExamples/expand",
      "title": "瓦片地图",
      "titleEn": "Tiles Map",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/tilesMap.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/tilesMap.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "d3Svg",
      "category": "threeExamples/expand",
      "title": "D3 svg与Three",
      "titleEn": "D3 SVG Three",
      "description": "这是一个基于 Three.js / Cesium 的示例。通过标准渲染流程呈现。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/d3Svg.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/d3Svg.js",
      "tags": [
        "Three.js+Cesium"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "multViews",
      "category": "threeExamples/expand",
      "title": "多视图",
      "titleEn": "Mult Views",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、后处理管线、辉光(Bloom)、WebGPU后处理、GLTF模型加载 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/multViews.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/multViews.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "后处理管线",
        "辉光(Bloom)",
        "WebGPU后处理"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "blurReflect",
      "category": "threeExamples/expand",
      "title": "模糊反射(drei转原生)",
      "titleEn": "Blur Reflect",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 WebGPU后处理、GLTF模型加载、纹理加载、GUI调试面板、实时阴影 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/expand/blurReflect.jpg",
      "tag": "tag: TEXTS['磨砂反射'] + '-#d265bb'",
      "entry": "/external-examples/three-cesium-examples/threeExamples/expand/blurReflect.js",
      "tags": [
        "Three.js+Cesium",
        "WebGPU后处理",
        "GLTF模型加载",
        "纹理加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "selectBloomPass",
      "category": "threeExamples/effectComposer",
      "title": "辉光-postprocessing",
      "titleEn": "Select Bloom",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、WebGPU后处理、射线拾取交互 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/effectComposer/selectBloomPass.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/effectComposer/selectBloomPass.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "WebGPU后处理",
        "射线拾取交互"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "customMaskPass",
      "category": "threeExamples/effectComposer",
      "title": "自定义遮罩通道",
      "titleEn": "Custom Mask",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、着色器后处理、WebGPU后处理、纹理加载、天空盒 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/effectComposer/customMaskPass.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/effectComposer/customMaskPass.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "着色器后处理",
        "WebGPU后处理",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "uvTransformation",
      "category": "threeExamples/effectComposer",
      "title": "UV图像变换",
      "titleEn": "UV Transform",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、WebGPU后处理、纹理加载 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/effectComposer/uvTransformation.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/effectComposer/uvTransformation.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "WebGPU后处理",
        "纹理加载"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "afterimagePass",
      "category": "threeExamples/effectComposer",
      "title": "残影效果",
      "titleEn": "Afterimage",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、WebGPU后处理、GLTF模型加载、GUI调试面板、雾化 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/effectComposer/afterimagePass.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/effectComposer/afterimagePass.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "WebGPU后处理",
        "GLTF模型加载",
        "GUI调试面板"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "saturationPass",
      "category": "threeExamples/effectComposer",
      "title": "饱和度(自定义Pass)",
      "titleEn": "Saturation",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、输出合成、着色器后处理、自定义GLSL着色器、WebGPU后处理 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/effectComposer/saturationPass.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/effectComposer/saturationPass.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "输出合成",
        "着色器后处理",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "EdgeBlurringEffect",
      "category": "threeExamples/effectComposer",
      "title": "边缘模糊效果",
      "titleEn": "Edge Blur",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 自定义GLSL着色器 技术。",
      "thumbnail": "/example-thumbs/three-cesium-examples/threeExamples/effectComposer/EdgeBlurringEffect.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/effectComposer/EdgeBlurringEffect.js",
      "tags": [
        "Three.js+Cesium",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "threeSelectBloom",
      "category": "threeExamples/effectComposer",
      "title": "官方选择辉光简化版",
      "titleEn": "Three Bloom",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 后处理管线、辉光(Bloom)、着色器后处理、自定义GLSL着色器、WebGPU后处理 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/effectComposer/threeSelectBloom.jpg",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/effectComposer/threeSelectBloom.js",
      "tags": [
        "Three.js+Cesium",
        "后处理管线",
        "辉光(Bloom)",
        "着色器后处理",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "deferredLighting",
      "category": "threeExamples/effectComposer",
      "title": "延迟光照",
      "titleEn": "Deferred Lighting",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、后处理管线、辉光(Bloom)、自定义GLSL着色器、WebGPU后处理 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/effectComposer/deferredLighting.webp",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/effectComposer/deferredLighting.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "后处理管线",
        "辉光(Bloom)",
        "自定义GLSL着色器"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    },
    {
      "id": "sceneSnowEffect",
      "category": "threeExamples/effectComposer",
      "title": "场景雪",
      "titleEn": "sceneSnowEffect",
      "description": "这是一个基于 Three.js / Cesium 的示例。运用了 轨道控制、自定义GLSL着色器、WebGPU后处理、粒子/点云、GLTF模型加载 等 技术。",
      "thumbnail": "/external-examples/three-cesium-examples/threeExamples/effectComposer/sceneSnowEffect.webp",
      "tag": "",
      "entry": "/external-examples/three-cesium-examples/threeExamples/effectComposer/sceneSnowEffect.js",
      "tags": [
        "Three.js+Cesium",
        "轨道控制",
        "自定义GLSL着色器",
        "WebGPU后处理",
        "粒子/点云"
      ],
      "runner": "vue",
      "globals": {
        "HOST": "/external-examples/three-cesium-examples/",
        "FILE_HOST": "/external-examples/3d-file-server/"
      }
    }
  ]
}
