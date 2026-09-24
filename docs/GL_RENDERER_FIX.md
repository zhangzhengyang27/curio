# graphics / mygrapics 共 84 个示例渲染失败：根因与修复

> 日期：2026-09-24
> 发现路径：排查「示例封面空白」时暴露出来（见 [`THUMBNAIL_ROOT_CAUSE.md`](./THUMBNAIL_ROOT_CAUSE.md) §4A）。
> **这不是封面问题，是这 84 个示例在应用里根本渲染不出来 —— 线上同样坏。**

## 一、症状

控制台报错，一次性影响 `graphics/*` 与 `mygrapics/*` 两棵树：

```
TypeError: renderer.compileSync is not a function
    at initGraphicsExample / initMyGrapicsExample
```

截图流水线只能截到纯色背景 —— 因为场景从来没起来。

## 二、根因：调用的 API 与实际的库不是同一套

| | |
|---|---|
| 组件**调用**的 | `renderer.compileSync()` / `useProgram()` / `setMeshData()` / `uniforms` / `createFBO()` / `bindFBO()` / `loadTexture()` |
| 组件**导入**的 | `@/examples/jsm-compat/{graphics,mygrapics}/common/lib/ogl/core/Renderer.js` |
| 那个文件**实际是** | **原版 OGL 的 `Renderer`** —— 只有 `render({ scene, camera })` / `setSize()` / `setViewport()` 等 |

全仓检索：`compileSync` / `useProgram` / `setMeshData` **只有调用、没有任何定义**。

### 真正实现在哪

课程原版渲染器**一直在仓库里**，只是从未被加载：

```
public/graphics/common/lib/gl-renderer.js      ← 2534 行，webpack UMD
public/mygrapics/common/lib/gl-renderer.js     ← 与上者字节相同（md5 一致）
```

它是课程自研渲染器（不是 OGL 的扩展），靠 UMD 的
`root["GlRenderer"] = factory()` 挂到 `window`。

**为什么从未被加载**：这些示例早已被转成 **Vue 组件**（`runner === 'vue'`），
而带 import map 的 `IframeRunner.vue` 从未被任何条目使用 ——
实测 1417 条 registry 条目的 `runner` **全部是 `vue`**。
原版 HTML 示例里 `<script src=".../gl-renderer.js">` 的那一步，在转换过程中丢了。

## 三、修复：84 个组件一行都不用改

关键在于两组组件走的是**不同导入路径**：

| 组 | 导入路径 | 用的是 |
|---|---|---|
| 课程组（84 个，含 `compileSync`） | 直连 `.../ogl/core/Renderer.js` | 课程自研渲染器 API |
| OGL 组（`lights/*`、`3d-model/*` 等） | 走 barrel `.../ogl/index.mjs` | 原版 OGL 原生 API |

所以只需在**这一处分叉**，两组各拿各的：

1. **`scripts/generate-gl-renderer-esm.mjs`**（新增）
   把上游 UMD 剥掉外壳、只保留 factory 并显式调用，产出可被 Vite 打包的 ESM：
   `src/examples/jsm-compat/gl-renderer.esm.js`（入库，**禁止手工编辑**）。
2. **`core/OglRenderer.js`**（新增）
   原 OGL `Renderer` 另存于此，内容不变。
3. **`core/Renderer.js`**（改写为转发）
   指向课程原版 —— 84 个课程组组件因此零改动。
4. **`ogl/index.mjs`**（改 1 行）
   `export { Renderer }` 改为从 `OglRenderer.js` 出，OGL 组行为不变。

### 为什么不能直接 `import` 那个 UMD

UMD 的挂载方式是 `root["GlRenderer"] = factory()`，而 ESM 模块作用域里
`this` 是 `undefined` → 直接 `import` 会抛错。剥壳后显式调用 factory 即得等价模块。

## 四、验证

| 项 | 结果 |
|---|---|
| 8 个样本实测（4 课程组 + 4 OGL 组） | **全部渲染成功，0 控制台报错**；OGL 组画面方差 12000+，无回归 |
| 封面重截失败数 | `graphics` 23 → **15**，`mygrapics` 24 → **12** |
| `npm run verify` | 7 项全绿 |
| `npm run lint:ci` | 0 error |

> 实测时踩到一个坑：探针一开始把 `/examples/:source/*` 里不存在的 id 也判成「有画面」
> —— 因为「未找到示例」页面本身不是纯色。探针必须先识别该页面。

## 五、防回归

`src/examples/jsm-compat/gl-renderer.esm.js` 是**生成物**，与上游 UMD 漂移 =
这 84 个示例再次静默渲染失败。已加闸门：

```bash
npm run verify:gl-renderer      # 逐字节比对产物与上游 UMD
```

已接入 `npm run verify` 链（第 6 环）与 CI。
改了上游 `public/*/common/lib/gl-renderer.js` 后**必须**重跑：

```bash
node scripts/generate-gl-renderer-esm.mjs
```

## 六、遗留

修复后 `graphics` 仍有 15 条、`mygrapics` 仍有 12 条封面截不出来，但**根因不同**：

- `graphics/qcharts/*`、`graphics/d3/*`：缺 spritejs 插件
- `graphics/vis-geo-earth/*`：数据错误
- `mygrapics/pixels/*`：canvas 恒为 0×0，demo 从不给画布定尺寸
- `graphics/data/weather/*`：数据错误

这些属于各自示例的实现问题，与本次渲染器修复无关。
