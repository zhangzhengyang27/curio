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

`three` / `three/webgpu` / `three/tsl` 由 `vite.config.js` 的 `threeCompatResolver`
指向 `src/examples/three-build-compat/`，`three/examples/jsm` 与 `three/addons`
指向 `src/examples/jsm-compat/`。

所以：**不要直接改动 `node_modules/three` 来"验证"问题**，改动不会生效；
也不要在源码里硬编码 `node_modules` 物理路径（历史上 `lil-gui-tracked.js` 这么干过，
现已改为由 vite 别名注入真实入口）。

### C4. macOS 下中文（Unicode）文件名在 vite dev 无法直接服务

**现象**：封面图片在 dev 下破图，返回 `200 text/html`（SPA 兜底）而不是图片。

**根因**：macOS 文件名的 NFC/NFD 规范化 + vite 静态中间件解码不匹配。

**现状**：`vite.config.js` 的 `serveUnicodePublic` 插件（仅 `apply: 'serve'`）
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

### C12. 新增键盘交互前，先 grep 全局快捷键

**现象**：巡游播放器的空格（播放/暂停，挂 `window`）与 `EarthView` 既有全局
快捷键（空格=切换自转、`r`=相机回位，挂 `document`）叠加触发：按一次空格，
「暂停巡游 + 打开自转」同时发生。

**根因**：冒泡顺序 `document` 先于 `window`，后挂的监听器里 `preventDefault`
拦不住先收到事件的那个。

**正确做法**：动手前先 `grep -rn "addEventListener('keydown'" src/` 盘点存量监听；
冲突时在**旧监听入口**加「界面态短路」（如巡游打开时全局快捷键整体让位），
不要指望在自己一侧 stop/prevent。

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
