# 已知坑点与不可逆操作

> **动手前必读。** 以下每一条都是历史上真实发生过、并且造成过误判或返工的问题。
> 原先是散落在开发会话记忆里的，现沉淀到仓库，避免「只有一个人知道」。

---

## A. 会造成误判的「静默假通过」

### A1. 注册表懒加载：同步取值会返回空数组

**现象**：写脚本校验示例数据，输出「总示例: 0 / 无问题」，看起来全绿，其实一条都没检查。

**根因**：`src/examples/registry/index.js` 已改为按 source 懒加载，
`getAllExamples()` 只读缓存，未加载时返回 `[]`。

**正确做法**：脚本中一律使用 `await getAllExamplesAsync()`（或先 `await loadAllRegistries()`）。

**已加固**：`verify-thumbnails.mjs` 曾因此静默失效，现已修复；`verify-registry.mjs` 额外增加了
「总数不得为 0」的兜底断言。

### A2. 校验脚本必须能被 CI 真正执行

**现象**：`playwright.config.js` 的 `testDir` 指向 `tests/`，但 `.gitignore` 里
`verify-examples.mjs` / `check-*.mjs` / `test-*.py` 缺少前导 `/`，会匹配任意层级，
把整个 `tests/` 目录与 `scripts/check-secrets.mjs` 一并忽略 —— 结果是「配置存在、用例为 0」。

**正确做法**：忽略一次性脚本时必须用 `/` 锚定仓库根目录；新增校验脚本后，
本地执行一次确认退出码符合预期，并确认 `git check-ignore -v <path>` 没有命中。

### A3. 封面截图黑屏会被当成成功

**现象**：`areaMap.jpg` 只有 3 KB 纯黑，却被判定截图成功。

**根因**：脚本按文件大小阈值（>500B）判断成功，均匀黑 JPEG 也会超过阈值。

**正确做法**：对依赖异步数据构建几何体的示例，截图前等待 `networkidle` 并做
「非纯色/亮度方差」校验。参考 `scripts/screenshot-examples.mjs` 的 CDP 截图方案。

### A4. 多源 `watch([ref, ref, refArray])` 不会跟踪数组的原地变更

**现象**（2026-09-20 实测）：`/analysis` 勾选「对比」后对比表正常更新，地图高亮色却不动；
取消勾选同样不动。只有点「清空对比」才生效。无任何报错。

**根因**：Vue 的多源 watch 对每个源只做 `s.value`，**不做 traverse**；
而 `toggleCompare` 用 `push`/`splice` 原地改数组 → 依赖没被收集，回调永不触发。
「清空对比」之所以有效，是因为它写的是 `compare.value = []`（整值替换）。

最小复现（可直接跑）：
```js
const compare = ref([]); let n = 0
watch([year, compare], () => n++)
compare.value.push('x')   // → n 仍是 0
compare.value = ['y']     // → n 变 1
```

**正确做法**：把「能代表变更的标量」作为源，例如 `() => compare.value.length`；
或改成整值替换。深响应 `{ deep: true }` 也能修，但会为整个数组建代理、代价更大。

**顺带的测试教训**：这个缺陷存活了很久，因为已有用例断言的是**对比表**
（模板直接 `v-for compare`，天然生效），而不是地图。断言必须打在真正受影响的那一侧——
地图状态可从 `?debug=1` 暴露的 `window.__tvMapDebug` 读 Cesium 实体的 `material`。

### A5. 改 `playwright.config` 的 `expect.timeout` 可能是空转

**现象**（2026-09-20）：把全局 `expect.timeout` 从 15s 提到 30s 后，全量 E2E 依旧红，
错误信息里仍写着 `Timeout: 15000ms`。

**根因**：`tests/` 里有 32 处把 `{ timeout: 15_000 }` **显式写死**在断言上，
显式值优先于全局配置 —— 改配置对这些断言完全无效。

**正确做法**：调预算要么删掉 spec 内的字面量、让全局值成为单一来源（已如此处理，
仅保留刻意更紧的 `10_000`），要么就逐条改字面量；**改完必须看错误里的
`Timeout: NNNNms` 确认新值真的生效了**。

**另一半原因**：本地 `workers: 2`、CI `workers: 1`。四平台页每条用例都整页冷启动
（实测 dev 下 `/workbench` 到 `.panel-left` 可见 11.5~18.3s，空载单机），
两个 worker 互抢 CPU 时成倍放大 —— 于是一批用例只在本地红、CI 绿。

**收敛后的规则**：
- 断言级 `expect.timeout` 与操作级 `use.actionTimeout` 各 30s（二者互不替代：
  `locator.waitFor()`/`.evaluate()`/`.click()` 走的是 `actionTimeout`，只调 `expect` 会
  在另一个地方继续超时）；
- 重画布交互的 spec 用 `test.describe.configure({ mode: 'serial' })` 消除互抢；
- 用例级预算**定点放宽**，两类需要放：① 含 ≥2 次整页加载（`goto`/`reload`）；
  ② 单次加载但内含多次「全图重着色」（choropleth 要逐块设 343 个多边形的 material）
  或多次图表首渲染。写 `test.setTimeout(120_000)`，与 M4/M10/W2 的既有做法同口径。

> **不要用文件级 `test.slow()`**。它把整个文件的用例预算 ×3（60s→180s），
> 机器满载时一条卡死的用例会烧掉 3 分钟才失败而不是快速失败 —— 实测在
> 一台被其它任务占满的机器上（load 36、swap 用尽），monitor 首条用例报了
> **14.9 分钟**的耗时却仍声称超时是 180s，整轮测量直接作废。
> 放宽预算的目的是让**慢**通过，不是让**卡死**更体面。

图表类断言另用 `tests/helpers/timeouts.ts` 的 `CHART_FIRST_RENDER`（60s）：
图表是在整页冷启动**之后**再 `await import('echarts')`（dev 下 1.1 MB 未打包 chunk）
才挂上的，30s 在全量长跑满负荷时仍不够。

---

## B. 不可逆 / 高危操作

### B1. registry 写入脚本必须先 `--dry-run`

`src/examples/registry/*.js` 同时承载「机器生成」与「人工精修」两类数据，而生成器无法区分。
历史上有过多次「重跑把手工数据整体覆盖、且没有任何报错」的事故。

**现在所有写入都经过 `scripts/lib/registry-guard.mjs`**：

```bash
node scripts/<脚本>              # 拒绝写入（默认安全值）
node scripts/<脚本> --dry-run    # 预览影响：行数 / 条目数 / 缩略图数量前后对比
node scripts/<脚本> --check      # 只读：逐字节比对生成结果与磁盘文件，漂移则退出码 1
node scripts/<脚本> --force      # 确认后写入
```

> **`--dry-run` 看不出格式漂移**：它的摘要只统计行数 / 条目数 / 缩略图数量，
> 所以「只调换了字段顺序」「只改了文案」这类行数不变的差异会显示成 `0 / 0 / 0` 假绿。
> 需要判断「registry 与生成器是否真的一致」时用 `--check`（`npm run verify:drift`）。

`--dry-run` 的实测收获（直接暴露出两个生成器的破坏性）：

| 脚本 | 修复前 | 修复后 |
|---|---|---|
| `generate-threejs-lesson-registry.js` | 丢 29 张封面，`title/description/tags` 全部退回模板值 | 保留 29×5 个字段 |
| `generate-earth-lessons-registry.js` | 丢 6 张封面，`description/tags` 退回原始值 | 保留 6×5 个字段 |

字段保留由 `preserveCuratedFields()` 实现：按 `category/id` 保留
`title / description / tags / thumbnail / runner`；新增条目不受影响。

**标准动作**：重跑任何 registry 写入脚本前，先 `git status` 确认工作树干净（或在干净分支上），
再 `--dry-run` 看一眼 diff 摘要，最后才 `--force`。

**删除示例的正确流程**：`git rm` 源 `.js`/`.tsx` → 手动编辑 registry 删条目 →
清理 `scripts/_thumb_map.json` 映射 →（可选）删生成脚本中的死键。

**生成脚本维护的 4 个 registry 不能手工改格式**：
`threeCesiumExamples` / `cesiumExamples` / `threejsLesson` / `earthLessons`
的字段顺序、空行、文案由生成器决定，`npm run verify:drift`（CI 中同样执行）会做逐字节比对。
手工调格式、或改了生成器却没重跑，都会被拦下。**要改就改生成器再重跑**，不要只改 registry。
（这也是 `patch-registry-thumbs.mjs` 必须「就地更新」而不能挪动 `thumbnail` 位置的原因。）

脚本清单与分类（哪些可重跑、哪些是一次性的）见 [`scripts/README.md`](../scripts/README.md)。

### B2. 生成器脚本中曾写死过他人机器路径

历史版本里部分 `convert-*` 脚本把源目录写死成某台机器的绝对路径，在本机从未成功生成过产物。
新增/修改生成脚本时**不要写死绝对路径**，统一基于 `new URL('./...', import.meta.url)` 推导。

### B3. 改名示例 id 必须同步改名组件文件

registry 里的 `id` 通过 `PascalCase(id)Example.vue` 约定映射到组件文件。
只改 registry 不改文件（或反之）会得到「未找到 Vue 组件」的白屏，
且**不会有任何构建报错**。

`scripts/verify-registry.mjs` 会在 CI 中拦住这类问题。改 id 时请同时执行：

```bash
git mv .../OldNameExample.vue .../NewNameExample.vue
npm run verify:registry
```

---

## C. 运行时与构建

### C1. 安装依赖必须加 `--legacy-peer-deps`

`three@0.185.0` 与若干 three 生态包存在 peer 冲突（实测 `pnpm install` 会报）：

| 包 | 要求的 three 版本 |
|---|---|
| `three-good-godrays` | `>= 0.125.0 <= 0.182.0` |
| `postprocessing` | `>= 0.168.0 < 0.185.0` |
| `three-tile` | `0.183.1` |

因此必须用 `--legacy-peer-deps` 安装，否则 npm 直接报错中止。

```bash
npm install --legacy-peer-deps
```

### C2. lil-gui 的类名带 `lil-` 前缀

本项目使用的 lil-gui 版本，根元素实际类名是 `lil-root` / `lil-auto-place`，
**不是**标准的 `root` / `autoPlace`。写全局样式覆盖时必须用 `lil-` 前缀类名，
否则选择器不命中、样式看似"写了却没生效"。

### C3. `three` 相关 import 被重定向到本地兼容层

`three` / `three/webgpu` / `three/tsl` 由 `vite.config.ts` 的 `threeCompatResolver`
指向 `src/examples/three-build-compat/`，`three/examples/jsm` 与 `three/addons`
指向 `src/examples/jsm-compat/`。

所以：**不要直接改动 `node_modules/three` 来"验证"问题**，改动不会生效；
也不要在源码里硬编码 `node_modules` 物理路径（历史上 `lil-gui-tracked.js` 这么干过，
现已改为由 vite 别名注入真实入口）。

### C4. macOS 下中文（Unicode）文件名在 vite dev 无法直接服务

**现象**：封面图片在 dev 下破图，返回 `200 text/html`（SPA 兜底）而不是图片。

**根因**：macOS 文件名的 NFC/NFD 规范化 + vite 静态中间件解码不匹配。

**现状**：`vite.config.ts` 的 `serveUnicodePublic` 插件（仅 `apply: 'serve'`）
用 Node `fs` 按解码后的中文路径直接读 `public/` 并返回。生产环境由真实静态服务器处理，无需该插件。

**注意**：脚本里「磁盘中文路径」与「HTTP 编码 URL」是有意不对称的，改截图/校验脚本时不要"顺手统一"。

### C5. 新增依赖后页面异常，先清 Vite 缓存

长时间运行的 dev server 在多次 HMR + 新增依赖后模块图会变脏，
表现为路由组件完全不挂载且无报错。

```bash
rm -rf node_modules/.vite && npm run dev
```

### C6. 分包必须用 `codeSplitting.groups`，不要用 `manualChunks`

**背景**：Vite 8 的打包内核是 **Rolldown**。Rolldown 中 `manualChunks` 已被标记
`@deprecated`，只是被转译成 `codeSplitting.groups[].name()`，而且无法表达分组语义。

**踩过的坑**：项目原先用 `manualChunks` 写了 15 条规则，实测结果是

| 现象 | 后果 |
|---|---|
| 构建产物里有 `vendor-cesium / vendor-spark / vendor-web-ifc / vendor-3d-tiles / vendor-postprocessing / ...`，但**没有** `vendor-three / vendor-echarts / vendor-gsap / vendor-lil-gui / vendor-theatre` | 规则静默失效，无任何报错 |
| three.js 代码同时出现在 `vendor-3d-tiles` 与 `vendor-postprocessing` | 核心库被重复打包 |
| `vendor-cesium` 膨胀到 **8.3 MB**，里面混着 echarts / theatre / lil-gui / three-globe… | 只要打开一个用到 lil-gui 的示例，就要下载 8.3 MB |

**根因**：`codeSplitting` group 的 `includeDependenciesRecursively` **默认为 `true`** ——
捕获 `3d-tiles-renderer` / `postprocessing` 时，会把它们的依赖（three）一并吞进那个组。

**正确做法**：用 `codeSplitting.groups`，并给 three 最高 `priority`
（高优先级 group 先捕获，被捕获的模块会从其它 group 中移除）：

```js
codeSplitting: {
  groups: [
    { name: 'vendor-three', test: /three-build-compat|node_modules[\\/]three[\\/]/, priority: 100 },
    { name: 'vendor-cesium', test: /node_modules[\\/](@cesium|cesium)[\\/]/, priority: 90 },
    // …其余 priority: 80
  ],
}
```

修复后：15 个分包全部生效，`vendor-cesium` 由 8.3 MB 降到 696 KB，
`vendor-three`(1.36 MB) / `vendor-echarts`(1.07 MB) / `vendor-lil-gui`(30 KB) 各自独立。

**维护约定**：新增大体积三方库（>100 KB）时，在 `groups` 里补一条 `test` + `priority: 80`。
注意正则里用 `[\\/]` 匹配路径分隔符（Windows 兼容）。

**2026-09 补记（两个新增约束，均实测复现过）**：

1. **组内库的依赖若被首页/其它组共享，必须显式 `includeDependenciesRecursively: false`**。
   `vendor-three-globe` 曾因默认递归捕获把 tween.js / d3-scale 吞进自己 chunk——
   那些是首页自己也在用的库，结果首页为拿 Tween 和比例尺被迫下载整个 three-globe（首屏 +155 KB）。
2. **不要对 `src/examples/jsm-compat/` 大粒度分组**。其中混有顶层就访问 DOM 的示例应用
   （`mygrapics/bezier` 等的 `document.querySelector('canvas').getContext('2d')`），
   被并进首页可达的共享块后，首页一加载就执行它们，直接白屏。
   首页真正需要的只有 `renderers/CSS2DRenderer.js`，已单文件成组（`vendor-css2d`）。
   排查手段：构建后用探针对比新旧产物的首页 `pageerror` 与资源清单，
   「chunk 拆分导致的初始化顺序/副作用问题」只在 preview 产物下复现（见 C10）。

### C7. E2E 必须使用独立端口（默认 5299）

**现象**：`npx playwright test` 的 5 条用例全部以「元素找不到」失败，但应用本身正常。

**根因**：默认 `baseURL` 是 `http://localhost:5173`，而 5173 是 vite 的默认端口，
本机其它项目（本仓库之外）很容易占用它。`reuseExistingServer` 会把测试直接连到
**别人的 dev server** 上，于是断言的全是别的页面。

**现状**：`playwright.config.js` 已改用 `E2E_PORT`（默认 5299）并加 `--strictPort`：
端口被占用时直接失败，而不是让测试打偏。需要覆盖端口时设置环境变量 `E2E_PORT`。

**教训**：自动化测试的「假失败」和「假通过」一样危险 —— 前者会被当成代码问题排查很久，
后者会让闸门形同虚设。凡是「连接到外部服务」的测试，都要先把连接目标固定成独占资源。

---

### C8. 本机环境下第二次 `vite build` 会失败于清空 `dist/`

**现象**：第一次 `npm run build` 正常；之后每次构建都在输出阶段失败：

```
error during build:
Build failed with 1 error:
Error: [safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] {"count":3623,"threshold":500, ... "targets":[".../dist/assets"]}
```

而日志里 `✓ 5957 modules transformed` 已经出现 —— **代码本身没有问题**。

**根因**：本机开发环境对「批量删除」有保护（单次删除超过阈值即拦截，阈值 500）。
`dist/assets` 有 3600+ 个产物文件，vite 构建前清空输出目录会触发拦截。
CI（GitHub Actions 标准 runner）没有这个限制，因此 CI 不受影响。

**绕过方式**：输出到仓库外的临时目录（推荐，可重复执行）：

```bash
npx vite build --outDir /tmp/earth-build-verify --emptyOutDir true
```

或先手动删除 `dist/` 再构建。

**判断要点**：出现 `safe-delete ... BULK_CONFIRM_REQUIRED` 时不要怀疑代码，
它发生在「产物写出」阶段而非「编译」阶段。

### C9. 百度地图 SDK 不能用「运行时动态 append script」来加载

**现象**：`/bmap` 永远停在「正在加载百度地图 SDK…」，或最终提示
「百度地图脚本未加载，请检查 AK 或网络」——但 AK 与网络都正常。

**根因**：百度地图 JS API 的官方加载器（`https://api.map.baidu.com/api?...`）返回的脚本
内部用 `document.write` 去注入真正的 SDK（`getscript?...`）。
而 `document.write` **只在 HTML 解析阶段有效**：运行时用 `document.createElement('script')`
追加的脚本里执行它不会生效，于是 `window.BMapGL` 永远不会出现。

**正确做法**（当前实现）：AK 仍不写死进仓库，由 Vite 在启动/构建时把 `%VITE_BMAP_AK%`
替换进 `index.html`，在**文档解析期**同步写出 `<script>`；运行时只负责
`waitForBMapGL()`。未配置 AK 时整段跳过，页面展示降级提示。

**⚠ 但解析期注入必须按路径收口**：这段 `document.write` 是解析阻塞的，SDK 本体约 1MB，
还会带出 `dlswbr.baidu.com` 反爬指纹与 `miao.baidu.com` 上报。全站只有 `/bmap` 用它，
其余页面（含 `/monitor`、`/tools` 这类本身要加载 Cesium 的地图页）都在白付这份开销 ——
实测 `/monitor` 上 `window.BMapGL` 存在但地图实例数为 0。
现在 `index.html` 里先判 `location.pathname` 再决定要不要 `document.write`。

**由此产生的新坑**：客户端路由从别的页面跳到 `/bmap` 时 SDK 必然不在
（文档不是从 `/bmap` 加载的）。`src/router/index.ts` 的 `beforeResolve` 会把这次跳转
转成一次整页导航。改这段时要保住三个不触发条件：未配置 AK、文档本身就是 `/bmap`
（解析期那个 script 还在路上，重载会死循环）、`window.BMapGL` 已存在。

**排查方法**：直接 curl 加载器 URL 看返回内容。若看到
`document.write('<script ... getscript ...>')`，就说明必须走解析期注入这条路。

**顺带一提**：未配置 AK 时 Vite 会打印
`%VITE_BMAP_AK% is not defined in env variables ... Is the variable mistyped?`，
这是预期告警（占位符会原样保留，被前端的守卫识别并跳过加载）。

### C10. 测试体系必须覆盖生产产物，不能只测 dev server

**坑**：E2E 默认跑 `vite dev server`，它**按需编译、不经过生产打包**。
因此「分包错乱、产物里的模块初始化顺序问题、构建期 env 注入失败」这类问题
在 dev 模式下永远测不出来 —— 本次修复的 `manualChunks` 失效问题正属于此类。

**做法**：`playwright.config.js` 支持 `E2E_TARGET`：

```bash
npm run test:e2e                    # dev server（快，日常反馈）
E2E_TARGET=preview npm run test:e2e # 预览已构建产物（合并前必跑；需先 npm run build）
```

CI 中两种模式都会执行（见 `.github/workflows/ci.yml`）。
若生产产物不在默认 `dist/`，可用 `E2E_PREVIEW_OUT_DIR` 指定
（本机批量删除保护导致 `dist/` 无法重复清空时也用得上）。

### C11. 同一页面的 URL 状态只能归一个机制管（hash 与 query 双写会互相冲掉）

**现象**：巡游步进后 `?step=` 被「弹回」旧值，同时地址栏 `#hash` 挂着新模式名。

**根因**：直写 `window.location.hash` 会触发原生 hashchange，vue-router 以
**当时的 query** 发起一次导航——若此刻上一次 `router.replace({ query })` 尚未提交，
旧 query 就会把刚写入的新值覆盖回去（竞态，后提交者赢）。

**正确做法**：hash 状态（`EarthView` 的可视化模式同步）与 query 状态（巡游的
`?tour=&step=`）共存时，必须在直写 hash 的 watcher 里短路另一个机制激活的期间
（见 `EarthView` 巡游段注释）。新增任何 URL 状态前先盘点页面上已有哪些写地址的代码。

**URL 状态命名规范（X2，2026-09-15 沉淀）**：平台页面的 query 参数统一用
「英文小写字段名」，一个概念一个名字，跨页面复用：
- `?country=<中文名>`——选中国家（analysis）
- `?year=<YYYY>`——时间轴年份（analysis）
- `?theme=<key>`——主题/模式切换（workbench：gdp|carbon|population|density）
- 功能开关用 `?<flag>=1` 形式（monitor 的 `?nostream=1`）
- 无效值**静默忽略**回默认（不报错、不显示空态）；「缺省即默认值」的主题参数
  在切回默认时**清除参数**保持地址干净（见 `WorkbenchView`）。
- 新增页面的 URL 状态前，先 grep 本页已有写地址代码，保证单一机制（上文）。

### D4. 天地图搜索服务（M1）对个人浏览器 key 返回 404「资源不存在」

**现象**（2026-09-15 M1 交付时实测）：`GET https://api.tianditu.gov.cn/search?postStr={...}&type=query&tk=<key>`
无论 queryType 用 1 还是 7、带不带 `queryTerminal`，均返回 404 HTML「您请求的资源不存在」；
浏览器内 fetch 长时间挂起后失败。同 key 的**瓦片接口**（vec_w）在浏览器内正常、curl 403（D3 已记录的 UA 校验）。

**排查**：直接 curl 官方文档示例（含 `queryTerminal:"8000"`）与多种参数组合，均 404 →
不是参数问题。结合控制台确认：**搜索类服务的可用性绑定账号认证类型**（个人认证只开放
底图瓦片类），key 上没有按服务开通的开关，个人认证无法自助开通搜索服务。

**缓解（已实施）**：地名搜索改三通道链——天地图（企业认证后自动恢复优先）→
**高德 Web 服务**（个人免费、国内可达、CORS 全开；返回 GCJ-02 坐标，前端做
GCJ-02→WGS-84 近似逆纠偏，误差米级）→ OpenStreetMap Nominatim（免认证末位兜底，
⚠ 国内网络对 nominatim.openstreetmap.org 常不可达，通道保留但勿依赖）。
通道间任一失败/空结果自动落到下一个，全部失败落输入框提示；每通道 8s 超时兜底。
高德 key 经 `VITE_AMAP_KEY` 注入（见 `.env.example`），E2E 高德用例配
`VITE_AMAP_KEY`（值任意）即可验证 mock 兜底链。

### C12. 新增键盘交互前，先 grep 全局快捷键

**现象**：巡游播放器的空格（播放/暂停，挂 `window`）与 `EarthView` 既有全局
快捷键（空格=切换自转、`r`=相机回位，挂 `document`）叠加触发：按一次空格，
「暂停巡游 + 打开自转」同时发生。

**根因**：冒泡顺序 `document` 先于 `window`，后挂的监听器里 `preventDefault`
拦不住先收到事件的那个。

**正确做法**：动手前先 `grep -rn "addEventListener('keydown'" src/` 盘点存量监听；
冲突时在**旧监听入口**加「界面态短路」（如巡游打开时全局快捷键整体让位），
不要指望在自己一侧 stop/prevent。

### C13. Cesium 页面上的 Playwright 交互会「静默卡死」，须 force + 落定等待

**现象**（2026-09-15 四页面走查实测，两种形态）：

1. `click()`/`check()` 的 call log 停在 `performing click action` 直到超时——
   元素明明 `visible, enabled, stable` 都通过了。
2. force 点击 `click action done`，但 `check()` 等 `checked` 状态超时——
   事件根本没生效。

**根因**：

1. 形态 1：页面上 Cesium 渲染循环 + choropleth 重着色占满主线程时，
   Playwright actionability/hit-target 探针（经 rAF 注入）长时间得不到执行，
   点击协议等不到 ack。分析页时间轴播放中点「暂停」必现——这就是
   「播放用例满载时偶发不稳定」的真身。
2. 形态 2：`fill()` 过滤列表后 v-for **整行重建 DOM**，立即 click 会把事件
   打在已脱离文档的旧节点上（坐标命中同一位置的新节点，但 force click 的
   目标是旧 handle），`change` 丢失。

**正确做法**：

- 对 Cesium 页面上的面板交互统一加 `{ force: true }`（按钮/checkbox/滑杆；
  force 跳过 actionability 探针，事件照常派发）。
- `fill` 触发列表重渲后，等 ~300ms 让渲染落定再点击；`check()` 后用
  `toBeChecked()` 显式断言，别只信 click 返回。
- **force 也会整包丢**（2026-09-15 四页面增强交付时实测）：播放/推送进行中
  主线程持续满载时，CDP `Input.dispatchMouseEvent` 的事件会丢失，重试也丢。
  此时改用页面内 DOM click——`locator.evaluate((el) => el.click())`，走同一
  Vue 事件链且可靠。参考 `tests/analysis.spec.js` 的 `clickUntilAccepted`。
- 画布 mouse 事件（`page.mouse.click`）同样受并行资源竞争影响：本地
  `workers: 2` 下偶发丢失，probe 单跑稳定、CI 本就 `workers: 1`。重画布交互
  spec（如 `map-tools.spec.js`）加 `test.describe.configure({ mode: 'serial' })`。
- 测试里用 `addInitScript` 清 localStorage 时，reload 也会再执行它，会把测试
  中途存下的状态清掉——用 sessionStorage 标记保证只清一次（map-tools 与
  monitor 两份 spec 均已踩过）。
- **最终收敛形态**（2026-09-15 收尾时确定）：满载页上连 `evaluate` 的往返都可能
  堵死，且「点完跨通道验证文本/checked」会读到切换瞬间的空值把已生效的操作
  又点回去。可靠模式是**把一段交互整体放进单次页面内脚本**（每步后
  `setTimeout` 等渲染落定、页内验证重试），Playwright 侧只做读取与轮询断言，
  且生效与否用**业务语义**断言（对比表列数、按钮激活类、年份停走）而非
  `toBeChecked` 这类通道敏感的属性读取。参考 `tests/analysis.spec.js`。
- 相关用例参考：`tests/analysis.spec.js` 的 `checkCountry` 与播放收尾注释。

### C14. `Cesium.TileProviderError` 在 1.142 是类不是事件（调试代码静默失效）

**现象**：`?debug=1` 的 HUD 恒显「相机高度 0m · 瓦片队列 0 · 图层 0」，
真实状态完全正常；且无任何控制台报错。

**根因**：1.142 中 `typeof Cesium.TileProviderError === 'function'`（类），
没有 `addEventListener`，也没有静态 `Event`。调用它的 addEventListener 抛
TypeError，中断了同块后续的 HUD 定时器/事件监听初始化；异常被外层
try/catch 吞掉，而错误面板的显示条件是 `loadError && !ready`（ready 已
true），UI 零提示——典型的「静默假通过」。

**正确做法**：瓦片错误计数挂到各图层 provider 的
`imageryLayers.get(i).imageryProvider.errorEvent`（1.142 实测存在）；
注意 `applyTdtStack` 重建图层后要对新 provider 重挂。诊断类代码自身要
独立 try/catch，失败 console.warn，不与页面初始化错误混流。
参考：`src/views/MapToolsView.vue` 的 `attachTileErrorWatch()`。

---

### C15. 顶栏搜索的跳转依赖「示例 chunk 是否已预热」，同一操作结果不确定

**现象**（2026-09-20 实测）：在首页地球点顶栏搜索输入一个字符，**有时**被跳到
`/examples?search=x`（three.js 场景随之销毁、无法恢复），**有时**原地不动。
两种表现来自完全相同的代码路径。

**根因**：旧实现（`App.vue` 的 `updateSearchQuery`）无条件
`router.push({ path: '/examples', query })`，而 `/examples` 是懒加载路由。
若该 chunk 尚未加载（用户本次会话还没进过示例中心），push 先进入 chunk 加载阶段，
此期间的导航可被中止 —— 于是「劫持」只在示例 chunk 已预热时才稳定复现。
`App.vue` 又刻意把 registry 加载推迟（见其 `:210-211` 注释与
`smoke.spec.ts` 的「首页不为顶栏预载示例注册表」用例），进一步放大了不确定性。

**测试教训（比现象本身更重要）**：给「不劫持」写回归用例时，若用
`page.goto('/')` 直达首页再输入，**旧代码同样不会跳转** —— 用例在修复前后都绿，
是彻底的假绿。必须：
1. 先 `page.goto('/examples')` 预热 chunk；
2. 再用 **SPA 内导航**（点顶栏链接）切到目标页 —— 不能 `goto`，整页加载会清掉模块缓存；
3. 输入用 `fill()`：`pressSequentially()` 在本项目页面上不触发 `@input`（实测输入框值不变）。

**验证方式**：按上面三步搭好后，旧代码必然红、新代码必然绿，才算这条守卫成立。

**正确做法**：跨路由的跳转类副作用不要挂在输入事件上；改为显式提交（回车）
或就地更新。写这类守卫前先按「反验」流程确认它在旧代码下会红。

---

### C16. 运行时 DOM 普查若按标签过滤，可访问性结论会整体反向

**现象**（2026-09-20，本人真实踩坑并一度写进报告）：用
`querySelectorAll('div,article')` + `cursor:pointer` 普查「可点击卡片」，
得到「`/examples` 64 张、`/three-globe` 55 张、`/tools` 51 张卡片全部没有
`href`/`tabindex`/`role`，整个示例库对键盘不可达」——一条听起来很严重的 WCAG 结论。

**根因**：选择器里**没有 `a`**。卡片本来就是 `<router-link>`（`ExampleCard.vue:2`），
渲染成带 `href` 的 `<a>`，被 `div,article` 直接排除；而 `withHref` 统计的是
「div/article 里有多少个 href」，恒等于 0。命中的那些 `div` 是 `<a>` 内部的
`.card-body`，属于嵌套装饰节点，不是独立控件。

**实测真相**：三个画廊的卡片 100% 是可 Tab 聚焦的真链接
（`/examples` 16/16、`/three-globe` 19/19、`/tools` 17/17 带 `href` 且 `tabIndex>=0`）。

**正确做法**：做「可交互元素」普查时用 `a[href],button,input,select,textarea,[tabindex]`
这类**能力选择器**，不要用「容器标签 + 样式特征」去猜；
得出「某类元素完全不可达」这种强结论前，先 `find . -name 'XCard.vue'` 读一眼实现，
或直接 `document.querySelector('.example-card').tagName` 验证一条。

---

### C17. WebGL 画布在渲染循环外 `toDataURL()` 拿到的是纯黑图（「截图」功能曾长期全黑）

**现象**（2026-09-20 实测）：首页工具栏「截图」按钮（以及 `s` 快捷键）产出的 PNG
**每次都是全黑**，但按钮有反应、文件能下载、控制台零报错。
同一条路径喂给「录制 GIF」的帧也全是黑的。

**根因**：`src/composables/useScene.ts:17` 建 renderer 时没传 `preserveDrawingBuffer`
（默认 `false`）。合成器把帧呈现完就回收绘制缓冲，所以在**渲染循环之外**
（点击回调、`setInterval` 里）调 `canvas.toDataURL()` 只能读到清屏后的黑帧。

**量化证据**（同一页面、同一时刻，只差有没有先 render）：

| 取法 | 体积 | 不同颜色数 | 平均亮度 |
|---|---|---|---|
| `canvas.toDataURL()`（旧写法） | 129 KB | **1** | **0** |
| `renderFn(); canvas.toDataURL()` 同一同步任务内 | 2731 KB | **3592** | 24.8 |

**正确做法**：把「渲染」和「取帧」放进**同一次同步任务**。已落地为
`EarthCanvas.vue` 的 `captureFrame()`（截图，返回 PNG dataURL）与
`captureFrameScaled(maxWidth)`（GIF 抓帧，返回像素）。
不要为了省事给 renderer 开 `preserveDrawingBuffer: true` —— 那会让每帧都保留回读缓冲。

**顺带一条性能教训**：GIF 抓帧最初复用 `captureFrame()` 拿 PNG dataURL 再
`Image.decode()`，整画布单帧 PNG 就有 ~2.7 MB，每 250ms 编一次直接把主线程压死
（实测连点两次录制按钮，一次 JS 往返能被拖到超时）。
必须走 `render → drawImage 降采样 → getImageData`，绕开 PNG。

**另一处同类**：`Toolbar.vue` 的 `tools` 原本写成普通数组而非 `computed`，
`active`/`title` 只在 setup 求值一次 —— 实测点「云层」「自动旋转」后按钮状态毫无变化，
11 个开关全都不反馈开合。列在这里是因为它和上面那条一样，
都属于「功能在跑、界面不报错、但状态是死的」。

---

### C18. 对懒加载列表做「数量为 0」的负向断言一定是假绿

**现象**（2026-09-21 实测，两次反验都被骗过）：想断言两条被 `displayHidden`
隐藏的示例**不在画廊里**，写了

```ts
await page.goto('/examples?search=影像图层调试页')
await expect(page.locator('.example-card')).toHaveCount(0)          // 摘掉 hidden 后仍“通过”
await expect(page.locator('.result-count')).toHaveText('共 0 个示例') // 加了锚点也仍“通过”
```

把 `hidden: true` 摘掉、确认浏览器里该搜索确实出 1 张卡之后，**E2E 里这两条依然通过**。

**根因**：注册表是 11 个分片动态 import 的，`page.goto` 返回时列表还是空的，
负向断言在数据到达前就成立了。`toHaveCount(0)` 的"重试直到通过"语义在这里
恰好是反的 —— 它不需要等待就能满足。

**正确做法**：隐藏/不存在这类性质，**断言到一个会被正向替换掉的界面状态上**，
而不是断言"某元素没出现"。本例改用详情路由：未隐藏时该 URL 会渲染示例本体，
隐藏时渲染 `.error-tip「未找到示例」` —— 摘掉 `hidden` 立刻失败，实测有效。

**通用判据**：写负向断言前先问「如果这个功能坏了，这条断言会在哪一步变红？」
答不出来就是假绿。写完必须**注入反例跑一次**（本仓惯例，见 E7 的复验要求）。

---

## D. 凭据与配置

### D1. 地图凭据一律走环境变量

百度地图 AK 与天地图令牌都曾有明文入库的历史（现已移出）。
新凭据只写 `.env.local`（已 gitignore），在 `.env.example` 登记变量名，
代码里通过 `import.meta.env.VITE_XXX` 读取，并做好「未配置时优雅降级」。

`npm run check:secrets` 会在本地与 CI 拦截明文凭据。

### D2. 不要写死本机绝对路径到配置文件

历史问题：`.npmrc` 里写过 `store-dir=/Users/<他人>/...`，换机器/换 CI 直接失败。
已清理。配置文件应保持环境无关。

### D3-0. Cesium WMTS URL 模板缺 `{TileRow}`/`{TileCol}` 占位（「地图永远出不来」的最终根因）

**现象**：`/tools` 画布在任何缩放层级都是一张固定的米白图（1400×844 画布
`drawImage` 采样独立色块数=1），但 Network 面板里天地图瓦片请求全部 200、
`TileProviderError` 为 0——「下载了几百张瓦片，画面却一张都没变」。

**根因**：`WebMapTileServiceImageryProvider` 的 url 模板里只写了
`{TileMatrix}`，漏掉 `tilerow={TileRow}` 与 `tilecol={TileCol}`。于是
每次请求的 URL 只随层级变、不随行列变——同一层级的几十个请求是**同一条
URL**，天地图对其返回同一张默认概貌图。占位水印、素色米白、
「配置对了却永远出不来」全部由此而来。

**正确写法**（天地图 WMTS + Cesium）：`tilematrix={TileMatrix}&tilerow={TileRow}&tilecol={TileCol}`。
注意占位符名字是 `{TileCol}` 不是 `{TileColumn}`（写错则该参数不被替换，
服务端直接 400）。

**排查手段**：挂 `scene.preRender` + 强制 `scene.render()` 后
`drawImage` 采样画布，独立色块数≈1 即「画布是死的」；再抓页面实际
请求 URL 逐字核对（本轮就是靠对比「页面 URL 无 tilecol」定位的）。
另外：WebGL 画布无 preserveDrawingBuffer 时 `drawImage` 采到的是
清屏后的黑帧，不能作为画面证据。

---

### D3. 天地图影像的「无影像」占位与个人 key 配额

**现象**：浏览器里整球铺满「此级别下，该区域无影像，请放大或缩小地图后再浏览」，
但 curl 单张请求同一 URL 却返回真实影像——「我这里好的、你那里坏的」。

**根因（逐层级实测结论）**：天地图 img_w 影像在国内是**半覆盖**——
L3~4 整片占位（带字 jpg 4769B，主色深藏青 (7,6,40)）；**L5 瓦片部分被盖上
同样的水印**（武汉样本约 3% 水印像素，肉眼即「没加载出来」）；L6 起才是
纯净卫星图。不同环境（DPR/视口尺寸）选层不同，于是出现「我看是好的、
你看到满屏水印」。**配额超限同样返回占位图**：个人 key 影像底图日配额仅
1 万次（控制台可查），且有并发限流——排查时先看控制台配额表排除这一项
（2026-09-14 曾误判为配额耗尽，实际当日仅用 5%）。

**排查方法**：逐层级 curl 瓦片并做像素分析（主色深藏青占比、色彩数），
区分「真图/带字占位/素色占位」；对照控制台配额表排除配额因素。

**⚠ 频率限流才是日常真凶（2026-09-14 复现实验证实）**：同一张瓦片
（vec L8 武汉）在 48 并发爆破后立即请求返回 **103B 素色占位**（均色
245,244,238），几分钟后同一 URL 恢复 23KB 真图。即：浏览器页面加载的
高并发会触发限流，被限请求返回占位图且被 Cesium 当作正常瓦片使用，
直到刷新重拉；而单张串行 curl 永远拿真图——这就是「用户满屏米白、
开发者 curl 正常」随机拉扯的机制。**测试天地图相关问题时，务必先
静置几分钟再串行验证，否则会误判。**

**缓解**（已内置于 `src/map/createViewer.js`）：
1. **影像层按相机高度显隐**：高度 ≤150 万米（约 L6+）才显示 img/cia，
   超过即隐藏、露出底层矢量。⚠ `ImageryLayer.minimumTerrainLevel`
   实测拦不住低层级占位瓦片，不要依赖；
2. **拉远上限** `maximumZoomDistance = 1000 万米`：天地图 L1~2 是全球占位区，
   禁止用户缩放进去了；
3. 默认底图为矢量（零占位史），卫星影像为切换项；
4. `VITE_TDT_TOKEN` 支持逗号分隔多 key，**按图层各分一个 key**（不是每张瓦片换一次）：
   既摊配额，又保证同一张瓦片的 URL 稳定 —— 天地图回 `max-age=432000`，
   而 tk 在 URL 里，每请求轮换等于把 5 天缓存打散成随机命中；
5. `RequestScheduler.requestsPerServer = 6` + 单子域名（t0）。
   **⚠ 这一条推翻了本文件早期版本写的「= 1 最稳」**，依据是 2026-09-21 实测：
   天地图 t0~t7 只有 HTTP/1.1（同一 IP），浏览器单主机 6 连接是硬上限，
   设成 1 连 1/6 都用不满；单瓦片 p50 113~225ms、p95 937ms、首包 803ms，
   一次视角切换 150~270 张 → 串行排队就是十几秒量级（实测并发 1 补齐 5.2s / 并发 6 2.5s）。
   安全性：单主机 8 并发（同一 key）、16 并发（轮转 5 key）实测全部真图，
   未见 103B/4769B 占位；上面「48 并发必触发限流」是 **8 子域名 × 6** 的量级，
   6 并发不在这个风险区。**再往上调必须重跑占位反验。**
   更彻底的做法是开瓦片反代（下一条），把上游并发收口在服务端；
6. **同源瓦片反代 + 磁盘缓存**（`server/src/tiles.ts`，`.env.local` 设
   `VITE_TILE_PROXY=/tiles` 开启）：浏览器侧并发不再等于打给天地图的并发
   （上游由 `TILE_UPSTREAM_CONCURRENCY` 收口）、瓦片 URL 不再含 tk（缓存键稳定）、
   **重复访问**实测从 0.3~2.9s/张 降到 7.2ms/张。
   ⚠ **别指望首访变快**：冷缓存下同一片海域实测直连 2.19s/168 张、
   反代 2.31s/133 张 —— 基本打平，因为服务端到上游只有 8 并发，
   也没有浏览器那条复用 keep-alive 的池子。它的价值在二访、跨标签页与多用户。
   未开启或后端未起时前端探测失败自动退回直连，行为与本条加入前一致。
   ⚠ 反代必须伪装浏览器 UA + Referer：天地图「浏览器端」key 拒绝非浏览器 UA
   （实测 node 默认 UA → 403，带 Chrome UA → 200）；
7. 根本解：企业/政府开发者认证（影像日配额 300 万+），或公开部署前评估访问量；
8. **全球视角的「米白观感」是另一个独立问题**：相机高于 150 万米时影像层被门控
   隐藏，露出的矢量底图在深色玻璃 UI 下观感等于「地图没加载出来」（/monitor 首屏
   曾被如此反馈）。`createMapViewer` 的 opt-in 选项 `dimBaseAtHighAltitude` 在门控期
   把矢量底图压暗去饱和（`brightness 0.34 / saturation 0.3`），近景自动还原——
   大陆轮廓与国界保留，但不再刺眼。看板页另可开 `idleRender`
   （`requestRenderMode` + 0.5s 兜底）省 GPU；开了它之后实体变更要自行
   `scene.requestRender()`，否则新事件点不上屏。


## E. TypeScript 迁移(TS_MIGRATION.md)引入的操作坑(2026-09-17)

### E1. 给 `.vue` 的 JS 代码插类型断言时,行首 `(` 会与上一行拼成函数调用(ASI 陷阱)

**现象**:用 perl/sed 给参数补 `: any` 时写出 `(obj.material as any).xxx = ...`,
若上一行是 `const x = new Foo()`(无分号,JS 靠 ASI),则两行被解析为
`new Foo()(...)` —— 报 `TS2349: This expression is not callable`,甚至悄悄改变运行时行为。
波4(MachineRoom/Universe)与波9 各踩过一次。

**规则**:在无分号风格的 JS 代码中插入以 `(` 开头的断言表达式,**行首必须补分号**
(`;(obj.material as any).xxx`),或改用临时变量承接断言结果。
同风险:`[` 开头的行(成员访问/元素访问)。

### E2. `@ts-nocheck` 是全局级消音:它会掩盖「新增代码的类型错误」

M4 给 903 个三方示例组件登记了 `@ts-nocheck`(预算偏离见 TS_MIGRATION.md §3.3)。
这些文件内**任何后续新增代码都不再被类型检查**,包括将来真正想引入的 bug。
**规则**:在这些文件里改代码时,不能依赖 `npm run typecheck` 兜底;
若改动较大,顺手移除该文件的 nocheck 行、跑一次 vue-tsc、修完再放回。
追平方法与优先级见 TS_MIGRATION.md §3.3。

### E3. vite.config.js / registry/index.js 改名会连带破坏闸门脚本(迁移期同步清单)

闸门脚本硬编码了字面路径,漏改即「CI 假红/假绿」:
- `verify-three-compat.mjs` 检查 `vite.config.ts` 是否注册 threeCompatResolver(迁移中同步过);
- `verify-registry.mjs` / `verify-thumbnails.mjs` 动态 `import()` registry barrel,
  registry 转 .ts 后 npm script 需加 `--experimental-strip-types`(CI Node 22.6+ 支持,
  本机 Node 24 原生);
- registry/index.ts 内部 11 个分片 import 必须带**显式 `.ts` 扩展**
  (Node ESM 无扩展名解析失败),tsconfig 已开 `allowImportingTsExtensions`。
**规则**:任何 registry/vite.config 文件名变动,先 grep
`scripts/` 下对路径的字符串引用再动手。

### E4. lang="ts" 让存量 JS 的「隐式坏死」显形 —— 先归因再修

迁移中 TS 强制暴露了一批**迁移前就坏**的代码(并非迁移引入):
- mygrapics/graphics 共 84 个 demo `new GlRenderer()` 缺 import(HTML 转换丢失,
  运行时 ReferenceError)——已批量补回 ogl Renderer 别名导入;
- mapToolsController 缺 `getArcgisTerrainSampler` import(被 try/catch 掩盖,
  贴地采样静默退化)——已补回;
- CodeDrawerHeader 复制按钮调用不存在的 `copySection`(点击必抛错)——已改 $emit。
**规则**:lang=ts 后出现的错误先区分「迁移引入」与「存量显形」;
存量显形属于迁移的收益,修不修单独决策,但必须在提交信息里写明,不得静默绕过。

### E5. Node <23.6 跑 `verify:drift` 会静默假红:registry .ts 动态 import 失败被吞成空数组

registry 转 .ts 后,生成器用 `loadExistingExamples()` 动态 `import()` registry 文件做
「人工字段合并」;该函数 **catch 后静默返回 `[]`**(registry-guard.mjs 的容错设计)。
在默认不开启 type-stripping 的 Node(<23.6,含 CI 钉的 Node 22)上,
npm script 若漏带 `--experimental-strip-types`,import 直接抛
`ERR_UNKNOWN_FILE_EXTENSION` → 被吞掉 → 生成器以为「现有 registry 为空」,
不保留人工字段 → `--check` 报 29 张缩略图/精修文案「漂移」的**假红**。
2026-09-18 实锤:同一条命令 shell 直跑(经 nvm 解析到 Node 24)通过、
`npm run` 内(Node 22)失败,差异只在 node 版本;verify:drift 三段命令中
只有第一段带 flag,后两段漏带(已补齐)。
**排查口诀**:漂移报告里出现「缩略图 N→0」「description 退回标题」且
无「已保留已有字段」日志行,先查 node 版本与 strip-types flag,再怀疑真漂移。
顺带教训:工具 shell 里 `which node` 与 npm run 内的 node 可能不同(nvm 多版本),
闸门失败先打印两边的 `node --version`。

### E6. 波7 three-project 的 12 个 lint 错自 2026-09 起潜伏:lint:ci 在 HEAD 上曾为假绿

波7(9d832eb)为 three-project 8 个 .vue + firework.ts 加 @ts-nocheck 时,该目录**不在
eslint ignores**(与 webgl/graphics 等源不同),`ban-ts-comment` 12 错当时即已产生,
但后续多批次记录「lint:ci 绿」——实际是闸门未真跑或跑时被别的因素掩盖。
2026-09-18 批次3 移除这批 nocheck 后 lint 才真正回绿。
**规则**:每个批次的闸门结果以「本次会话亲跑、记录退出码」为准;
接手他人/前期批次时,闸门状态要重新验证,不沿用历史记录。

### E7. 并行子代理的「自报完成」不可作为闸门依据(2026-09-18 nocheck 追平并行波实证)

并行代理各自清错时,主会话**提交前必须独立复验**(过滤本目录的
`vue-tsc --noEmit | grep '该目录'`),不能信代理的最终报告。实证两种翻车:
- **假 0 错**:graphics 代理报告「0 错」,主会话复验实测 467 错——其验证轮的
  vue-tsc 疑似跑挂后 grep 到空输出被当成通过。幸在提交前拦截。
- **codemod 语法损坏**:同一代理的按行列插 `: any` 脚本把 5 处无括号单参箭头
  `d =>` 插成 `d: any =>`(TS1005 语法错 ×17),且其第一版修复脚本本身又因
  负向断言写反而全空转。语法错(TS1xxx)与类型错(TS2xxx/TS7xxx)要分开看,
  前者说明文件已被改坏,优先人工检查。
- **时序错位**:代理可能在主会话已提交某目录后继续追加「润色」——
  提交后要留意该目录是否又出现未提交改动,作为补遗小提交处理。
**协作协议**:每目录一个代理、目录间零交集;代理禁止一切 git 写操作与
env.d.ts/共享配置修改(新全局用 `(globalThis as any)` 局部断言并上报);
主会话统一复验、统一提交、统一跑 build/E2E;验收证据要求代理贴
「最后一轮完整命令实际输出」而非结论数字。

### E8. 长跑并行代理会死于模型超时/流停滞——按现场接管,不要盲目 resume

并行波2 的 4 个代理里 3 个在 5-8 小时后死于 `Model request timed out` /
`Model stream stalled`(token 用量 1.6M-17.5M)。死亡前它们往往已接近完成:
shader 代理死时自己的 47 文件已 0 错;basic+particle 死时只剩 8 错。
**接管流程**:(1) 数 nocheck 残留与改动文件数,确定死时进度;
(2) 全量 typecheck 查错误余量与 TS10xx/TS11xx 语法错(有语法错说明死在
codemod 中途,优先人工修复);(3) 剩余错误走既定 codemod 管线
(参数/声明注解 → 结构点手工 → ASI 扫描);(4) 按切片提交。
**切片粒度教训**:单代理任务以 2 小时内可完成为度(约 20-40 文件),
118 文件的切片必须再拆;主会话复验期间的 typecheck 会与幸存代理的
验证轮抢 CPU,单轮可拖到 10 分钟以上,属正常,不要误判为挂死。
另:代理死后的「润色」可能已落盘一半(如 PointCloudFpsOctree 的
`children = [] as any` 补丁没打在根因上),接管时要重读现场而不是
沿用死代理的思路。
