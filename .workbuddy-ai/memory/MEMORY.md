# 项目长期约定（earth-app / TerraVista 3D）

## registry（示例注册表）铁律

- **格式归生成器所有**：`threeCesiumExamples` / `cesiumExamples` / `threejsLesson` /
  `earthLessons` 这 4 个文件的字段顺序、空行、文案由生成器决定。**不要手工调格式**，
  要改就改生成器再重跑；`npm run verify:drift`（CI 同款）会做逐字节比对并拦下。
- **判断漂移用 `--check`，不要用 `--dry-run`**：`--dry-run` 只统计行数/条目数/缩略图数，
  只换字段顺序或只改文案时它会显示 `0 / 0 / 0` 假绿。`--check` 才是逐字节比对。
- `patch-registry-thumbs.mjs` 必须**就地更新** thumbnail，绝不挪动字段位置，
  否则每次跑完都产生一次漂移（历史上它就是漂移源头）。
- 生成器只登记**已有 Vue 组件**的条目（与 `verify-registry` 共用
  `scripts/lib/example-component.mjs`）。有源文件、无组件的示例会被跳过并列出，
  不会静默丢失。
- 重跑任何写 registry 的脚本前必须 `--dry-run`；确认后 `--force`。

## E2E 必踩的坑

- **dev 与 preview 都要跑**。dev 模式首页渲染慢，会让「选择器歧义」这类缺陷侥幸
  通过；生产产物下必然暴露。曾因此漏掉 `.search-input` 命中 2 个元素的问题。
- 首页有两个 `.search-input`：顶栏 `.nav-search .search-input` 和首页地球的
  `components/SearchBox.vue`。断言顶栏时**必须**带 `.nav-search` 限定。
- 判断「首页是否预载了 registry」时，正则要**排除 `registry/index.js`**（barrel，
  静态导入属正常），只匹配 11 个数据分块。

## 验证重构等价性的套路

改 `ExampleGallery` 这类「过滤/聚合」逻辑时，别只靠肉眼看 diff：写个临时脚本直接
对**真实 registry 数据**跑「旧逻辑 vs 新逻辑」，并且**比对命中集合**而不只是数量
（数量碰巧相同会掩盖错配）。技术分桶、子分类计数、关键词命中集合三层都该比。

## 改完要跑的闸门

`npm run verify`（= 凭据扫描 → 注册表一致性 → **漂移检测** → 封面完整性 → three 兼容层
→ **图形渲染器生成物** → 主题令牌/对比度，**共 7 项**），
另外 `npm run typecheck`（全量 vue-tsc，当前 0 error）与 `npm run lint:ci`。
涉及 vite 分包 / env 注入 / 产物形态时，还要跑 `E2E_TARGET=preview npm run test:e2e`。
⚠ **跑 typecheck 时不要并发跑其它重负载任务**。本机实测：同一份代码，
无并发时 **1m24s / exit=0**；同时跑 eslint 时 **17m43s / 报 TS6053「文件不存在」**
（而该文件确实存在、可读、git 无改动、窄范围 `-p` 单独检查也 0 错）。
**这是负载导致的假错**，不是真缺陷 —— 但极易被误判成「改动引入了类型错误」。
→ 判断方法：把改动 `git stash` 后重跑对比，或先确认那个文件真的存在；
→ 最省事的做法：**独占机器重跑一次**。

## agent 入口

根目录 **`AGENTS.md`** 是面向 AI 代理的入口文档（2026-09-12 新增），含 9 条铁律、
7 项闸门、本机环境坑与文档地图（15 行）。**改动本仓库前先读它**。

## 文档漂移：改了机制要回头改描述

本仓库文档大量**复述**代码事实（校验项数 / 分包机制 / 文件数 / 示例条数），
改了代码它们不会自动更新。已发生过一次：`verify:drift` 并入 `npm run verify` 后，
`README` / `ROADMAP` / CI 注释里的「三项校验」集体滞后（2026-09-12 已修）。
规矩：改完 `grep -rn` 一下涉及的**数字与机制名**，命中 `README` / `docs/` /
`.github/workflows/ci.yml` 注释就一起改。**结构性描述滞后比数字过时更危险。**

## 产物体积与示例组件的引用机制（2026-09-23 实测）

- 1436 个示例组件**只通过一处** `import.meta.glob` 被引用：
  `src/examples/components/index.ts:20`（组件）与 `:42`（`?raw` 源码）。
  全仓唯一消费者是 `ExampleDemo.vue:93`（懒加载路由）。
  → glob 是静态的**摇不掉**；但只要让 `/examples/:source/*` 路由不存在，
  整条链（2683 个 chunk / 20 MB）就会消失。**部署拆分的最小切口是路由表，不是删文件。**
- `dist` 1.4 GB 里的 1.1 GB **不是** `copy-example-deps.js` 拷的（那只拷 81 MB 的
  `dist/node_modules`），而是 Vite `publicDir` 整目录原样拷贝。
  平台真正需要的 public 子目录只有 `data`(12M) + `textures`(1.9M)。
- **隐藏硬耦合**：平台首页（Three.js 那套）依赖 `src/examples/three-build-compat` 与
  `jsm-compat`（`vite.config.ts:26-36` 全局重定向 three）。
  → `src/examples/` **不能**整体从平台构建移除；想物理拆包必须先搬这两个目录。

## 状态提醒

- 仓库**没有 remote**，所有提交只在本机磁盘（ROADMAP P0 未做）。
- **需求方 2026-09-23 拍板：暂时不要裁剪项目。** 完整规划见
  `docs/PRODUCT_PLAN.md`（产品侧）与 `docs/TECH_ROADMAP.md`（工程侧）。
- ⚠ 由此遗留的矛盾：不裁剪 → 产物仍 ~1.4 GB → 免费托管上不去 → 「可分享链接」不可达。
  下次接手先挑明这层。
- ⚠ `dist/index.html:12` 曾嵌百度 AK 明文（`dist` 被 gitignore 未入库，但上传即公开）。
  **轮换凭据后必须删掉并重建 `dist/`**，不能上传旧产物。
- `dist/` 当前是**陈旧产物**（源码有 `/bmap` 按需注入逻辑，产物里没有），
  所以 `du -sh dist = 1.4 GB` 不能当基线，体积结论必须用新构建校准。

## 示例去重调研结论（2026-09-24，报告在 `docs/DEDUP_RESEARCH.md`）

- **内容层几乎无重复**。1415 可见条目里**真重复只有 17 条**：`mygrapics` 中
  与 `graphics` 最佳匹配 Jaccard ≥0.85 的条目（14 组同名 + 3 组异名同代码）。
  区间 `[0.80,0.85)` 无条目 → 阈值不敏感。**删 mygrapics 侧**（graphics 是更新版）。
- **跨来源重复只有 `graphics`↔`mygrapics` 一对来源**：322 个跨来源近重复对 100% 落在这一对；
  其余 10 个来源两两之间**零近重复**。不存在上游重复收录。
- 「看起来很多相似」= 三类假阳性：元数据撞车（577 条同名 / 643 条同描述）、
  **WebGL↔WebGPU 双后端镜像**（threejs-official 75 组同名配对 / 150 条，源码相似仅 ~0.555）、
  **教学课程序列**（`webgl` 课程序列极端例 Jaccard = **1.000**，相邻两讲）。
  这些是覆盖面，**不要删**。`three-project` 108 条同源高相似为 **0**。
- **体积与条目数无关**：删 17 条代码副本 ≈ 0.4 MB；删 `earth-lessons` 5 条 ≈ 63 MB（差 150 倍）。
  `public/` 1.2 GB，三来源占 96%；`example-thumbs` 仅 28M。
- ⚠ **封面闸门盲区**：`scripts/verify-thumbnails.mjs` 只查「字段空 / 文件不存在 / size=0」，
  **不查图片内容**，实测输出「[OK] 无破图风险」。**已确证无效封面 120 条**
  （34 组字节完全相同，最大三组 49 条已**肉眼核实为纯白/纯黑**）；
  另有 <4KB 的 197 条属**待复核上界，不是缺陷数**（已发现合法封面，见下条）。这是最值得修的项。
- ⚠ **封面判据必须用「同图字节哈希被 >N 条共用」，不能用字节阈值**。
  实测假阳性：`webgl/kaikeba-webgl/03-绘制三角形/3-线`（4095 B）是**合法封面**
  —— 黑底 + 黄色平行四边形轮廓，正是该 demo 画面，压缩后本就 4 KB。
  用 `<4KB` 当硬失败会逼出「把正确封面改成错误封面」的改动。
- ⚠ **`threejs-official` 的空白封面修不了**：它用**上游官方截图**
  （`public/threejs-official/screenshots/`，经 `download-threejs-screenshots.mjs` 下载），
  空白是上游自带的 → 只能换图源或显式降级占位符。
  （初版曾推测成因是「XR 截不了图」，**已证伪**：该组含非 XR 的 `webgl_loader_texture_pvrtc`。）

- ⚠ 动任何删除前需先改两条拍板：`docs/ROADMAP.md:24-26`（归档只读、不做批量整改）与
  `docs/TECH_ROADMAP.md:415`（**「一个文件都不删」**）。

### 解决方案定调（2026-09-24，报告 §8）

- **「相似示例太多」是呈现问题，不是数据问题。** 正确解法是**同族折叠**，不是删条目。
- 可折叠两类：**双后端族** `webgl_X`↔`webgpu_X` 75 组（跨分类按 id 尾名匹配）；
  **课程序列族** 8 组 121 条（`kaikeba-webgl` / `study-webgl` / `earth-lessons`）。
  合计省 **188 格 → 默认视图 1415 条变约 1227 张卡，一条不删**。
- ⚠ **判定同族必须用「源码相似度」，不能用「编号」**：`three-project/base` 的
  `1-Home…24-Helpers` 是 24 个独立 demo（该来源同源高相似 = 0），按编号折会掩盖内容。
  课程序列要用**相邻链**相似度，不能用全对相似（否则漏掉 36 讲的 `08-glsl-es语言`）。
- 折叠实现：预计算 `family` 字段（复用 `techs[]`/`subs[]`/`haystack` 模式）；
  **搜索时不折叠**；提供「显示全部变体」开关（必须可逆）。纯呈现层 → 不冲突只读归档终态。
- 推荐顺序：**修封面 → 同族折叠 → 体积决策 → 删 17 条**。


### 近重复检测的通用坑（写这类脚本必踩）

1. **归一化必须对称**：只抹一侧别名（`mgContainer`→`X` 而 `gContainer` 保留）会让
   **已知真重复组全部漏检**，低阈值下只报误报，呈「一切正常」假绿。
   → **先验证检测器能召回已知为真的那一组，再看它报什么。**
2. **`shared` 不能用「稀有行索引」计数代替**：高频公共行只进 union 不进 shared，
   Jaccard 被系统性低估。必须 `len(A & B)`。
3. 批量文件 IO：Node/Python 里 `readFileSync` 上千文件会被环境 SIGTERM 杀掉。
   改为「只出路径清单 → shell `md5 -q` 算哈希」。
4. registry 路径清单第 6 列是**相对仓库根的磁盘路径**且中文名**是 URL 编码的**，
   必须 `unquote` 后再拼 `ROOT`（拼 `public/` 会得 `public/public/...`）。

## 封面截图流水线（`scripts/screenshot-examples.mjs`）铁律

- **成功判据必须是「画面有内容」**，绝不能用文件字节数：纯白 960×640 JPEG 就有 ~3.1KB。
  历史事故：判据是 `size > 500` → 509 条 `_thumb_map.json` 全绿、空白封面永不重试。
  现用 `全画幅方差 > 5` **或** `非主色像素占比 ≥ 0.0001`。
- **探针必须覆盖整幅**：只截左上角一小块会漏掉画在正中的内容。
- **就绪判据不能用固定 timeout**；也不能用 `canvas.width` 属性（Cesium 停在默认 300×150 也会通过）。
- **构图修正只能用 `transform: scale()`**，不能改 canvas 的 `width`/`height` ——
  改布局尺寸会让「只绘制一次」的 demo 重分配缓冲区后不再重绘，**整幅变全黑**。
- 必须用 `getAllExamplesAsync()`（同步版在懒加载 registry 下恒返回 `[]`，脚本静默空转）。
- 隐藏页面 chrome 的选择器是 `.demo-float-meta`（Teleport 到 body），不是 `.app-nav`。

## 封面闸门（`scripts/verify-thumbnails.mjs`）阈值

- 判据用「同图字节哈希被 >N 条共用」，`N = 5`。**不要下调**：2~5 条的组里大量是合法同图
  （教学课程序列相邻两讲画面本就相同、threejs-official 的 WebGL/WebGPU 双后端对）。
- **不要用「字节数 < 4KB」当硬失败**（`03-绘制三角形/3-线` 4095 B 是合法封面）。

## 示例渲染缺陷（2026-09-24 查明；**最大那条已修**）

- ✅ **已修：`graphics/*` + `mygrapics/*` 共 84 个组件调用不存在的 API**
  （`renderer.compileSync()` / `useProgram()` / `setMeshData()`）。根因：它们用的是
  **课程自研渲染器**，但导入的 `jsm-compat/*/common/lib/ogl/core/Renderer.js` 是**原版 OGL 的**。
  真正实现一直在 `public/*/common/lib/gl-renderer.js`（webpack UMD，两处字节相同），
  **因示例早已转成 Vue 组件（`IframeRunner` 从未被使用）而从未被加载**。
  修法：剥壳转 ESM（生成物 `src/examples/jsm-compat/gl-renderer.esm.js`），
  原 OGL Renderer 另存 `core/OglRenderer.js`，`core/Renderer.js` 改为转发
  —— **84 个组件零改动**。完整报告 `docs/GL_RENDERER_FIX.md`。
  **改 `public/*/common/lib/gl-renderer.js` 后必须重跑 `scripts/generate-gl-renderer-esm.mjs`**
  （`npm run verify:gl-renderer` 会拦漂移）。
- ⚠ **两组组件的导入路径不同，别搞混**：课程组（84 个）**直连** `core/Renderer.js`；
  OGL 组（`lights/*`、`3d-model/*`）走 **barrel** `ogl/index.mjs`。分叉点就在这两处。
- ⚠ **UMD 不能直接 import**：靠 `root["GlRenderer"] = factory()` 挂 window，
  ESM 作用域里 `this` 是 `undefined`。
- **未修** `earth-lessons/*`（6 条）：`public/external-examples/**/*.js` 原样服务 + 无 import map
  → 裸 `three` 说明符解析失败。加 import map 可修模块解析，但会引入**两个 THREE 实例**，
  使 `useEarthLessonsBaseUrl.ts` 的原型补丁失效（球体无贴图）。
- **未修** Cesium Ion `assets/1/endpoint` 返回 **401**（token 失效）。
- 其余 27 条（`qcharts` 缺 spritejs 插件 / `vis-geo-earth` 与 `data/weather` 数据错误 /
  `pixels/*` canvas 恒 0×0）各自独立，见 `docs/GL_RENDERER_FIX.md` §6。
- 排查证据：**`docs/THUMBNAIL_ROOT_CAUSE.md`**（封面空白根因）。

## ⚠ 本机：Playwright 启系统 Chrome 需提权

沙箱会拦 Chrome 写 `~/Library/Application Support/Google/**` 与 Gatekeeper 的
`code_sign_clone` 临时目录。被拦时页面拿不到 localhost → 截图全是纯色 + `variance=0`，
**看起来像代码 bug，实际是沙箱**。先看 stderr 有没有「命令被沙箱拦截」。
后台运行拿不到提权批准 → 需要提权的长任务用**前台 + 大 timeout**。

