# 示例封面空白：根因排查报告

> 排查日期：2026-09-24
> 背景：`docs/DEDUP_RESEARCH.md` §6 发现 120 条「无效封面」（字节完全相同），
> 结论是「本地重跑截图脚本即可修复」。**该结论只对了一半** —— 脚本确实有 7 处缺陷，
> 但修完之后仍有 67/91 条重截失败，**根因在应用本身，不在截图脚本**。

## 一、结论摘要

| 层 | 问题 | 状态 |
|---|---|---|
| 截图脚本 | 7 处缺陷（见 §2） | **已修**，重截有效数 13/91 → 31 → **51** |
| 封面闸门 | 只查「字段空 / 文件不存在 / size=0」，查不出「有字节但纯色」 | **已修**，新增内容检测 + 两档报告 |
| 应用层 **A** | **84 个示例组件调用了不存在的 API** | **已修**（见 [`GL_RENDERER_FIX.md`](./GL_RENDERER_FIX.md)），多救回 20 张封面 |
| 应用层 B~E | 另 4 类根因导致 47 条仍空白（见 §4） | **未修**，需要单独决策 |

**最重要的发现**：`graphics/*` 与 `mygrapics/*` 共 **84 个示例组件调用了不存在的 API**
（`renderer.compileSync is not a function`），也就是说这 84 个示例在**线上也是坏的**，
不只是封面空白。这比「封面不好看」严重得多。**已修复**。

## 二、截图脚本的 7 处缺陷（已修）

`scripts/screenshot-examples.mjs`

1. **就绪判据是固定 `waitForTimeout(1500)`**。重资产示例（Cesium 瓦片）在 1.5s 时连
   canvas 都还没创建。→ 改为「等 canvas 渲染尺寸就绪 + networkidle + 轮询画面内容」。
2. **成功判据是「文件字节数 > 500」**。纯白 960×640 的 JPEG 就有 ~3.1KB，于是所有空白
   截图都被记为 `ok: true` —— `scripts/_thumb_map.json` 里 **509 条全绿、永不重试**。
   这是「整批空白却全绿」的直接原因。→ 改为内容判据。
3. **探针只截左上角 320×240**。画面画在正中的示例会被整个漏掉：实测 kaikeba
   「01-webgl-入门-webgl/4-一个点」全画幅方差 **117**，而左上角同一帧是 **0**。
   → 改为全画幅。
4. **用了同步的 `getAllExamples()`**。registry 已改为按 source 懒加载，同步版恒返回
   `[]`，脚本会静默「什么都没做」。→ 改为 `getAllExamplesAsync()`。
5. **隐藏页面 chrome 的选择器过期**（`.app-nav` / `.top-bar`）。当前真实的面包屑/标题条
   是 `.demo-float-meta`，且被 Teleport 到 body，必须按类名全局隐藏。
6. **构图缺陷**：脚本截 `.demo-body`（960×640），而很多示例画布只有 512×512 或
   Cesium 默认的 300×150 → 封面大片空白。→ 新增 `transform: scale()` 缩放铺满。
7. **缺 `--dry-run` / `--limit`**；`--only-blank` 未隐含覆盖，要修的空白文件会被
   「已存在即跳过」永久跳过。

### 构图修正为什么只能用 `transform`

改 canvas 的 `width` / `height`（布局尺寸）会让「只绘制一次」的 WebGL demo 触发 resize
重分配绘制缓冲区后**不再重绘**，画面整幅变全黑（实测 `graphics/animate_webgl/*` 全中招）。
`transform` 不产生 resize 事件，画面保持原样，只是显示得更大。

### 判据选型（实测数据）

| 样本 | 非主色占比 | 颜色桶数 | 全画幅方差 | 真相 |
|---|---|---|---|---|
| `earth-lessons/11-airports` | 0 | 1 | 0 | 真空白 |
| `cesium-examples/expand/cesium_three` | 0 | 1 | 0 | 真空白 |
| `webgl/.../4-一个点` | 0.004 | 2 | 117 | 有内容（黑底一个点） |
| `webgl/.../01-打印向量` | 0.427 | 2 | 16 | 有内容 |

判据 = `方差 > 5` **或** `非主色占比 ≥ 0.0001`。两者取或：方差漏「暗且稀疏」，非主色占比
漏「同色系渐变」。纯色图两项都是 0。

## 三、重截结果

```
--only-blank: 命中重复封面文件（随修复推进递减）
修完截图脚本:  成功 31 / 失败 67
再修渲染器后:  成功 51 / 失败 47     ← 当前状态
```

`scripts/_thumb_map.json` 中带判据记录的 **98 条 = 51 有效 + 47 无效**；
无效的 47 条按来源：`graphics` 15、`webgl` 12、`mygrapics` 12、`earth-lessons` 6、
`cesium-examples` 1、`threejs-lesson` 1。

51 张已确认有效（`public/example-thumbs/**` 已更新，`git status` 恰好 51 个文件）；
47 张仍无效的**已还原到 HEAD**，保持改动只含真实改善。

判据无误伤、也无「仅靠 nonModal 蒙混」的项（通过项最小方差 16 > 阈值 5）。

## 四、剩余 47 条的 5 类应用级根因

### A. `renderer.compileSync is not a function` —— 影响约 47 条（`graphics` + `mygrapics`）✅ **已修**

- 调用点：**84 个** `.vue` 组件调用 `renderer.compileSync()` / `renderer.useProgram()` /
  `renderer.setMeshData()` / `renderer.uniforms`（这 84 个也正是直接导入
  `ogl/core/Renderer.js` 的那 84 个）。
- 被调用方：`src/examples/jsm-compat/graphics/common/lib/ogl/core/Renderer.js`
  —— 该文件是**原版 OGL 的 `Renderer`**，只有 `render({scene,camera})`，
  没有 `compileSync` / `useProgram`。
- 全仓库 grep：`compileSync` / `setMeshData` **只有调用、没有任何定义**。
- `ogl` 不是 npm 依赖，是完整 vendored 在 `src/examples/jsm-compat/*/common/lib/ogl/`。
- **含义**：这不是截图问题，是这 84 个示例**在应用里就渲染不出来**。
- **修复**：真正的实现在 `public/{graphics,mygrapics}/common/lib/gl-renderer.js`
  （webpack UMD，课程原版）。剥壳转 ESM 后让 `core/Renderer.js` 指向它，
  84 个组件零改动。**完整根因、修复方案与验证见 [`GL_RENDERER_FIX.md`](./GL_RENDERER_FIX.md)。**
- **效果**：`graphics` 失败 23 → 15，`mygrapics` 24 → 12。

### B. 裸 `three` 说明符无法解析 —— 影响 6 条（`earth-lessons/*`）

- `src/examples/components/earth-lessons/earth-lessons/11AirportsExample.vue:25`
  用 `await import('/external-examples/earth-lessons/11-airports/earth.js')`。
- `public/external-examples/**/*.js` 由 Vite **原样服务**，里面的
  `import * as THREE from 'three'` 不会被改写；而 `index.html` **没有 import map**
  → 浏览器原生 ESM 解析失败：`Failed to resolve module specifier "three"`。
- 现象完全吻合：示例设了 `clear-color="0xb9d3ff"`，于是截图是**纯浅蓝**
  （实测 mean=217 = (185+211+255)/3），球体从未加载。
- **已验证修法**：注入 import map 后方差 0 → **11574**，地球网格出现。
- **残留问题**：应用自身的 `three` 被 `vite.config.ts:26-36` 别名到
  `src/examples/three-build-compat/three.module.js`（compat 构建），而 import map 只能指向
  `/node_modules/three/...`（`copy-example-deps.js` 只把它拷进 `dist/`，dev 由 Vite 提供）
  → **两个 THREE 实例**。`useEarthLessonsBaseUrl.ts` 打的是 `THREE.TextureLoader.prototype`
  补丁，负责把相对纹理路径解析到示例目录，跨实例失效 → 球体是**黑的**（无贴图）。
- **含义**：要彻底修需要设计「raw 模块与应用共享同一 THREE 实例」的方案
  （dev/prod 都要成立），不是加一行 import map 就完事。

### C. Cesium Ion 返回 401 —— 影响 1~2 条（`cesium-examples/*`）

- `https://api.cesium.com/v1/assets/1/endpoint?access_token=...` → **401**。
- `PAGEERROR` 紧随其后，Cesium 场景起不来。属于**凭据失效**，需要换 token 或避开 Ion 资源。

### D. 在 headless 下不初始化 —— 影响 13 条（`webgl` 12 + `threejs-lesson` 1）

- 特征：canvas 存在、无控制台报错、22s 后仍纯色。
- 例：`mygrapics/pixels/index1` 的 canvas 是 **0×0**（demo 从不给画布定尺寸）。
- 例：`webgl/kaikeba-webgl/03-绘制三角形/14-狮子座` canvas 960×640、WebGL1、无报错、纯黑。
- 推测与 SwiftShader（无真实 GPU）或需要交互有关，**未定论**。

### E. 另有 22 条 `threejs-official` 不可修

用的是**上游官方截图**（`public/threejs-official/screenshots/`），空白是上游自带的。
只能换图源或显式降级为占位符。

## 五、对闸门阈值的重要修正

`scripts/verify-thumbnails.mjs` 的 `SHARED_LIMIT = 5` **经实测是正确的，不要下调**。

重截后重算分组规模分布：`{2:18, 3:3, 6:1, 18:1, 22:1}`。2~5 条的组里**大量是合法的**：

- `webgl/kaikeba-webgl/06-颜色与纹理/07-纹理` 与 `13-纹理模块化`
  —— 重截后两张都是有效画面（nonModal=0.246），只是这两课**画面本来就完全一样**。
- `threejs-official` 的 WebGL/WebGPU 双后端对（18.9 KB 级）、
  `physics_ammo_terrain | physics_rapier_terrain` 同理。
- 但同档里也有真无效的：`webgl/kaikeba-webgl/03-绘制三角形/{9-异步绘图,10-异步绘图,11-多边形模块化}`
  （3.0 KB）。

所以闸门现在输出**两档**：`>5 条` 报为疑似占位图（`--strict` 时拦截），
`2~5 条` 仅列出供人工复核。**不能用「字节数 < 4KB」当硬失败**：实测
`webgl/kaikeba-webgl/03-绘制三角形/3-线` 只有 4095 B，但它是**合法**封面
（黑底 + 黄色平行四边形轮廓）。

## 六、建议的下一步

1. ~~**先修 A（84 个示例的库/API 不匹配）**~~ ✅ **已完成**，见
   [`GL_RENDERER_FIX.md`](./GL_RENDERER_FIX.md)。收益最大：一次修好 84 个示例的
   渲染 + 多救回 20 张封面，且这是线上可见的功能缺陷。
2. **再定 B 的方案**（raw 模块与应用共享 THREE 实例），收益 6 个示例，但需要设计。
3. **C 换 Cesium token**（配置项，成本低）。
4. **D 需要单独确认**（是否有真实 GPU 依赖）。
5. **E 显式降级**：把 22 条 `threejs-official` 的空白封面改成占位符，
   比现在「有图但全白」更诚实。
6. **剩余 `graphics`/`mygrapics` 27 条**（`qcharts` 缺 spritejs 插件、`vis-geo-earth`
   与 `data/weather` 数据错误、`pixels/*` canvas 恒 0×0）—— 各自独立的实现问题，
   见 `GL_RENDERER_FIX.md` §6。

> ⚠ 与 UI 折叠（`docs/DEDUP_RESEARCH.md` 的 Phase 2）的冲突：
> 折叠会把「同族的多条」合成一张卡。同族里仍混着**坏掉的**示例（B~E 那 47 条），
> 直接折叠会把缺陷藏起来。**建议先把坏掉的示例显式标记或降级，再折叠。**
