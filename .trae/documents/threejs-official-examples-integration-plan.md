# Three.js 官方示例整合计划

## 1. 概要

将 `/Users/zhangzhengyang/Downloads/three.js-dev`（Three.js 0.185.0，与项目一致）中的全部 HTML 示例批量迁移到当前 earth-app 项目，统一转换为基于 `ExampleScene.vue` 的 Vue 组件，并作为独立的 **Three.js 官方示例** 来源接入现有示例中心。

## 2. 当前状态分析

### 2.1 官方示例仓库

- **路径**：`/Users/zhangzhengyang/Downloads/three.js-dev`
- **版本**：0.185.0（与 `earth-app/package.json` 中 `three` 版本一致）
- **示例位置**：`examples/*.html`
- **示例类别前缀**：`webgl_*`、`webgpu_*`、`misc_*`、`physics_*`、`webaudio_*`、`webxr_*`、`css2d_*`、`css3d_*`、`svg_*`、`games_*`
- **资源位置**：`examples/models/`、`examples/textures/`、`examples/sounds/`、`examples/fonts/`、`examples/luts/` 等
- **导入方式**：HTML 内嵌 `importmap`，映射 `three` → `../build/three.module.js`、`three/addons/` → `./jsm/`

### 2.2 项目现有架构

- **示例注册表**：`src/examples/registry/index.js` 汇总 `threeCesiumExamples.js`、`cesiumExamples.js`、`threejsLesson.js`、`earthLessons.js`
- **示例视图**：
  - `src/examples/views/ExampleGallery.vue`：示例列表
  - `src/examples/views/ExampleDemo.vue`：根据 `runner` 字段渲染 Vue 组件或 iframe
- **组件加载器**：`src/examples/components/index.js` 使用 `import.meta.glob('./**/*.vue')` 按约定路径动态加载组件
  - 约定路径：`./{source}/{category}/{PascalCaseId}Example.vue`
- **场景基座**：
  - `src/examples/components/ExampleScene.vue`：提供 canvas、overlay、slot、props（camera、clearColor、cssRenderer、customRender 等）
  - `src/composables/useExampleStage.js`：管理场景、相机、渲染器、轨道控制器、渲染循环、CSS2D/CSS3D 渲染器、资源释放
- **转换脚本**：
  - `scripts/convert-three-cesium-examples-to-vue.js`：将 JS 示例转换为 Vue 组件
  - `scripts/fix-conversion-artifacts.js`：修复转换产物语法问题
  - `scripts/sync-vue-runners.js`：根据组件是否存在自动切换 registry 中的 runner
- **Vite 配置**：`vite.config.js` 已配置 `@` → `src` 别名

### 2.3 关键约束

- 所有修改必须保持 `EarthCanvas` 现有 API 与地球可视化主流程不变
- `npm run build` 必须通过
- 新示例需兼容 Three.js 0.185.0
- 官方示例中部分示例依赖 WebGPU、物理引擎 wasm、WebXR 等，需特殊处理

## 3. 实施步骤

### 阶段 1：搭建目录与脚本骨架

#### 3.1.1 新建目录结构

```
src/examples/components/threejs-official/
  webgl/
  webgpu/
  misc/
  physics/
  webaudio/
  webxr/
  css2d/
  css3d/
  svg/
  games/

public/threejs-official/
  models/
  textures/
  sounds/
  fonts/
  luts/
  materialx/
  files/
  screenshots/
```

#### 3.1.2 新增注册表

**文件**：`src/examples/registry/threejsOfficialExamples.js`

内容格式与现有注册表一致：

```js
export default {
  source: 'threejs-official',
  label: 'Three.js 官方示例',
  examples: [
    {
      id: 'webgl_geometry_cube',
      category: 'webgl/geometry',
      categoryLabel: '几何体',
      title: 'Cube',
      titleEn: 'webgl geometry cube',
      description: '基础立方体贴图示例',
      thumbnail: '/threejs-official/screenshots/webgl_geometry_cube.jpg',
      entry: '',
      runner: 'vue',
      tags: ['threejs-official', 'webgl', 'geometry'],
      globals: {
        ASSET_HOST: '/threejs-official/',
      },
    },
    // ...
  ],
}
```

分类规则：
- 从文件名提取前缀作为一级分类，下划线分隔的后续部分作为二级分类
- 例如 `webgl_geometry_cube.html` → `category: 'webgl/geometry'`
- `categoryLabel` 从 `<title>` 标签或预定义映射表生成

#### 3.1.3 接入注册表汇总

**修改文件**：`src/examples/registry/index.js`

在 `registries` 数组中追加 `threejsOfficialExamples`：

```js
import threejsOfficialExamples from './threejsOfficialExamples.js'

const registries = [threeCesiumExamples, cesiumExamples, threejsLesson, earthLessons, threejsOfficialExamples]
```

#### 3.1.4 编写转换脚本

**文件**：`scripts/convert-threejs-official-to-vue.js`

功能：
1. 扫描 `/Users/zhangzhengyang/Downloads/three.js-dev/examples/*.html`
2. 解析 HTML，提取 `<title>`、`<div id="info">` 内容、`<script type="module">` 代码
3. 提取 importmap 中声明的依赖
4. 转换 JS 代码：
   - 将 `three/addons/` 替换为 `three/examples/jsm/`
   - 将 `import * as THREE from 'three'` 保留
   - 移除 `scene = new THREE.Scene()`、`camera = new THREE.PerspectiveCamera(...)`、`renderer = new THREE.WebGLRenderer(...)`、`controls = new OrbitControls(...)`
   - 移除 `renderer.setSize`、`renderer.setPixelRatio`、`renderer.setAnimationLoop`、`renderer.render(scene, camera)`、`renderer.setClearColor`
   - 移除 `window.addEventListener('resize', ...)`、`window.onload`
   - 将 `window.innerWidth/innerHeight` 替换为 `ctx.container?.clientWidth/clientHeight` 或 `ctx.size.value.width/height`
   - 将 `document.body.appendChild(renderer.domElement)` 移除
   - 将 `container.appendChild(stats.dom)` 替换为 `ctx.overlay?.appendChild(stats.dom)`
   - 将 `requestAnimationFrame` 动画函数转换为 `ctx.addUpdateCallback((delta, elapsed) => { ... })`
   - 保留自定义渲染逻辑（如 `renderer.setScissorTest`、`renderer.setViewport` 等），并自动添加 `custom-render` prop
5. 检测并使用 ExampleScene props：
   - `antialias`：若 `WebGLRenderer({ antialias: true })`
   - `alpha`：若 `WebGLRenderer({ alpha: true })`
   - `:clear-color`：若存在 `renderer.setClearColor(...)`
   - `:camera-position`：若存在 `camera.position.set(...)`
   - `:camera-look-at`：若存在 `camera.lookAt(...)`
   - `custom-render`：若存在 EffectComposer 或自定义 `renderer.render`
   - `css-renderer`：若检测到 `CSS2DRenderer` 或 `CSS3DRenderer`
6. 生成 Vue 组件文件到 `src/examples/components/threejs-official/{category}/{PascalCaseId}Example.vue`
7. 生成注册表条目并写入 `src/examples/registry/threejsOfficialExamples.js`
8. 对无法自动转换的示例（WebGPU、WebXR、多文件、复杂 HTML UI、物理引擎 wasm 依赖）输出到 `scripts/threejs-official-manual-review.json` 供人工处理

输出 Vue 组件模板：

```vue
<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 5]"
    :clear-color="0x000000"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: { type: Object, default: () => ({}) }
})

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  // 原始示例逻辑（已清理）
}
</script>
```

#### 3.1.5 扩展 sync-vue-runners.js

**修改文件**：`scripts/sync-vue-runners.js`

添加对新注册表的同步：

```js
await syncRegistry('src/examples/registry/threejsOfficialExamples.js')
```

### 阶段 2：资源扫描与按需复制

#### 3.2.1 扫描资源引用

在转换脚本中或单独脚本 `scripts/scan-threejs-official-assets.js` 中实现：

1. 正则匹配 HTML/JS 中的资源引用：
   - `'textures/...'`、`"textures/..."`
   - `'models/...'`、`'sounds/...'`、`'fonts/...'`、`'luts/...'`、`'materialx/...'`、`'files/...'`
   - `new THREE.TextureLoader().load('...')`
   - `new GLTFLoader().load('...')`
2. 建立从官方仓库到 `public/threejs-official/` 的复制清单

#### 3.2.2 复制资源

执行复制，保持目录结构：

```
/Users/zhangzhengyang/Downloads/three.js-dev/examples/models/gltf/Duck.glb
  → public/threejs-official/models/gltf/Duck.glb

/Users/zhangzhengyang/Downloads/three.js-dev/examples/textures/crate.gif
  → public/threejs-official/textures/crate.gif
```

#### 3.2.3 资源路径重写

在转换脚本中，将原始资源路径重写为基于 `props.example?.globals?.ASSET_HOST` 的绝对路径：

```js
// 转换前
new THREE.TextureLoader().load('textures/crate.gif')

// 转换后
new THREE.TextureLoader().load(props.example?.globals?.ASSET_HOST + 'textures/crate.gif')
```

对于 `three/addons/` 中内部硬编码的默认资源路径（如某些 loader 的默认路径），在运行时通过全局变量或修改 loader 的 `setPath` 方法处理。

### 阶段 3：批量转换 HTML → Vue

#### 3.3.1 执行转换脚本

```bash
node scripts/convert-threejs-official-to-vue.js
```

脚本按类别分批输出，便于检查：

```
[created] src/examples/components/threejs-official/webgl/geometry/WebglGeometryCubeExample.vue
[created] src/examples/components/threejs-official/webgl/camera/WebglCameraExample.vue
...
[manual]  webgpu_compute_water → WebGPU + TSL
[manual]  physics_ammo_break → Ammo.js wasm
```

#### 3.3.2 自动修复常见语法问题

复用/扩展 `scripts/fix-conversion-artifacts.js`，针对官方示例新增规则：

- 修复 `await` 在非 async 函数中的问题
- 修复未导入 `OrbitControls`、`GUI`、`Stats` 等
- 修复 `THREE.sRGBEncoding` 等已移除 API
- 修复引号不匹配、括号不平衡
- 修复 `=> { ... }` 无效语法

#### 3.3.3 处理边界情况

**WebGPU / TSL 示例**：
- 当前基座使用 `WebGLRenderer`，WebGPU 示例无法直接运行
- 处理方式：
  - 方案 A（推荐）：保留为 iframe 运行器（在注册表中设置 `runner: 'iframe'`，entry 指向原始 HTML）
  - 方案 B：升级基座支持 WebGPURenderer（工作量大，超出本次范围）
- 本次采用方案 A，在 `threejsOfficialExamples.js` 中对 `webgpu_*` 示例标记 `runner: 'iframe'`，entry 指向 `/external-examples/threejs-official/webgpu/xxx.html`（可选，若保留 iframe 则需复制 HTML 到 public）

**物理引擎示例**：
- `physics_ammo_*`：依赖 `examples/jsm/physics/AmmoPhysics.js` 和 `examples/jsm/libs/ammo.wasm.js`/`ammo.wasm.wasm`
- `physics_rapier_*`：依赖 `@dimforge/rapier3d`
- `physics_jolt_*`：依赖 `jolt-physics`
- 处理方式：
  - 优先尝试转换为 Vue 组件，安装对应 npm 依赖
  - 若 wasm 加载路径复杂，标记为 iframe 或待手动处理

**WebXR 示例**：
- 需要 WebXR 设备支持和 `VRButton.js`/`ARButton.js`
- 处理方式：统一标记为 iframe 运行器或跳过

**webaudio 示例**：
- 依赖 Web Audio API，结构差异不大
- 处理方式：尝试转换，注意音频上下文需在用户交互后创建

**css2d/css3d 示例**：
- 基座已支持 `css-renderer="css2d"/"css3d"`
- 处理方式：将 `<div id="info">` 等 DOM 通过 `CSS2DObject`/`CSS3DObject` 接入场景，或保留为 overlay 中的静态 HTML

**games_fps**：
- 结构复杂，依赖 PointerLockControls、键盘事件、碰撞检测
- 处理方式：尝试转换，若事件处理与基座冲突则保留 iframe

### 阶段 4：手动审查与补全

#### 3.4.1 处理 manual-review 清单

读取 `scripts/threejs-official-manual-review.json`，逐项处理：

1. 对可修复的示例手动调整 Vue 组件
2. 对确实无法转换的示例：
   - 标记 `runner: 'iframe'` 并准备 iframe 运行环境，或
   - 从注册表中排除

#### 3.4.2 处理 HTML UI（`<div id="info">`）

策略：灵活处理

- 简单说明文字：转换为 Vue 组件 template 中的静态 HTML，通过 slot 或 overlay 展示
- 复杂交互 UI：保留在 JS 中动态创建，并挂载到 `ctx.overlay`

#### 3.4.3 运行 sync-vue-runners

```bash
node scripts/sync-vue-runners.js
```

确保所有已生成 Vue 组件的示例 `runner` 为 `vue`，未生成的保持 `iframe` 或被排除。

### 阶段 5：构建与验证

#### 3.5.1 构建项目

```bash
npm run build
```

处理所有构建错误：
- 模块未找到：安装缺失依赖或修正导入路径
- 语法错误：修复转换产物
- chunk 体积警告：对官方示例路由启用动态导入（若需要）

#### 3.5.2 运行开发服务器验证

```bash
npm run dev
```

抽样检查：
- 列表页是否正常显示分类和卡片
- 基础示例 `webgl_geometry_cube` 是否渲染正常
- 相机示例 `webgl_camera` 多视口是否工作
- 材质示例 `webgl_materials_*` 资源是否加载
- 后期处理示例 `webgl_postprocessing_*` 是否工作
- CSS2D/CSS3D 示例 DOM 元素是否正确渲染

#### 3.5.3 使用 Playwright 批量验证（可选但推荐）

参考 `test-three-cesium-shader.py`，编写 `test-threejs-official.py`：

- 遍历 `threejs-official` 注册表中 `runner === 'vue'` 的示例
- 每个示例打开页面，等待 3-5 秒
- 截图并检测控制台错误
- 输出失败清单

## 4. 需要修改/新增的文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `src/examples/components/threejs-official/**` | 新增 | 转换后的 Vue 组件目录 |
| `public/threejs-official/**` | 新增 | 复制的资源文件 |
| `src/examples/registry/threejsOfficialExamples.js` | 新增 | 官方示例注册表 |
| `src/examples/registry/index.js` | 修改 | 导入并汇总新注册表 |
| `scripts/convert-threejs-official-to-vue.js` | 新增 | 官方示例转换脚本 |
| `scripts/scan-threejs-official-assets.js` | 新增 | 资源扫描与复制脚本 |
| `scripts/fix-conversion-artifacts.js` | 修改 | 增加官方示例专用修复规则 |
| `scripts/sync-vue-runners.js` | 修改 | 增加对新注册表的同步 |
| `vite.config.js` | 视情况修改 | 如有新的 alias 或 build 优化需求 |
| `package.json` | 视情况修改 | 安装官方示例依赖的新 npm 包 |

## 5. 假设与决策

1. **版本一致**：官方仓库为 Three.js 0.185.0，与项目依赖一致，不需要处理跨版本 API 差异（除个别已废弃 API 如 `THREE.sRGBEncoding`）。
2. **资源路径**：资源统一放到 `public/threejs-official/`，注册表通过 `globals.ASSET_HOST` 暴露，示例代码中资源路径重写为 `ASSET_HOST + 'relative/path'`。
3. **分类规则**：以文件名前缀作为一级/二级分类，例如 `webgl_geometry_cube.html` → `webgl/geometry`。
4. **运行器策略**：
   - 优先转换为 Vue 组件
   - WebGPU、WebXR、部分物理引擎示例因基座限制保留 iframe 或被排除
   - CSS2D/CSS3D、后期处理、基础几何体、材质、加载器、动画等示例转换为 Vue
5. **HTML UI 处理**：简单说明文字放入 Vue template 或 overlay；复杂交互保留 JS 动态创建。
6. **保持向后兼容**：不修改 `EarthCanvas`、地球视图路由和现有示例注册表字段含义。

## 6. 验证步骤

1. **脚本输出检查**：
   - 确认生成了预期的 Vue 组件数量
   - 确认 `scripts/threejs-official-manual-review.json` 中列出的示例在预期范围内

2. **资源检查**：
   - 确认 `public/threejs-official/` 下只包含被引用到的资源
   - 抽样对比原始路径和复制路径

3. **注册表检查**：
   - 打开 `/examples` 页面
   - 确认来源筛选中出现 **Three.js 官方示例**
   - 确认分类和标题显示正常

4. **运行时检查**：
   - 打开 `/examples/threejs-official/webgl/geometry/webgl_geometry_cube`
   - 确认立方体正常旋转、纹理加载正常
   - 打开 `/examples/threejs-official/webgl/camera/webgl_camera`
   - 确认双视口渲染正常

5. **构建检查**：
   - 执行 `npm run build`
   - 确认无编译错误
   - 若有 chunk 体积警告，评估是否需要代码分割

6. **回归检查**：
   - 确认现有 three-cesium-examples、threejs-lesson、cesium-examples 示例仍可正常访问

## 7. 风险与回滚

- **风险 1**：200+ 组件同时构建可能导致内存/时间显著增加。缓解：可启用路由动态导入，或在注册表中分批启用。
- **风险 2**：部分示例转换后存在运行时错误（如资源路径、事件监听）。缓解：通过 `scripts/threejs-official-manual-review.json` 隔离，逐步修复。
- **风险 3**：官方示例的 `three/addons/` 内某些内部模块在 npm 包中路径不同。缓解：转换脚本统一映射到 `three/examples/jsm/`。
- **回滚**：保留官方仓库原文件不动，删除 `src/examples/components/threejs-official/`、`public/threejs-official/` 和注册表导入即可回滚。

## 8. 建议执行顺序

1. 先创建目录和脚本（阶段 1）
2. 选择 5-10 个典型 `webgl_*` 示例做试点转换，跑通全流程
3. 修复试点中发现的问题，固化转换规则
4. 全量转换所有 `webgl_*` 示例
5. 处理 `misc_*`、`webaudio_*`、`css2d_*`、`css3d_*`、`svg_*`、`games_*`
6. 评估并处理 `webgpu_*`、`webxr_*`、`physics_*`
7. 运行构建验证和 Playwright 批量验证
