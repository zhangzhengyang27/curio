# 示例中心「相似示例去重」调研报告

> **状态**：只读调研，**未改动任何示例文件、registry 或源码**。
> 调研日期：2026-09-24 ｜ 样本：1417 条 registry 条目（1415 条可见）
> 触发背景：需求方问「1415 个示例能不能缩减些，去掉那些相似的示例」。

---

## 1. 结论摘要

**内容层面几乎没有重复。**「看起来很多相似示例」是三类**假阳性**造成的观感，它们都不是冗余：

| 观感来源 | 规模 | 性质 |
|---|---|---|
| 同名标题 / 重复描述 | 577 条同名、643 条同描述 | 元数据文案撞车，**示例本体不同** |
| WebGL ↔ WebGPU 双后端镜像 | 150 条（75 组同名配对） | 上游 deliberate 的**渲染后端覆盖** |
| 循序渐进的教学课程序列 | 约 80 条同源高相似 | 逐课递进，**代码相近是教学的设计意图** |

**真正可删的只有 17 条**（占 1415 的 1.2%）：`mygrapics` 来源里 17 条是 `graphics` 来源的机械副本。

> **关键判据**：全部 322 个跨来源近重复对，**100% 集中在 `graphics` ↔ `mygrapics` 这一对来源**；
> 其余 10 个来源两两之间**零近重复**。即：不存在「上游示例被重复收录」的系统性问题。

**如果「缩减」的真实目的是减小部署体积，那方向完全不同** —— 删这 17 条只省约 0.4 MB，
而 `public/` 是 1.2 GB。真正吃体积的是三个来源的运行时资产，与条目数无关（见 §5）。

**本次顺带查出一个更值得修的真问题**：**120 条（34 组字节完全相同）封面是无效的占位图**
（最大三组共 49 条已**肉眼核实为纯白/纯黑**；另有 197 条 < 4 KB 属待复核上界），
而 `scripts/verify-thumbnails.mjs` 对此**完全无感** —— 它实测输出「无破图风险」（闸门盲区，见 §6）。

---

## 2. 调研方法（可复现）

全部脚本落在 `/tmp`，只读。

| 阶段 | 做法 | 关键点 |
|---|---|---|
| 清单 | `node --experimental-strip-types` 加载 `src/examples/registry/index.ts` → `getAllExamplesAsync()`，导出「条目 → 组件路径 / 封面路径」TSV | 必须用**异步**版本，同步的 `getAllExamples()` 返回空数组 |
| 组件哈希 | shell `md5 -q` 批量算 1415 个 `.vue` | **坑**：在 Node/Python 里批量 `readFileSync` 上千文件会被环境 SIGTERM 杀掉；改为「Node 只出路径清单 → shell 算哈希」 |
| 源码近重复 | 归一成「非空非注释行集合」→ 长度比剪枝（Jaccard 上界 `min/max`）→ 精确 `len(A & B)` → 并查集聚簇 | 见下方两个**必须避免的假阴性** |
| 封面体检 | URL 解码 + 字节哈希聚类 + 只读 JPEG SOF 段取宽高 | `manifest` 里的封面路径是**相对仓库根的磁盘路径**，且**中文名是 URL 编码的**，必须 `unquote` 后再拼 `ROOT`（拼 `public/` 会得到 `public/public/...`） |
| **肉眼核验** | 按字节大小分层抽样，**逐张打开图片看** | ⚠ **不可省略**。初版仅凭「字节数 < 4 KB」就断定 197 条是空白图，核验后发现**存在合法封面**（见 §6.2）—— 纯代码判据会给出错误的可删清单 |

### 2.1 两个必须避开的假阴性（本次实测踩到）

1. **归一化必须对称**。第一版把别名抹成同一 token 时只处理了 `mygrapics` 一侧：
   `mgContainer` → `X`，而 `gContainer` 原样保留 → **已知的真重复组全部漏检**，
   扫描在 0.55 阈值下只报 3 对（且全是误报），呈现「一切正常」的假绿。
   修正后同一阈值报 2168 对，真重复组全部现形。
   → **验证检测器的办法**：先确认它能召回**已知为真**的那一组，再看它报什么。
2. **`shared` 不能用「稀有行索引」的计数代替**。若只把出现次数 2–25 的行建索引，
   则 `import { ref } from 'vue'` 这类高频公共行只进 `union` 不进 `shared`，
   **Jaccard 被系统性低估**。必须用精确集合交集。

---

## 3. 条目层：真重复 17 条

### 3.1 明细

`mygrapics` 中与 `graphics` 最佳匹配 **Jaccard ≥ 0.85** 的条目，共 **17 条**
（14 组同名 + 3 组异名同代码）：

| # | Jaccard | 关系 | mygrapics 条目 | ↔ graphics 条目 |
|---|---|---|---|---|
| 1 | 0.926 | 同名 | `animate_webgl/bezier-easing` | `animate_webgl/bezier-easing` |
| 2 | 0.920 | 同名 | `repeat-and-random/mandelbrot` | `repeat-and-random/mandelbrot` |
| 3 | 0.911 | 同名 | `repeat-and-random/maze` | `repeat-and-random/maze` |
| 4 | 0.910 | **异名** | `animate_webgl/frame-animate-animate-webgl` | `animate_webgl/frame-animate` |
| 5 | 0.904 | 同名 | `animate_webgl/vertex-rotation` | `animate_webgl/vertex-rotation` |
| 6 | 0.899 | 同名 | `repeat-and-random/grids` | `repeat-and-random/grids` |
| 7 | 0.898 | 同名 | `animate_webgl/cellular-animation` | `animate_webgl/cellular-animation` |
| 8 | 0.898 | **异名** | `animate_webgl/particle-animate-webgl` | `animate_webgl/particle` |
| 9 | 0.895 | 同名 | `animate_webgl/fragment-rotation-animator2` | 同名 |
| 10 | 0.893 | 同名 | `animate_webgl/lerp-easing` | 同名 |
| 11 | 0.892 | **异名** | `animate_webgl/lerp-animate-webgl` | `animate_webgl/lerp` |
| 12 | 0.891 | 同名 | `animate_webgl/vertex-move-easing` | 同名 |
| 13 | 0.885 | 同名 | `animate_webgl/fragment-rotation-animator` | 同名 |
| 14 | 0.882 | 同名 | `animate_webgl/vertex-rotation-animator` | 同名 |
| 15 | 0.881 | 同名 | `repeat-and-random/random2` | `repeat-and-random/random2` |
| 16 | 0.889 | 同名 | `repeat-and-random/random` | `repeat-and-random/random` |
| 17 | 0.880 | 同名 | `animate_webgl/vertex-move-animator` | 同名 |

**阈值不敏感**：区间 `[0.80, 0.85)` **没有任何条目**，17 与「非重复」之间有干净的间隔。

### 3.2 机械改名的证据

逐行 diff 显示差异只有三类，全部是机械替换：

```
- <div class="mygrapics-root" ref="mgContainer">     + <div class="graphics-root" ref="gContainer">
- import { Renderer } from '@/examples/jsm-compat/mygrapics/...'  + .../graphics/...
- async function initMyGrapicsExample()              + async function initGraphicsExample()
-   await loadScript("/mygrapics/common/lib/gl-renderer.js")  + await loadScript("/graphics/common/lib/gl-renderer.js")
```

GLSL 着色器逐字节相同。`graphics` 那份**更新**：多了 `onUnmounted` 清理、
`gfxLoadedScripts` 收集、TS 类型标注（`string` / `any`）。

→ **结论：`graphics` 是现行版本，`mygrapics` 是改名前的旧副本。删除方向应是删 `mygrapics` 这 17 条。**

### 3.3 同源高相似：全是覆盖面，不是冗余

阈值 ≥0.85 的同来源条目分布：

| 来源 | 条目数 | ≥0.85 同源伙伴 | 性质 |
|---|---|---|---|
| `threejs-official` | 587 | 26（4.4%） | WebGL/WebGPU 双后端 + XR 变体 |
| `webgl` | 134 | 36（27%） | **课程序列**（`kaikeba-webgl` / `study-webgl` 逐课递进） |
| `earth-lessons` | 6 | 6（100%） | 同模板不同数据 |
| `cesium-examples` | 77 | 5 | 图层类样板 |
| `three-cesium-examples` | 265 | 4 | 极少 |
| `threejs-lesson` | 29 | 3 | 课程序列 |
| **`three-project`** | **108** | **0** | **完全无同源高相似** |
| `city-realtime-webgl` / `granary-3d` | 2 / 1 | 0 | — |

**最强反例**：`webgl/kaikeba-webgl/05-复合变换/2-先移动后旋转` ↔ `3-先旋转后位移`，
Jaccard = **1.000**（行集合完全相同）。这两条是同一节课的相邻两讲，
「矩阵顺序换一下」正是该课要讲的内容。**删掉任何一条都在破坏教学序列。**

`threejs-official` 的 587 条里有 **75 组 `webgl_X` / `webgpu_X` 同名配对**（150 条，25.6%）。
全局源码扫描显示这些配对相似度**只有 0.555 左右** —— 是真·不同代码（WebGPU 用 TSL / compute shader）。
**删 `webgpu_*` 会一次性砍掉整个 WebGPU 渲染路径。**

---

## 4. 元数据层：最容易被误当成重复，但最不可信

| 信号 | 命中 | 核实后真重复 |
|---|---|---|
| 归一标题完全相同 | 128 组 / **577 条** | 0 |
| 描述完全相同 | 144 组 / **643 条** | 0 |
| 标题 + 分类相同 | 100 组 / 448 条 | 0 |

与既有拍板的数字吻合（`docs/ROADMAP.md:24-26` 记的是 448 条同名标题、499 条重复描述，
本次独立复算为 449 / 499）。**这些数字看着吓人，但示例本体是不同的东西**
—— 例如多个来源都有叫「基础」或「入门」的示例。

> 封面字节相同的 34 组 / 120 条里，也有一批是 `mygrapics` ↔ `graphics` 配对
> （`bezier-easing` / `frame-animate` / `lerp` / `lerp-easing` / `grids` / `mandelbrot` /
> `maze` / `random`）—— 独立佐证了 §3 的结论。

---

## 5. 体积层：删示例条目对体积几乎无影响

```
public/ 合计 1.2 GB
├─ threejs-official    414M   (587 条, 0.71 MB/条)
├─ external-examples   366M   (内含 three-cesium-examples 等)
├─ three-project       365M   (108 条, 3.4 MB/条)
├─ example-thumbs       28M   ← 封面总共只有这么多
├─ graphics             22M
├─ granary-3d           19M   (仅 1 条!)
├─ webgl                16M
└─ data / three-globe-data / mygrapics / textures  ≈ 19M
```

- 删 17 条示例 ≈ **省 0.4 MB**（全是代码，不含重资产）。
- 三个来源占 96%。真正决定体积的是**示例运行时资产**（模型 / 贴图 / 3D 文件）。
- **每来源「资产/条目」**：`earth-lessons` **12.7 MB/条**、`granary-3d` **19 MB/条**（仅 1 条）、
  `three-project` 3.4 MB/条、`threejs-official` 0.71 MB/条、`three-cesium-examples` 0.06 MB/条。
- **性价比最高的体积切口**：`earth-lessons` 6 条 = **76 MB**，且这 6 条互为 ≥0.85 同模板
  （球面边界线 / 铁路线 / 机场 / 新闻热点 / GDP / 陆地网格 —— 同一个地球模板换数据）。
  删 5 条省约 **63 MB**，**比删 17 条代码副本（0.4 MB）高 150 倍**。

---

## 6. 顺带查出的真问题：封面闸门盲区

### 6.1 现状

| 指标 | 数值 | 证据强度 |
|---|---|---|
| 条目总数 | 1415 | — |
| 封面可用 | 1414 | 实测 |
| 封面字段为空 | **1**（`threejs-official/webgpu/particles/webgpu_particles_soft`） | 实测 |
| 封面字节完全相同 | 34 组 / **120 条** | **实测 + 肉眼核实** |
| 其中「共用同一张 < 5 KB 图」 | 22 组 / **96 条** | **实测 + 肉眼核实** |
| 疑似低信息量（< 4 KB） | **197 条（13.9%）** | ⚠ **仅为待复核上界，非缺陷数** |

按来源拆 < 4 KB 的 197 条：`webgl` 65、`cesium-examples` 30、`graphics` 29、
`three-cesium-examples` 26、`mygrapics` 25、`threejs-official` 14、`earth-lessons` 6、`threejs-lesson` 2。

### 6.2 肉眼核验结果（重要 —— 修正了初版推断）

初版用「字节数 < 4 KB」当低信息量判据，**存在明显假阳性**。实际打开图片核验后：

| 样本 | 结果 | 判定 |
|---|---|---|
| `mygrapics/canvas/test`（22 条组，3144 B） | **纯白** | ❌ 无效封面 |
| `cesium-examples/.../autoRotate`（21 条组，3139 B） | **纯白** | ❌ 无效封面 |
| `earth-lessons/.../05-country-borders`（6 条组，3145 B） | **纯白** | ❌ 无效封面 |
| `threejs-official/webgl_loader_texture_pvrtc`（6 条组，400×250） | **纯黑** | ❌ 无效封面 |
| `webgl/kaikeba-webgl/08-glsl-es语言/07-向量运算`（3240 B） | 灰底空矩形（画布未渲染出内容） | ❌ 无效封面 |
| `three-cesium-examples/.../modelAnimates`（1597 B） | 深色场景 + 角色模型 + 坐标轴 | ✅ **合法封面** |
| `webgl/kaikeba-webgl/03-绘制三角形/3-线`（4095 B） | 黑底 + 黄色平行四边形轮廓 | ✅ **合法封面**（正是该 demo 的画面） |

**结论**：三个最大字节组的图（22+21+6 = 49 条）**已确认是纯白/纯黑占位图**；
但 `< 4 KB` 里**确实混有合法封面** —— 黑底 + 单个图形的 demo（如「绘制三角形/线」）
压缩后本就只有 3~4 KB。

→ **因此「197 条」是待复核上界，不是缺陷数。已确证的无效封面是 120 条（34 组字节完全相同）。**
→ **检测判据必须用「同图分组」，不能用字节阈值**（理由见附录 C）。

### 6.3 成因：与初版推测不同

初版推测「`threejs-official` 的空白图是 XR 示例截不了图」。**该推测不成立**：
这组 6 条里包含 `webgl_loader_texture_pvrtc`、`webgpu_video_frame`、`webgpu_volume_fire`
等**非 XR** demo，它们的官方截图同样是纯黑。

更可能的成因（**仍未验证**，需查截图流水线）：

- `threejs-official`：用的是上游官方截图（`public/threejs-official/screenshots/`，
  经 `scripts/download-threejs-screenshots.mjs` 下载），**上游本身就有一部分是空白图**。
- 其余来源（`example-thumbs/`，960×640 自截图）：疑似**截图时画布尚未渲染完成**
  —— 三组纯白图尺寸高度一致（3144 / 3139 / 3145 B）且来自不同来源，像是同一套截图脚本
  在「页面 load 了但 canvas 还没出内容」时截下的。

### 6.4 闸门盲区

`scripts/verify-thumbnails.mjs` 只校验三件事：

1. `thumbnail` 字段非空（空则**仅统计、不失败**，`:41`）
2. 路径以 `/` 开头（`:28`）
3. 解码后文件存在且 `size > 0`（`:35`）

**它不检查图片内容。** 因此**已确证的 120 条无效封面**（连同待复核的其余疑似项）
全部通过闸门，`npm run verify:thumbnails` 当前只报「空 thumbnail 1 条 / 缺失 0 条」，
并在末尾输出 **`[OK] 所有非空 thumbnail 均有对应文件，无破图风险`** —— 实测于 2026-09-24。

→ 这是**静默假通过**类缺陷，与 `docs/KNOWN_PITFALLS.md` 记录的模式一致。

### 6.5 封面口径不统一

- `threejs-official`（586 条）用 `public/threejs-official/screenshots/`（400×250，官方图）
- 其余来源用 `public/example-thumbs/`（960×640，自截图）

同一页面里两种尺寸/风格混排，是视觉层级不统一的一个来源。

---

## 7. 三个方向与既有约束的冲突

### 7.1 三个方向的天花板

| 方向 | 可做量 | 收益 | 代价 |
|---|---|---|---|
| **A. 减条目数** | **17 条**（1.2%） | 省 0.4 MB；消除别名副本 | 需推翻两条拍板；`mygrapics` 整个来源只剩 80 条 |
| **B. 减部署体积** | 见 §5 | `earth-lessons` 删 5 条省 63 MB；`granary-3d` 19 MB/条 | 需先定「归档是否要保留重资产」 |
| **C. 提升内容质量** | **120 条已确证**无效封面（+197 条待复核）+ 闸门补检测 | 直接改善浏览体验；堵住静默假通过 | 需要能截图的环境重跑 |

### 7.2 必须先解决的冲突

1. `docs/ROADMAP.md:24-26`：**「明确仍不做的：批量改写 448 条同名标题、499 条重复描述、
   重做标签体系、收藏/推荐位。」** → 删 17 条**不触碰**这一条（删条目 ≠ 改写文案），
   但「缩减示例数」这个动作本身与该文件第 14–17 行的**「归档模式（只读）」终态定位**相抵。
2. `docs/TECH_ROADMAP.md:415`：**「不改变既有拍板——示例中心仍是只读归档，一个文件都不删
   （PRODUCT_PLAN §6.1）。」** → 这条是**明确禁止删文件**的，删任何示例都需先改它。

**因此：动 17 条之前，需要需求方先明确修订上述两条拍板。** 调研本身不需要。

---

## 8. 解决方案

### 8.0 结论先行：**不要走「删相似示例」这条路**

| 若目标是 | 该做什么 | 不该做什么 |
|---|---|---|
| 让 1415 条**不那么像重复** | **呈现层同族聚合**（§8.2） | 删示例 —— 只能删 17 条，还破坏教学序列 |
| 修**坏掉的浏览体验** | 修 120 条无效封面 + 补闸门（§8.1） | — |
| 减小**部署体积** | 动运行时资产（§8.4） | 删示例条目（删 17 条 = 0.4 MB，占 1.2 GB 的 0.03%） |

**核心判断**：需求方想解决的「相似示例太多」，本质是**呈现问题，不是数据问题**。
1415 条里 98.8% 是有独立价值的覆盖面。**正确解法是把同族折叠起来，而不是删掉它们。**

---

### 8.1 阶段 1：修已确证的缺陷（零拍板冲突，可立即执行）

| 步骤 | 内容 | 验收 |
|---|---|---|
| 1.1 | 探明自截图流水线为何产出纯白图（三组纯白图尺寸高度一致：3144 / 3139 / 3145 B，疑似「页面 load 了但 canvas 未渲染完成」就截图） | 定位到截图脚本里缺「渲染完成」等待的位置 |
| 1.2 | 修 **120 条已确证**无效封面（34 组字节完全相同；其中最大三组 49 条已肉眼核实为纯白/纯黑） | 字节完全相同分组数降为 0 |
| 1.3 | 复核 < 4 KB 的其余疑似项（共 197 条，已发现合法封面混在其中） | 逐张核验，产出「确认无效」清单 |
| 1.4 | `threejs-official` 的空白图**单独处理**：它是**上游官方截图**，本地重跑修不了 | 显式降级为统一占位符，或换图源 |
| 1.5 | 给 `scripts/verify-thumbnails.mjs` 补检测，**判据用「同图字节哈希被 > 5 条共用」**，先以**只告警不失败**上线 | 输出疑似清单，CI 不变红 |
| 1.6 | 修完后把 1.5 收紧成硬失败 | 闸门从「查字段」升级为「查内容」 |
| 1.7 | 统一封面口径（`400×250` vs `960×640` 二选一） | 页面内封面尺寸一致 |

⚠ **1.5 的判据必须是「同图分组」，不能用字节阈值** —— 实测反例见 §6.2 与附录 C。

---

### 8.2 阶段 2：呈现层同族聚合（零拍板冲突，收益最大）

**机制**：不删任何条目，在**默认视图**里把「同一族的多个变体」折叠成一张卡。

#### 8.2.1 可折叠的两类同族（已量化）

| 族类型 | 判定方式 | 规模 | 折叠后省 |
|---|---|---|---|
| **双后端族** | `webgl_X` ↔ `webgpu_X` 同尾名配对（跨分类匹配，需按 id 尾名而非 category） | **75 组 / 150 条** | **75 格** |
| **课程序列族** | 同 (来源, 分类) 内、编号占多数、且**相邻条目源码相似度 ≥ 0.55**（递进式，不是全对相似） | **8 组 / 121 条** | **113 格** |
| **合计** | | | **188 格（13.3%）** |

**默认视图：1415 条 → 约 1227 张卡，一条示例都不删。**

课程序列族的 8 组（全部是 `kaikeba-webgl` / `study-webgl` / `earth-lessons`）：

```
36 条  webgl/kaikeba-webgl/08-glsl-es语言
18 条  webgl/kaikeba-webgl/06-颜色与纹理
16 条  webgl/kaikeba-webgl/03-绘制三角形
15 条  webgl/study-webgl/3-三维世界与光照
12 条  webgl/kaikeba-webgl/02-js与着色器间的数据传输
12 条  webgl/kaikeba-webgl/05-复合变换
 6 条  webgl/kaikeba-webgl/04-矩阵变换
 6 条  earth-lessons/earth-lessons
```

⚠ **判定课程序列必须用「相邻相似度」，不能用「编号」。** 反例：
`three-project/base` 的 `1-Home … 24-Helpers` 也是编号命名，但它是 **24 个互不相关的独立 demo**
（`three-project` 的同源高相似条目数为 **0**），折叠它会掩盖内容，是错的。

#### 8.2.2 实现要点

1. **预计算，不在运行时算。** 复用改版时已建立的预计算模式
   （`techs[]` / `subs[]` / `haystack` 在注册表落地时一次算好，运行时只做 `includes`），
   新增 `family: { key: string, role: 'webgl' | 'webgpu' | 'lesson', index: number }`。
   折叠关系一旦算好就是静态数据，运行时零成本。
2. **双后端族 → 卡片内切换**。一张卡 + 「WebGL / WebGPU」分段控件（默认 WebGL），
   切换时换缩略图与标题后缀。这比并列两张几乎同名的卡清楚得多。
3. **课程序列族 → 课程卡 + 展开**。一张「课程卡」带「36 讲」徽标，
   点击进入课程视图（按编号列出各讲）。**不要**把 36 讲压成一张卡就完事 ——
   那会让用户找不到具体某一讲。
4. **搜索时不折叠。** 用户主动搜索时应当看到**全部**匹配项，
   折叠只作用于「浏览」路径。这是避免「搜不到」类缺陷的关键。
5. **加一个「显示全部变体」开关**（默认折叠）。折叠是**呈现决策**，
   必须可逆、可关闭 —— 这样它不构成对「只读归档」终态的实质改动。
6. **折叠要在计数里如实体现**。侧栏分面计数、工具条「共 N 条」都要说明
   「N 条 / M 张卡」，否则用户会以为丢数据。

#### 8.2.3 与既有拍板的关系

**不删任何文件、不改任何 registry 条目、不接新源** —— 只改 `ExampleGallery` 的渲染与
`useGalleryFilters` 的聚合逻辑，属于**纯呈现层改动**，与
`docs/ROADMAP.md` 的「只读归档」终态**不冲突**。

---

### 8.3 阶段 3：数据层清理（**需先修订拍板**）

只做一件事：删 `mygrapics` 里 17 条 `graphics` 的机械副本。完整 runbook 见**附录 B**。

**前置**：先修订 `docs/ROADMAP.md:24-26` 与 `docs/TECH_ROADMAP.md:415`（「一个文件都不删」）。

**收益**：省约 0.4 MB。**这不是体积优化**，价值是消除别名副本
——让同一份代码不再有两个入口。

**明确不要碰**（它们是覆盖面，不是冗余）：
- `webgl` 的 `kaikeba-webgl` / `study-webgl` 课程序列
- `threejs-official` 的 `webgpu_*` 镜像（源码相似度仅 ~0.555，是不同实现）
- `earth-lessons` 的 6 条数据变体

---

### 8.4 体积议题（与去重无关，需单独决策）

若「缩减」的真实诉求是**部署体积**，那它和本报告是两件事：

| 动作 | 收益 | 代价 |
|---|---|---|
| 删 17 条示例 | 0.4 MB | 需先改两条拍板 |
| 删 `earth-lessons` 5 条 | **63 MB** | 失去 6 个地球数据可视化示例 |
| 处理 `granary-3d`（1 条 19 MB） | 19 MB | 失去该示例 |
| 砍 `three-project` 重资产 | 最多 365 MB | 失去 108 个示例的运行时资源 |
| 只保 `data` + `textures` 两个 public 子目录 | 平台侧省约 1.1 GB | 需先物理拆包（见 `docs/TECH_ROADMAP.md` 方案 B） |

**决策前提**：先回答「归档模式要不要保留重资产」。这个问题不回答，体积议题无法推进。

---

### 8.5 决策表（给你直接选）

| 你的真实目标 | 执行 | 前置条件 | 预期效果 |
|---|---|---|---|
| **A. 让示例库不那么像重复** | **§8.2 同族聚合** | 无 | 默认视图 1415 → ~1227 张卡 |
| **B. 修坏掉的封面** | **§8.1** | 无 | 120 条已确证无效封面清零 + 闸门能拦住回归 |
| **C. 真正删掉重复条目** | §8.3 | 需改两条拍板 | 删 17 条，省 0.4 MB |
| **D. 减部署体积** | §8.4 | 需先定「是否保留重资产」 | 63 MB ~ 1.1 GB |

**推荐顺序：B → A → （体积决策）→ C。**
B 和 A 零冲突、收益最大；C 收益最小且阻力最大，放最后。


---

## 附录 A：调研脚本清单（均在 `/tmp`，只读）

| 脚本 | 作用 |
|---|---|
| `manifest.mjs` | 导出「条目 → 组件路径 / 封面路径」TSV |
| `dup2.py` | 全局源码近重复扫描 v2（对称归一化 + 精确 Jaccard） |
| `dup3.py` | 按「来源关系 + 目录关系」分类近重复对 |
| `thumb-health.py` | 封面健康度体检（URL 解码 + 字节聚类 + JPEG 尺寸） |

> 重跑前先跑 `dup2.py` 会重建 `/tmp/line-sets.json` 缓存（读 1415 个文件约 3.5 分钟）；
> 缓存命中时 `dup2.py` / `dup3.py` 秒级完成。

---

## 附录 B：17 条真重复的删除 runbook

> ⚠ **前置条件**：先修订 §7.2 的两条拍板（`docs/ROADMAP.md:24-26`、`docs/TECH_ROADMAP.md:415`）。
> 未修订前**不要执行**。执行前确认工作树干净（`git status`）。

> ✅ **已执行（2026-09-27）**：前置拍板修订见 `docs/ROADMAP.md` §0（commit `1a5ca0c8`），
> 删除执行为 commit `3c92a0a6`。实测与 B.4 一致：registry 合计 1417 → 1400、可见 1415 → 1398、
> mygrapics 97 → 80、`verify:registry` 全绿。两处与本文差异：
> ① B.2 第 3 步**并非空操作**——`_thumb_map.json` 是 509 行的列表（含 17 行 mygrapics 映射）需同步删除；
> ② `mygrapicsExamples.ts` 条目分隔行风格不均匀（分类内有「4 空格行」、跨分类无），块删除后需收敛堆叠空白行、
> 并把「跨分类新邻接」还原为无分隔风格。

### B.1 落点清单

组件文件名 = `PascalCase(id)Example.vue`（见 `AGENTS.md` R3），17 条全部落在 2 个目录：

| # | id | category | registry 行号 | 组件文件 | 缩略图 |
|---|---|---|---|---|---|
| 1 | `bezier-easing` | `animate_webgl` | 196 | `BezierEasingExample.vue` | `bezier-easing.jpg` |
| 2 | `cellular-animation` | `animate_webgl` | 210 | `CellularAnimationExample.vue` | `cellular-animation.jpg` |
| 3 | `fragment-rotation-animator` | `animate_webgl` | 224 | `FragmentRotationAnimatorExample.vue` | `fragment-rotation-animator.jpg` |
| 4 | `fragment-rotation-animator2` | `animate_webgl` | 238 | `FragmentRotationAnimator2Example.vue` | `fragment-rotation-animator2.jpg` |
| 5 | `frame-animate-animate-webgl` | `animate_webgl` | 252 | `FrameAnimateAnimateWebglExample.vue` | `frame-animate-animate-webgl.jpg` |
| 6 | `lerp-animate-webgl` | `animate_webgl` | 266 | `LerpAnimateWebglExample.vue` | `lerp-animate-webgl.jpg` |
| 7 | `lerp-easing` | `animate_webgl` | 280 | `LerpEasingExample.vue` | `lerp-easing.jpg` |
| 8 | `particle-animate-webgl` | `animate_webgl` | 294 | `ParticleAnimateWebglExample.vue` | `particle-animate-webgl.jpg` |
| 9 | `vertex-move-animator` | `animate_webgl` | 308 | `VertexMoveAnimatorExample.vue` | `vertex-move-animator.jpg` |
| 10 | `vertex-move-easing` | `animate_webgl` | 322 | `VertexMoveEasingExample.vue` | `vertex-move-easing.jpg` |
| 11 | `vertex-rotation` | `animate_webgl` | 336 | `VertexRotationExample.vue` | `vertex-rotation.jpg` |
| 12 | `vertex-rotation-animator` | `animate_webgl` | 350 | `VertexRotationAnimatorExample.vue` | `vertex-rotation-animator.jpg` |
| 13 | `grids` | `repeat-and-random` | 971 | `GridsExample.vue` | `grids.jpg` |
| 14 | `mandelbrot` | `repeat-and-random` | 985 | `MandelbrotExample.vue` | `mandelbrot.jpg` |
| 15 | `maze` | `repeat-and-random` | 999 | `MazeExample.vue` | `maze.jpg` |
| 16 | `random` | `repeat-and-random` | 1013 | `RandomExample.vue` | `random.jpg` |
| 17 | `random2` | `repeat-and-random` | 1027 | `Random2Example.vue` | `random2.jpg` |

路径前缀：
- 组件 `src/examples/components/mygrapics/<category>/<PascalCase>Example.vue`
- 缩略图 `public/example-thumbs/mygrapics/<category>/<id>.jpg`
- registry：`src/examples/registry/mygrapicsExamples.ts`（行号基于 2026-09-24 的 HEAD）

**受影响的 `graphics` 侧条目全部保留**，不动。

### B.2 执行顺序（严格按 `AGENTS.md` R8）

```bash
# 1. 删组件源文件（17 个）
git rm src/examples/components/mygrapics/animate_webgl/{BezierEasing,CellularAnimation,\
FragmentRotationAnimator,FragmentRotationAnimator2,FrameAnimateAnimateWebgl,LerpAnimateWebgl,\
LerpEasing,ParticleAnimateWebgl,VertexMoveAnimator,VertexMoveEasing,VertexRotation,\
VertexRotationAnimator}Example.vue
git rm src/examples/components/mygrapics/repeat-and-random/{Grids,Mandelbrot,Maze,Random,Random2}Example.vue

# 2. 手工删 registry 里的 17 个条目（从大行号往小删，避免行号漂移）
#    文件：src/examples/registry/mygrapicsExamples.ts
#    每个条目是 { ... } 一整块，注意同时删掉它前面的空行

# 3. 清 scripts/_thumb_map.json 里对应的 17 条映射（source=mygrapics）
# 4. 删 17 张缩略图
git rm public/example-thumbs/mygrapics/animate_webgl/{bezier-easing,cellular-animation,\
fragment-rotation-animator,fragment-rotation-animator2,frame-animate-animate-webgl,\
lerp-animate-webgl,lerp-easing,particle-animate-webgl,vertex-move-animator,vertex-move-easing,\
vertex-rotation,vertex-rotation-animator}.jpg
git rm public/example-thumbs/mygrapics/repeat-and-random/{grids,mandelbrot,maze,random,random2}.jpg

# 5. 跑闸门
npm run verify && npm run typecheck && npm run lint:ci
```

### B.3 本条的三个特殊之处（与普通删示例不同）

1. **不需要改生成器。** `mygrapicsExamples.ts` **不在** `verify:drift` 的保护范围内
   —— `verify:drift` 只 `--check` 三个生成器：`generate-registry.js`（覆盖
   `threeCesiumExamples` / `cesiumExamples`）、`generate-threejs-lesson-registry.js`、
   `generate-earth-lessons-registry.js`。所以 `AGENTS.md` R1 对这 4 个文件的铁律**不适用于此**，
   手工编辑该文件不会被漂移闸门拦下。
2. **不会被重跑复活。** `scripts/improve-example-meta.mjs:353` 是遍历**现有 registry 条目**
   （`for (const ex of data.examples)`）来重写 title/description/tags，
   不是扫盘重建 —— 手工删掉的条目不会被它加回来。
   （但它受 `registry-guard` 保护，需 `--dry-run` 再 `--force`。）
3. **不要重跑 `scripts/legacy/convert-mygrapics-examples.cjs`**。它是该 registry 的原始生成器；
   只要组件源文件已删，重跑理论上也会产出正确结果，但它是 **legacy 一次性脚本**，
   且不保证与现有文件的字段顺序/空行一致 —— 徒增风险，没有收益。

### B.4 验证标准

- `npm run verify` 7 项全绿（`verify:registry` 会校验「registry 引用的组件存在」）
- 示例总数从 **1417 降到 1400**（可见数 1415 → 1398）
- `mygrapics` 来源从 97 条降到 80 条
- 页面实测：`/examples?src=mygrapics` 无白屏卡片，17 条对应条目消失

### B.5 预期收益

省 **约 0.4 MB**（纯代码 + 17 张 3~37 KB 的缩略图）。
**这不是一个体积优化**，它的价值是**消除别名副本、让 `mygrapics` 与 `graphics` 不再有
同一份代码的两个入口**。若目标是减体积，见 §5 —— 收益差 150 倍。

---

## 附录 C：无效封面的复现与修复建议

复现（只读，不写任何文件）：

```bash
# 用 /tmp/thumb-health.py，或按下面逻辑自查：
#   1. 从 registry 取 thumbnail 字段
#   2. decodeURIComponent 后拼仓库根（不是 public/）
#   3. 按字节哈希分组 → 找「多条目共用同一张图」
#   4. 再按字节大小排序做二次筛选
```

**当前结果**：34 组 / **120 条**字节完全相同（已确证无效）；其中 22 组 / 96 条共用一张 < 5 KB 的图。
另有 < 4 KB 的 **197 条**属**待复核上界**，其中已发现合法封面（见 §6.2 的核验表）。

### C.1 判据选择（**这是本节的关键**）

| 判据 | 评价 |
|---|---|
| **同图字节哈希被 > 5 条共用** | ✅ **推荐**。真实截图不可能几十个互不相关的示例完全同字节。零假阳性。 |
| 绝对字节下限 `< 2 KB` | ⚠ 可作辅助（当前仅 1 条），但覆盖面小。 |
| 字节阈值 `< 4 KB` | ❌ **不可用**。已实测到假阳性：`webgl/kaikeba-webgl/03-绘制三角形/3-线`（4095 B）是**合法封面** —— 黑底 + 一个黄色平行四边形轮廓，正是该 demo 的画面，压缩后本就只有 4 KB。 |

→ 用 `< 4 KB` 当硬失败会**逼出无意义的改动**（把正确的封面改成"更丰富"的错误封面）。
**同图分组上限**才是高置信、零假阳性的判据。

### C.2 上线方式

**建议先以「只告警不失败」上线**（参考仓库既有的 `audit:deps` / `audit-console.mjs`
「只输出线索、不改文件」模式），把已确证的 120 条修完后再收紧成硬失败 ——
否则 CI 会立刻变红，而修复又依赖能跑截图的环境。

### C.3 修复优先级

按来源修封面时的优先级：`webgl` 65、`cesium-examples` 30、`graphics` 29、
`three-cesium-examples` 26、`mygrapics` 25、`threejs-official` 14、`earth-lessons` 6、`threejs-lesson` 2。

⚠ **`threejs-official` 的空白图要单独处理**：它用的是**上游官方截图**
（`public/threejs-official/screenshots/`），空白是上游自带的，
**本地重跑截图脚本无法修复** —— 只能显式降级为统一占位符样式，或换图源。
（初版报告曾把成因归为「XR 截不了图」，**已证伪**：该组含非 XR demo，见 §6.3。）

