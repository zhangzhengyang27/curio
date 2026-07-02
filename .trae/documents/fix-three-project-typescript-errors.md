# 修复 three-project Vue 组件 TypeScript 类型错误计划（当前状态版）

## 摘要

基于最近一次 `pnpm typecheck` 的输出，当前仅剩 11 个 Vue 文件存在类型错误。本计划聚焦这些剩余文件，使用最小改动（类型注解、null 守卫、类型声明扩展、少量类型断言）消除错误，使 `pnpm typecheck` 退出码为 0，且不改变运行时行为。

## 当前状态分析

### 已修复的基础

- `tsconfig.json` 已包含 `"src/**/*.d.ts"`，`three-types-fixes.d.ts` 已加载并生效。
- `three-types-fixes.d.ts` 已包含 `Material.toneMapped`、`Pass.uniforms`、`BufferGeometry.parameters`、`cannon-es` 等扩展。
- 大部分 `physics` 和 `texture` 组件已修复 null 安全问题。

### 剩余错误文件

按 `pnpm typecheck` 输出，错误集中在以下文件：

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

1. **最小改动原则**：仅添加类型注解、可选链、`if` 守卫、非空断言和类型声明，不重构逻辑。
2. **不改变运行时行为**：所有修复在运行时等价于原代码。
3. **优先扩展 `three-types-fixes.d.ts`**：对于多个文件共享的 Three.js 类型缺口（如 `renderer.info.render.objects`），优先在全局声明文件中补充，而非在每个文件断言。
4. **Canvas 2D 上下文**：`canvas.getContext("2d")` 在受控环境下一定返回，使用非空断言 `!` 是安全的。
5. **lil-gui 动态对象**：GUI 的说明对象统一声明为 `Record<string, string>`，避免 `{}` 索引报错。

## 具体修改方案

### 1. 扩展全局类型声明

**文件**：`src/examples/components/three-project/three-types-fixes.d.ts`

在 `declare module "three"` 内补充：

```ts
interface WebGLInfo {
  render: {
    calls: number
    frame: number
    lines: number
    points: number
    triangles: number
    objects?: number
  }
}
```

### 2. material/7-NormalBumpMaterial.vue

- `createBumpTexture` / `createNormalTexture`：`const ctx = canvas.getContext("2d")!`
- `initGUI` 中 `material` 在回调内丢失窄化：在函数开头保存 `const mat = material`，后续回调使用 `mat`；或在 `onChange` 内使用 `material!`。
- 说明对象：`const obj: Record<string, string> = {}`

### 3. material/8-EnvReflectionRefraction.vue

- `initGUI` 开头补充 `if (!gui) return`（防御性）。
- 遍历 `meshes` 时，对 `item.material` 做窄化：
  - `metalness` / `roughness`：`(item.material as THREE.MeshStandardMaterial)`
  - `isMeshPhysicalMaterial`：`(item.material as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial`
  - `transmission` / `ior` / `thickness`：`(item.material as THREE.MeshPhysicalMaterial)`
- 说明对象：`const obj: Record<string, string> = {}`

### 4. material/9-ToonMaterial.vue

- `createGradientTexture(steps: number)`
- `createToonCharacter(material: THREE.MeshToonMaterial, position: THREE.Vector3)`
- 颜色控制回调：`const mesh = toonMeshes[i]; if (!mesh) return; mesh.material.color.set(v)`
- 说明对象：`const obj: Record<string, string> = {}`

### 5. performance/1-InstancedMesh.vue

- `createInstancedMesh(count: number)`、`createNormalMeshes(count: number)`
- `dummy` 使用：在 `animate` 和 `createInstancedMesh` 中先 `if (!dummy) return`，或使用 `dummy!`。
- 清理旧 `instancedMesh` 时使用可选链：`instancedMesh.geometry?.dispose()`，并处理 `material` 数组。
- `infoObj.objects`：依赖全局类型声明扩展；如仍报错，改为 `(renderer.value.info.render as any).objects`。

### 6. performance/2-MergedGeometry.vue

- `createNormalMeshes(count: number)`、`createMergedMesh(count: number)`、`switchMode(mode: string)`
- `useThreeScene` 解构补充 `camera`。
- `normalGroup.traverse` 清理使用 `child.geometry?.dispose()` 和 `child.material` 数组处理。
- `mergedMesh` 清理使用可选链。

### 7. performance/3-LODSystem.vue

- `createLabel(text: string)`、`updateLabel(sprite: THREE.Sprite, text: string)`、`createLODObject(position: THREE.Vector3, name: string)`
- Canvas 上下文：`const ctx = canvas.getContext("2d")!`
- `lod.traverse` 清理使用可选链处理 geometry/material。

### 8. performance/4-FrustumCulling.vue

- `createScene(count: number)`、`setFrustumCulled(value: boolean)`
- 清理 `meshes` 时使用可选链：`mesh.geometry?.dispose()`，并处理 `material` 数组。

### 9. performance/5-PerformanceMonitor.vue

- `addExtraMeshes(count: number)`、`updatePixelRatio(value: number)`
- `useThreeScene` 解构补充 `camera`。
- `performance.memory`：使用 `(performance as any).memory` 或扩展 `Performance` 接口。
- `infoObj` 内存字段类型改为 `string | number`，并在赋值处使用 `as any` 或调整类型以兼容字符串结果。
- PixelRatio 下拉重构：
  - 使用独立参数对象 `const pixelRatioParams = { 像素比: window.devicePixelRatio || 2 }`
  - `prFolder.add(pixelRatioParams, "像素比", prOptions).onChange((value: number) => { updatePixelRatio(value) })`
  - 移除 `prOptions[key]` 索引。

### 10. physics/2-CannonCollisionMaterial.vue

- `createSphere`、`createFloor`、`setupContactMaterial` 开头添加 `if (!world) return`。
- `setupContactMaterial` 中确保材质非空：`if (!sphereWorldMaterial || !floorMaterial || !world) return`。
- 清理 `sphere` / `floor` 时使用 `geometry?.dispose()` 和 material 数组处理。

### 11. physics/4-ClothSimulation.vue

- `initGUI` 重置回调中：`const body = particles[i]?.[j]; if (!body) continue`。

### 12. texture/2-TextureFlipAlpha.vue

- `info.format = formatMap[texture.format] || String(texture.format)`

## 执行顺序

1. 扩展 `three-types-fixes.d.ts`（`WebGLInfo.render.objects`）。
2. 修复 `performance/2-MergedGeometry.vue` 和 `performance/5-PerformanceMonitor.vue` 中缺失的 `camera` 解构。
3. 按文件逐个修复剩余类型错误（material → performance → physics → texture）。
4. 每批修复后运行 `pnpm typecheck`，根据新错误迭代。
5. 最终验证 `pnpm typecheck` 退出码为 0。

## 验证步骤

```bash
pnpm typecheck
```

确认退出码：

```bash
echo $?
```

预期输出 `0`。

## 预期结果

- `pnpm typecheck` 返回退出码 0。
- 所有修改集中在类型层面，不改变组件运行时行为。
- 修改文件列表：
  - `src/examples/components/three-project/three-types-fixes.d.ts`
  - `src/examples/components/three-project/material/7-NormalBumpMaterial.vue`
  - `src/examples/components/three-project/material/8-EnvReflectionRefraction.vue`
  - `src/examples/components/three-project/material/9-ToonMaterial.vue`
  - `src/examples/components/three-project/performance/1-InstancedMesh.vue`
  - `src/examples/components/three-project/performance/2-MergedGeometry.vue`
  - `src/examples/components/three-project/performance/3-LODSystem.vue`
  - `src/examples/components/three-project/performance/4-FrustumCulling.vue`
  - `src/examples/components/three-project/performance/5-PerformanceMonitor.vue`
  - `src/examples/components/three-project/physics/2-CannonCollisionMaterial.vue`
  - `src/examples/components/three-project/physics/4-ClothSimulation.vue`
  - `src/examples/components/three-project/texture/2-TextureFlipAlpha.vue`
