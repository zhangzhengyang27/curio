# three-project 整合入 earth-app 计划书

## 摘要

将 `/Users/zhangzhengyang/Desktop/Code/threeJs/Project/three-project` 的 Three.js 学习示例作为新来源 `three-project` 整合到当前 `earth-app` 示例中心。当前文件迁移、资源本地化、注册表接入、共享场景 Hook 与布局适配已基本完成；本计划聚焦剩余质量关卡：修复 11 个 Vue 组件的 TypeScript 类型错误，通过 `typecheck`、`build`、`lint`，并在开发服务器对每个分类示例进行 spot-check。可选补充 Playwright E2E 测试。

## 当前状态分析

### 已完成

| 项 | 状态 | 位置 |
|---|---|---|
| Vue 组件迁移 | 完成 | `src/examples/components/three-project/**/*.vue`（106 个组件，11 个分类） |
| 公共资源本地化 | 完成 | `public/three-project/`（贴图、模型、Draco 解码器、音频等） |
| 示例注册表 | 完成 | `src/examples/registry/threeProjectExamples.js` 并已导入 `src/examples/registry/index.js` |
| 共享场景 Hook | 完成 | `src/examples/components/three-project/_shared/useThreeScene.ts`（ResizeObserver + 容器尺寸） |
| 共享布局组件 | 完成 | `src/examples/components/three-project/_shared/PageLayout.vue`（可折叠信息面板 + 返回链接） |
| 类型声明扩展 | 部分完成 | `src/examples/components/three-project/three-types-fixes.d.ts`（Material、Object3D、cannon-es 等） |
| 依赖安装 | 完成 | `three@^0.185.0`、`@types/three@0.185.0`、`cannon-es@^0.20.0` |
| tsconfig 配置 | 完成 | 已包含 `"src/**/*.d.ts"` |

### 待完成

- **TypeScript 错误**：剩余 11 个 Vue 文件存在类型错误，集中在 `material`、`performance`、`physics`、`texture` 分类。
- **构建验证**：尚未运行 `pnpm typecheck` 与 `pnpm build`。
- **代码规范**：未运行 `pnpm lint`。
- **运行时验证**：未在开发服务器对 11 个分类示例做 spot-check。
- **测试覆盖**：尚无 `tests/three-project-examples.spec.js`。

### 剩余 TypeScript 错误文件

1. `src/examples/components/three-project/material/7-NormalBumpMaterial.vue`
2. `src/examples/components/three-project/material/8-EnvReflectionRefraction.vue`
3. `src/examples/components/three-project/material/9-ToonMaterial.vue`
4. `src/examples/components/three-project/performance/1-InstancedMesh.vue`
5. `src/examples/components/three-project/performance/2-MergedGeometry.vue`
6. `src/examples/components/three-project/performance/3-LODSystem.vue`
7. `src/examples/components/three-project/performance/4-FrustumCulling.vue`
8. `src/examples/components/three-project/performance/5-PerformanceMonitor.vue`
9. `src/examples/components/three-project/physics/2-CannonCollisionMaterial.vue`
10. `src/examples/components/three-project/physics/4-ClothSimulation.vue`
11. `src/examples/components/three-project/texture/2-TextureFlipAlpha.vue`

## 假设与决策

1. **最小改动原则**：仅添加类型注解、`if` 守卫、可选链、非空断言和类型声明扩展，不重构业务逻辑或运行时行为。
2. **共享类型优先**：多个组件共用的 Three.js 类型缺口（如 `WebGLInfo.render.objects`、`Material` 通用属性）优先在 `three-types-fixes.d.ts` 中补充，而非逐文件断言。
3. **运行时等价**：所有类型修复必须保持运行时行为不变；不会为了过类型检查而改变数据流。
4. **Canvas 2D 上下文**：受控 DOM 环境下 `canvas.getContext("2d")` 一定返回，使用 `!` 非空断言是安全的。
5. **GUI 说明对象**：`lil-gui` 动态说明对象统一声明为 `Record<string, string>`，避免 `{}` 索引报错。
6. **不新建共享工具**：本次不额外抽取新的 composable 或工具函数，只在现有文件内修复。
7. **E2E 测试可选**：构建与 spot-check 通过后再决定是否补充 Playwright 测试。

## 具体修改方案

### 步骤 1：扩展全局类型声明

**文件**：`src/examples/components/three-project/three-types-fixes.d.ts`

- 在 `declare module "three"` 内补充 `WebGLInfo.render.objects?: number`。
- 清理 `declare global { interface Array<T> { ... } }` 中无意义的扩展（`dispose`、`color`、`map` 等不应属于 `Array`），将其移到更合适的 `Material` 或 `Object3D` 扩展中，避免污染全局数组类型。
- 确保 `Pass.uniforms`、`cannon-es` 扩展、`Performance.memory` 等已存在且有效。

### 步骤 2：逐个修复剩余 Vue 组件

#### `material/7-NormalBumpMaterial.vue`

- `createBumpTexture` / `createNormalTexture`：`const ctx = canvas.getContext("2d")!`
- `initGUI` 中 `material` 在回调内丢失窄化：在函数开头保存 `const mat = material`，后续回调使用 `mat`；必要时在回调内使用 `material!`。
- GUI 说明对象：`const obj: Record<string, string> = {}`

#### `material/8-EnvReflectionRefraction.vue`

- 遍历 `meshes` 时，对 `item.material` 做窄化：
  - `metalness` / `roughness`：`(item.material as THREE.MeshStandardMaterial)`
  - `isMeshPhysicalMaterial`：使用窄化后的 `THREE.MeshPhysicalMaterial` 访问 `transmission` / `ior` / `thickness`
- GUI 说明对象：`const obj: Record<string, string> = {}`

#### `material/9-ToonMaterial.vue`

- `createGradientTexture(steps: number)`
- `createToonCharacter(material: THREE.MeshToonMaterial, position: THREE.Vector3)`
- 颜色控制回调：`const mesh = toonMeshes[i]; if (!mesh) return; mesh.material.color.set(v)`
- GUI 说明对象：`const obj: Record<string, string> = {}`

#### `performance/1-InstancedMesh.vue`

- 为函数参数添加类型：`createInstancedMesh(count: number)`、`createNormalMeshes(count: number)`
- `dummy` 使用：先 `if (!dummy) return` 或使用 `dummy!`
- 清理旧 `instancedMesh` 时使用可选链：`instancedMesh.geometry?.dispose()`，并处理 `material` 数组
- `infoObj.objects`：依赖全局类型声明扩展；如仍报错，改为 `(renderer.value.info.render as any).objects`

#### `performance/2-MergedGeometry.vue`

- 为函数参数添加类型：`createNormalMeshes(count: number)`、`createMergedMesh(count: number)`、`switchMode(mode: string)`
- `useThreeScene` 解构补充 `camera`
- `normalGroup.traverse` 清理使用 `child.geometry?.dispose()` 和 `child.material` 数组处理
- `mergedMesh` 清理使用可选链

#### `performance/3-LODSystem.vue`

- 为函数添加类型：`createLabel(text: string)`、`updateLabel(sprite: THREE.Sprite, text: string)`、`createLODObject(position: THREE.Vector3, name: string)`
- Canvas 上下文：`const ctx = canvas.getContext("2d")!`
- `lod.traverse` 清理使用可选链处理 geometry/material

#### `performance/4-FrustumCulling.vue`

- 为函数参数添加类型：`createScene(count: number)`、`setFrustumCulled(value: boolean)`
- 清理 `meshes` 时使用可选链：`mesh.geometry?.dispose()`，并处理 `material` 数组

#### `performance/5-PerformanceMonitor.vue`

- 为函数参数添加类型：`addExtraMeshes(count: number)`、`updatePixelRatio(value: number)`
- `useThreeScene` 解构补充 `camera`
- `performance.memory`：使用 `(performance as any).memory` 或依赖全局 `Performance` 接口扩展
- `infoObj` 内存字段类型改为 `string | number`，并在赋值处使用兼容方式
- PixelRatio 下拉重构为独立参数对象，避免 `prOptions[key]` 索引

#### `physics/2-CannonCollisionMaterial.vue`

- `createSphere`、`createFloor`、`setupContactMaterial` 开头添加 `if (!world) return`
- `setupContactMaterial` 中确保材质非空：`if (!sphereWorldMaterial || !floorMaterial || !world) return`
- 清理 `sphere` / `floor` 时使用 `geometry?.dispose()` 和 material 数组处理

#### `physics/4-ClothSimulation.vue`

- `initGUI` 重置回调中：`const body = particles[i]?.[j]; if (!body) continue`

#### `texture/2-TextureFlipAlpha.vue`

- `info.format = formatMap[texture.format] ?? String(texture.format)`

### 步骤 3：运行并修复 `pnpm typecheck`

- 执行 `pnpm typecheck`
- 如果仍有新错误，按文件逐个修复，迭代直到退出码为 0

### 步骤 4：运行并修复 `pnpm build`

- 执行 `pnpm build`
- 处理构建过程中出现的路径、类型、chunk 过大或依赖缺失问题
- 若出现 chunk size warning，评估是否需要对超大依赖做动态导入

### 步骤 5：运行 `pnpm lint`

- 执行 `pnpm lint`
- 修复未使用变量、格式等问题；优先使用 `_` 前缀或删除未使用导入

### 步骤 6：开发服务器 spot-check

- 启动 `pnpm dev`
- 从每个分类中抽查 1 个示例，共 11 个：
  - `base/1-Home`
  - `animation/1-Animation`
  - `controls/1-OrbitControlsAdvanced`
  - `light/1-GsapAnimation`
  - `material/1-MatcapMaterial`
  - `performance/1-InstancedMesh`
  - `physics/1-CannonWithFloor`
  - `postprocessing/1-EffectComposer`
  - `texture/1-TextureTransform`
  - `webgl/1-BasicTriangle`
  - `examples/1-HomeSceneEditor`
- 检查点：容器内渲染正常、无控制台报错、返回示例列表链接可用、资源加载无 404

### 步骤 7：可选 — 补充 E2E 测试

- 创建 `tests/three-project-examples.spec.js`
- 覆盖至少 3 个分类的代表性示例路由，验证 canvas 元素存在且无控制台错误
- 执行 `pnpm test:e2e`

## 验证步骤

```bash
# 1. 类型检查
pnpm typecheck
# 预期退出码 0

# 2. 构建
pnpm build
# 预期成功生成 dist

# 3. 代码规范
pnpm lint
# 预期无 error

# 4. 开发服务器 spot-check
pnpm dev
# 手动或半自动访问 /examples/three-project/:category/:id

# 5. 可选 E2E
pnpm test:e2e
# 预期通过
```

## 预期结果

- `pnpm typecheck` 退出码为 0。
- `pnpm build` 成功完成，无阻塞错误。
- `pnpm lint` 无 error（允许未改动的历史 warning）。
- 11 个分类的代表性示例在开发服务器中渲染正常，控制台无致命错误。
- （可选）`tests/three-project-examples.spec.js` 通过。

## 风险与回退

- **类型修复引入运行时行为变化**：所有断言仅用于类型层面，实际逻辑保持不变；修复后通过 spot-check 验证。
- **构建 chunk 过大**：若某个示例依赖过大，回退方案为动态导入该依赖。
- **资源 404**：检查 `public/three-project/` 中对应文件是否存在，必要时修正组件内的路径。
