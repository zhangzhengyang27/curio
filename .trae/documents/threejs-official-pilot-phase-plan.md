# Three.js 官方示例整合 · 试点阶段执行计划（更新版）

## 1. 概要

将 `/Users/zhangzhengyang/Downloads/three.js-dev/examples` 中已生成的 **27 个 Three.js 官方示例**（含 10 个跨技术维度试点 + 17 个几何体相关）统一接入 `threejs-official` 来源。本阶段聚焦：

1. **修复转换脚本对非 OrbitControls 控制器的识别缺陷**（当前导致 `const controls` 重复赋值）。
2. 用最新转换脚本重新生成全部已有组件。
3. 补齐所需资源到 `public/threejs-official/`。
4. 保证 `npm run build` 零错误。
5. 在开发服务器验证关键示例渲染。

完成后暂停，待确认后再决定是否继续下一阶段。

## 2. 当前状态分析

### 2.1 已就绪的基建

- **注册表已接入**：[src/examples/registry/threejsOfficialExamples.js](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/src/examples/registry/threejsOfficialExamples.js) 已创建并汇入注册表索引。
- **组件加载约定**：[src/examples/components/index.js](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/src/examples/components/index.js) 按 `./{source}/{category}/{PascalCaseId}Example.vue` 动态加载。
- **场景基座**：[src/examples/components/ExampleScene.vue](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/src/examples/components/ExampleScene.vue) 提供统一 `ctx`，支持 `custom-render`、`css-renderer`、`enable-controls` 等属性。
- **转换脚本**：[scripts/convert-threejs-official-to-vue.js](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/scripts/convert-threejs-official-to-vue.js) 已具备 importmap 映射、基座冲突代码清理、`init()` 展平、动画转 `updateCallback`、隐式全局变量声明、重复声明移除、资源路径重写等能力。
- **资源扫描脚本**：[scripts/scan-threejs-official-assets.js](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/scripts/scan-threejs-official-assets.js) 已支持按需递归复制资源。
- **Runner 同步**：[scripts/sync-vue-runners.js](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/scripts/sync-vue-runners.js) 已支持根据组件存在性自动切换 `runner`。

### 2.2 已生成的示例（共 27 个）

当前 [threejsOfficialExamples.js](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/src/examples/registry/threejsOfficialExamples.js) 中已有 27 个条目，对应组件位于 [src/examples/components/threejs-official/](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/src/examples/components/threejs-official/)：

| 分类 | 数量 | 示例 ID |
|------|------|---------|
| `webgl/animation` | 1 | `webgl_animation_keyframes` |
| `webgl/buffergeometry` | 1 | `webgl_buffergeometry` |
| `webgl/camera` | 1 | `webgl_camera` |
| `webgl/geometry` | 17 | `webgl_geometry_colors`、`webgl_geometry_colors_lookuptable`、`webgl_geometry_convex`、`webgl_geometry_csg`、`webgl_geometry_cube`、`webgl_geometry_extrude_shapes`、`webgl_geometry_extrude_splines`、`webgl_geometry_minecraft`、`webgl_geometry_nurbs`、`webgl_geometry_shapes`、`webgl_geometry_teapot`、`webgl_geometry_terrain`、`webgl_geometry_terrain_raycast`、`webgl_geometry_text`、`webgl_geometry_text_shapes`、`webgl_geometry_text_stroke` |
| `webgl/interactive` | 1 | `webgl_interactive_buffergeometry` |
| `webgl/lights` | 1 | `webgl_lights_hemisphere` |
| `webgl/loader` | 1 | `webgl_loader_3dm` |
| `webgl/materials` | 1 | `webgl_materials_alphahash` |
| `webgl/points` | 1 | `webgl_points_billboards` |
| `webgl/postprocessing` | 1 | `webgl_postprocessing` |
| `webgl/shadowmap` | 1 | `webgl_shadowmap` |

> 用户已确认：**保留当前 27 个示例一起验证**，不回退到 10 个试点。

### 2.3 当前问题

转换脚本已修复大部分通用问题，但当前仍存在以下关键缺陷：

1. **非 OrbitControls 控制器未自动禁用默认控制器**
   - 脚本在 `detectSpecialFeatures` 中只检测 `OrbitControls`，导致当示例使用 `TrackballControls`、`FirstPersonControls` 等其他控制器时，生成的组件仍启用默认 `OrbitControls`。
   - 组件内 `const controls = ctx.controls` 与后续 `controls = new FirstPersonControls(...)` 或 `controls = new TrackballControls(...)` 产生 **const 变量重复赋值** 的构建错误。
   - 已确认受影响的示例：
     - `webgl_geometry_terrain`（使用 `FirstPersonControls`）
     - `webgl_geometry_minecraft`（使用 `FirstPersonControls`）
     - `webgl_geometry_extrude_shapes`（使用 `TrackballControls`，已手动修复，需通过脚本重新生成保持同步）

2. **组件版本不一致**：`webgl/geometry` 系列部分组件是较早生成的，可能未包含最新的脚本修复，需统一重新生成。

3. **资源缺失**：部分示例依赖的 models/textures/fonts 等资源尚未复制到 `public/threejs-official/`。

4. **构建错误待验证**：当前尚未运行 `npm run build`，可能存在残余编译错误（如 `3dm` loader 依赖的 `rhino3dm`、后期处理示例的 `EffectComposer` 用法、CSG/NURBS 等 addon 导入）。

5. **运行时错误待验证**：开发服务器中需确认 `custom-render`、多视口、动画循环、资源加载等行为正常。

## 3. 实施步骤

### 3.1 修复转换脚本：识别所有自定义控制器并禁用默认控制器

**目标**：让脚本自动识别示例中创建的非 OrbitControls 控制器，并在模板中输出 `:enable-controls="false"`。

**操作文件**：[scripts/convert-threejs-official-to-vue.js](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/scripts/convert-threejs-official-to-vue.js)

**具体修改**：

1. 在 `detectSpecialFeatures` 函数中新增 `customControls` 检测：
   - 检测 `new TrackballControls(`
   - 检测 `new FirstPersonControls(`
   - 检测 `new FlyControls(`
   - 检测 `new PointerLockControls(`（同时保持 SKIP_PATTERNS 排除，避免生成）
   - 其他非 OrbitControls 控制器可后续按需扩展。

2. 当 `customControls` 为 true 时，在 `buildVueTemplate` 中输出 `:enable-controls="false"`。

**预期结果**：重新生成的 `webgl_geometry_terrain`、`webgl_geometry_minecraft`、`webgl_geometry_extrude_shapes` 等组件模板中自动包含 `:enable-controls="false"`。

### 3.2 重新生成全部已有分类的 Vue 组件

**目标**：让 27 个示例组件都基于转换脚本的最新逻辑重新生成，消除早期版本遗留的重复回调/重复声明/控制器冲突等问题。

**命令**（按分类执行，避免一次性生成全部 `webgl` 示例）：

```bash
node scripts/convert-threejs-official-to-vue.js webgl/geometry
node scripts/convert-threejs-official-to-vue.js webgl/animation
node scripts/convert-threejs-official-to-vue.js webgl/buffergeometry
node scripts/convert-threejs-official-to-vue.js webgl/camera
node scripts/convert-threejs-official-to-vue.js webgl/interactive
node scripts/convert-threejs-official-to-vue.js webgl/lights
node scripts/convert-threejs-official-to-vue.js webgl/loader
node scripts/convert-threejs-official-to-vue.js webgl/materials
node scripts/convert-threejs-official-to-vue.js webgl/points
node scripts/convert-threejs-official-to-vue.js webgl/postprocessing
node scripts/convert-threejs-official-to-vue.js webgl/shadowmap
```

**预期结果**：

- 覆盖的 27 个 `.vue` 组件被重新生成或更新。
- [threejsOfficialExamples.js](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/src/examples/registry/threejsOfficialExamples.js) 中对应条目被脚本合并保留（`existingMap` 逻辑）。
- 无法自动转换的示例会输出到 `scripts/threejs-official-manual-review.json`（若此前有则追加）。

### 3.3 扫描并复制资源

**命令**：

```bash
node scripts/scan-threejs-official-assets.js
```

**说明**：

- 扫描 `/Users/zhangzhengyang/Downloads/three.js-dev/examples` 下所有 HTML 示例中的资源引用。
- 将存在资源从官方仓库复制到 `public/threejs-official/{asset}`，保持原目录结构。
- 缺失资源会记录在 `scripts/threejs-official-assets-manifest.json` 的 `missing` 字段，不阻断构建。
- 若缺失资源属于当前 27 个示例且影响渲染，后续手动补全或调整该示例的 `runner` 为 `iframe`。

### 3.4 同步 runner

**命令**：

```bash
node scripts/sync-vue-runners.js
```

**说明**：

- 确保所有已生成组件的示例 `runner` 为 `vue`。
- 若某示例组件缺失（如被删除），其 `runner` 自动回退为 `iframe`。

### 3.5 构建验证与错误修复

**命令**：

```bash
npm run build
```

**通过标准**：零编译错误、零 Vite 导入分析错误。

**失败处理循环**：

1. 查看第一个错误文件与行号。
2. 判断是否为通用模式错误：
   - **是** → 修复 [scripts/convert-threejs-official-to-vue.js](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/scripts/convert-threejs-official-to-vue.js)，然后重新执行 `3.2` 对应分类的转换命令。
   - **否** → 手动修复对应的 `.vue` 文件，并记录到 `scripts/threejs-official-manual-review.json` 的 `manualFixes` 字段。
3. 重新运行 `npm run build` 直到通过。

**常见兜底修复**（按优先级）：

1. 删除孤立的重复变量声明（如 `let mouseY;`）。
2. 合并或删除多余的 `ctx.addUpdateCallback`。
3. 移除未使用的 `container = document.getElementById('container')` 代码。
4. 修正 `three/examples/jsm/` 导入路径或缺失的 addon 依赖。
5. 若某个示例依赖外部库（如 `rhino3dm`）无法在当前项目使用，将其 `runner` 改为 `iframe` 或从注册表移除。

### 3.6 开发服务器验证

**命令**：

```bash
rm -rf node_modules/.vite
npm run dev
```

**验证清单**：

1. 打开 `/examples` 列表页，确认来源筛选出现 **Three.js 官方示例**，且 27 个条目可正常点击。
2. 分别打开以下抽样路由，确认无白屏、控制台无致命错误、3D 场景渲染正常：
   - `/examples/threejs-official/webgl/camera/webgl_camera`
   - `/examples/threejs-official/webgl/materials/webgl_materials_alphahash`
   - `/examples/threejs-official/webgl/postprocessing/webgl_postprocessing`
   - `/examples/threejs-official/webgl/animation/webgl_animation_keyframes`
   - `/examples/threejs-official/webgl/loader/webgl_loader_3dm`
   - `/examples/threejs-official/webgl/shadowmap/webgl_shadowmap`
   - `/examples/threejs-official/webgl/geometry/webgl_geometry_terrain`
   - `/examples/threejs-official/webgl/geometry/webgl_geometry_minecraft`
3. 回归检查：打开任意一个已有的 `webgl/geometry` 示例（如 `/examples/threejs-official/webgl/geometry/webgl_geometry_colors`），确认仍然正常。
4. 回归检查：打开现有 `three-cesium-examples` 或 `threejs-lesson` 示例，确认未被破坏。

## 4. 需要修改/新增的文件

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| [scripts/convert-threejs-official-to-vue.js](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/scripts/convert-threejs-official-to-vue.js) | 修改 | 修复非 OrbitControls 控制器的识别逻辑 |
| [src/examples/components/threejs-official/**/*.vue](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/src/examples/components/threejs-official/) | 重新生成 | 27 个示例组件 |
| [src/examples/registry/threejsOfficialExamples.js](file:///Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/地球%203D%20可视化/earth-app/src/examples/registry/threejsOfficialExamples.js) | 修改（由脚本自动） | 27 个示例条目 |
| `public/threejs-official/**` | 新增/补齐 | 资源文件 |
| `scripts/threejs-official-manual-review.json` | 新增/修改 | 手动处理记录 |
| `scripts/threejs-official-assets-manifest.json` | 新增/修改 | 资源扫描清单 |

## 5. 假设与决策

1. **保留当前 27 个示例**：按用户确认，不回退到 10 个试点，统一重新生成并验证全部已有条目。
2. **示例来源版本**：`/Users/zhangzhengyang/Downloads/three.js-dev` 与项目 `three@0.185.0` 一致。
3. **runner 策略**：成功转换的示例保持 `runner: 'vue'`；失败示例标记为 `iframe` 或排除。
4. **资源策略**：按需复制，保持原目录结构；缺失资源仅记录不阻断构建。
5. **HTML UI 处理**：`#info` 文字保留在组件 template 中；复杂内联 UI 保持 JS 动态创建。
6. **向后兼容**：不修改 `EarthCanvas`、地球视图路由及现有注册表字段含义。
7. **暂停条件**：构建通过且关键示例渲染正常后即暂停，等待用户确认是否继续下一阶段。

## 6. 验证步骤

1. 修改 `detectSpecialFeatures` 后，重新执行 `3.2` 全部 11 条分类转换命令，输出对应 `[created]` 记录。
2. 检查 `webgl_geometry_terrain`、`webgl_geometry_minecraft`、`webgl_geometry_extrude_shapes` 的模板中是否出现 `:enable-controls="false"`。
3. `node scripts/scan-threejs-official-assets.js` 输出资源复制统计，无未处理的 `ENOENT` 抛错。
4. `node scripts/sync-vue-runners.js` 无异常。
5. `npm run build` 零错误。
6. `npm run dev` 启动后，列表页和 8 个抽样示例页正常渲染。
7. 现有 `webgl/geometry` 示例及 `three-cesium-examples`/`threejs-lesson` 示例仍可正常访问。

## 7. 暂停条件

完成上述 7 步验证后，任务进入暂停状态，汇报结果并等待用户确认是否继续下一阶段（如全量转换 `webgl` 其他类别、处理 `manual-review` 示例、或接入 WebGPU/WebXR 特殊示例）。
