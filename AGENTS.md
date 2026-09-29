# AGENTS.md

> 面向在本仓库工作的 AI 编码代理。
>
> 人读的项目介绍在 [README.md](./README.md)，提交规范在 [CONTRIBUTING.md](./CONTRIBUTING.md)，
> **历史事故在 [docs/KNOWN_PITFALLS.md](./docs/KNOWN_PITFALLS.md)（动手前必读）**。
>
> 本文件只写「代理必须知道、且容易做错」的事，不重复 README 的入门内容。
> **与文档冲突时以代码为准**（已知漂移见第 9 节）。

---

## 1. 项目是什么

**Curio**：Vue 3.5 + Vite 8（打包内核是 **Rolldown**）+
Three.js 0.185（+ r186dev 本地兼容层）+ Cesium 1.142 + Pinia 3，路由全部懒加载。

两条主线，**各自拥有独立的顶栏外壳**（`src/shells/`，由 `App.vue` 按 `route.path` 首段选择）：

| 主线 | 入口 | 外壳 | 规模 |
|---|---|---|---|
| 数据产品 | `/` → `src/views/EarthView.vue` | `ProductShell`（无搜索框） | 多类数据可视化图层（`src/three/layers/`） |
| 示例资源库 | `/examples` → `src/examples/` | `ResourceShell`（带示例搜索） | **11 个来源 / 1400 条示例 / 1512 个 `.vue` 组件(全仓 2026-09-27 实测,其中示例组件 1421;TS 迁移后全部 `lang="ts"`,平台侧无 `.js` 残留)** |

> 早期版本两条主线**共用一条 8 项顶栏**，是「页面功能非常乱」的直接来源：
> 4 个产品功能和 4 个示例集平铺在同一层，且那条全局搜索在任何页面敲一个字符
> 都会把用户拽去 `/examples`（首页地球场景随之销毁、不可恢复）。
> 现在跨产品只剩一个显式的「示例中心 / 返回地球」切换链接。

- 路由表：`/`、`/three-globe`、`/three-globe/:example`、`/examples`、
  `/examples/:source/:pathMatch(.*)*`、`/bmap`、`/tools`（数字地球平台·地图工具箱）、`/analysis`（数字地球平台·全球数据分析）、`/monitor`（数字地球平台·业务监控）。
- **范围已冻结**：不再接入新的示例来源，只做存量修复与机制优化
  （[`docs/ROADMAP.md`](./docs/ROADMAP.md) 第 0 节）。
- **不变量**：1400 条示例的 `runner` **全部为 `'vue'`**（`iframe` 通道存在但无条目使用）。
- 仓库现状：**没有 git remote，只有 `main` 分支**，全部提交仅存于本机磁盘（ROADMAP P0）。

---

## 2. 开工前（三条）

1. 安装依赖**必须**带 `--legacy-peer-deps`：
   `npm install --legacy-peer-deps`
   （`three@0.185` 与 `three-good-godrays` / `postprocessing` / `three-tile` 存在 peer 冲突，
   见 KNOWN_PITFALLS C1；CI 走 `npm ci --legacy-peer-deps`。）
2. **先读 [`docs/KNOWN_PITFALLS.md`](./docs/KNOWN_PITFALLS.md)。**
   其中多条是「静默假通过」「静默丢数据」类缺陷 —— 不看会重踩，且踩了很难自查。
3. 动手前 `git status` 确认工作树干净。**任何写 `registry` 的操作都必须有干净回退点。**

---

## 3. 铁律

违反以下任一条，**多数不会产生构建报错**，只会静默出错或丢数据。

| # | 规则 | 原因 |
|---|---|---|
| **R1** | **不要手工修改 `src/examples/registry/` 下 4 个由生成器维护的文件**（`threeCesiumExamples` / `cesiumExamples` / `threejsLesson` / `earthLessons`）的**字段顺序、空行、文案**。要改就改生成器再重跑。 | `npm run verify:drift` 做**逐字节**比对（CI 同款），手工调格式必被拦下。 |
| **R2** | 重跑任何写 registry 的脚本：先 `--dry-run`，确认后才 `--force`。**判断「是否真漂移」要用 `--check`，不要用 `--dry-run`。** | 不带参数运行会被 `scripts/lib/registry-guard.mjs` 直接**拒绝**（安全默认值）。`--dry-run` 只统计行数/条目数/缩略图数，**只换字段顺序或只改文案时显示 `0 / 0 / 0` 假绿**。 |
| **R3** | 改示例 `id` 必须同步改组件文件名（`git mv`），反之亦然。 | `id` → `PascalCase(id)Example.vue` 是**无类型保护的约定**，失配只表现为用户侧「未找到 Vue 组件」白屏，**没有任何构建报错**。 |
| **R4** | 凭据只写 `.env.local`（已 gitignore）。新增变量要三件事齐做：登记 `.env.example`、在 `env.d.ts` 的 `ImportMetaEnv` 补类型、实现「未配置时优雅降级」。 | `npm run check:secrets` 在本地 git 钩子与 CI 双重拦截。 |
| **R5** | **不要写死本机绝对路径**（配置文件、脚本都不行）。生成脚本用 `new URL('./...', import.meta.url)` 推导。 | 历史上 `.npmrc` 写过他人机器的 `store-dir`，换机器/换 CI 直接失败。 |
| **R6** | **不要改 `node_modules/three` 来「验证」问题** —— 改动不会生效。 | `three` / `three/webgpu` / `three/tsl` 被 `vite.config.ts` 的 `threeCompatResolver` 重定向到 `src/examples/three-build-compat/`；`three/examples/jsm`、`three/addons` → `src/examples/jsm-compat/`。 |
| **R7** | 分包只用 `codeSplitting.groups`，**不要用 `manualChunks`**。给某个库新增分组前，先确认它是否真的出现在首页/常用页的依赖图里。 | Vite 8 内核是 Rolldown，`manualChunks` 已废弃且**静默失效**；而分组会把库变成**共享 chunk** 并被提升进 `modulepreload` —— 曾因此让首页预载 1.7 MB 用不到的高斯泼溅库。 |
| **R8** | 删除示例严格按顺序：`git rm` 源文件 → 手动编辑 registry 删条目 → 清 `scripts/_thumb_map.json` 映射 → 删缩略图 → 清生成器里的死键 → `npm run verify`。**不要靠重跑生成器「自动清理」。** | 顺序错会出现「registry 引用不存在的文件」，且没有构建报错。 |
| **R9** | 不要 `--no-verify` 跳过钩子，不要直接 push `main`。 | 闸门失败请修问题，而不是绕开。 |

---

## 4. 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器（`http://localhost:5173`） |
| `npm run build` | 生产构建（`vite build` + `scripts/copy-example-deps.js`） |
| `npm run preview` | 预览构建产物 |
| `npm run typecheck` | 全量 `vue-tsc --noEmit`（覆盖 `src` 下全部 `.vue` + 自有 `.ts`，**并串了 `vue-tsc -p server/tsconfig.json`**，当前 0 error） |
| `npm run lint` / `npm run lint:ci` | ESLint（前者自动修复） |
| `npm run test:e2e` | Playwright 冒烟（dev server，端口 5299） |
| `npm run dev:server` / `start:server` / `test:server` | `/monitor` 地震数据后端（`server/`，零依赖，:8787）。**跑 monitor 用例不需要起它**：E2E 用 route 拦截喂 `tests/helpers/quakes.ts` 夹具。配了 `TDT_TOKEN`（或回退读 `VITE_TDT_TOKEN`）后它同时是**天地图瓦片反代**，前端在 `.env.local` 设 `VITE_TILE_PROXY=/tiles` 才启用；没起时前端自动退回直连 |
| `npm run refresh:quakes` | 重生成打包降级快照 `public/data/quake-snapshot.json`（进版本库；数据可随时再抓） |
| `npm run verify` | **一键跑 7 项一致性校验**（见下） |
| `npm run audit:deps` / `node scripts/audit-console.mjs` | 依赖 / console 审计，**只输出线索，不改文件** |

---

## 5. 改完必须跑的闸门

```bash
npm run verify      # 凭据扫描 → 注册表一致性 → 漂移检测 → 封面完整性 → three 兼容层 → 图形渲染器生成物 → 主题令牌/对比度
npm run typecheck
npm run lint:ci
npm run build
npm run test:e2e                        # dev server（反馈快）
E2E_TARGET=preview npm run test:e2e     # 生产产物（需先 build）
```

- **dev 与 preview 都要跑。** dev server 按需编译、不经过生产打包，
  因此「分包错乱、产物模块初始化顺序、构建期 env 注入失败」这类问题在 dev 下永远测不出
  —— 历史上 `manualChunks` 静默失效、以及一条 E2E 选择器歧义，都是 preview 才暴露的。
- 改动涉及 `vite.config.ts` 的分包 / env 注入 / 任何产物形态时，**必须**跑 preview 那一遍。
- `npm run verify:drift` 是 `verify` 的第 3 环，也是判断「registry 与生成器是否一致」的唯一可靠手段。
- `npm run verify:gl-renderer` 守 `src/examples/jsm-compat/gl-renderer.esm.js`：它是
  `public/graphics/common/lib/gl-renderer.js`（webpack UMD，课程原版渲染器）的 ESM 转换产物，
  **由 `scripts/generate-gl-renderer-esm.mjs` 生成、禁止手工编辑**。`graphics` / `mygrapics`
  两棵树共 84 个组件用的 `compileSync` / `useProgram` / `setMeshData` / `uniforms` /
  `createFBO` / `bindFBO` 全来自它；产物与上游 UMD 漂移 = 那 84 个示例静默渲染失败
  （2026-09-24 就是这么坏的）。改了上游 UMD 必须重跑生成器。
- `npm run verify:theme` 是**棘轮（ratchet）**：`scripts/_theme_token_baseline.json` 记录每个文件
  允许的硬编码色值上限，**只允许下降**。改完一批 token 化后跑
  `node scripts/verify-theme-tokens.mjs --update` 收紧基线；
  **不要用 `--update` 让失败消失**，那等于把闸门关掉。静态对比度不达标（< 4.5:1）零容忍、不进基线。
  刻意保留的例外（如压在地图 SDK 自绘白底上的色）写在上一行加 `/* theme-tokens:allow */`。

---

## 6. 本机环境坑（实测）

| 现象 | 处理 |
|---|---|
| 第二次 `vite build` 失败于 `[safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED]`，日志里却已有 `✓ N modules transformed` | **代码没问题**，是清空 `dist/`（3600+ 文件）触发本机批量删除保护（阈值 500）。输出到仓库外：<br>`npx vite build --outDir /tmp/earth-build-verify --emptyOutDir true` |
| 生产构建耗时 7~37 分钟不等 | 用后台任务跑，不要用前台短超时 |
| `npm run typecheck` 报 `TS6053: File 'X.vue' not found`，而该文件确实存在、git 无改动、可读 | **不是类型错误，是并发负载造成的假错**。实测同一份代码：独占机器 **1m24s / 0 错**；同时跑 eslint **17m43s / 报 TS6053**。→ **typecheck 要独占跑**；看到「文件不存在」先怀疑负载，用「`git stash` 改动后对照重跑」或「独占重跑」定论，不要先怀疑自己的改动 |
| E2E 全部用例以「元素找不到」失败，但应用本身正常 | 端口被本机其它项目占用，`reuseExistingServer` 连到了**别人的 dev server**。已改用 `E2E_PORT`（默认 5299）+ `--strictPort`；需要时覆盖 `E2E_PORT` |
| 新增依赖后路由组件完全不挂载、且无报错 | Vite 模块图变脏：`rm -rf node_modules/.vite && npm run dev` |
| `npm run` 用久了 zsh 进入损坏态（`_load_nvm: command not found` / `maximum nested function level reached`） | 直接用绝对路径的 node 跑脚本 |
| `test:e2e` 任务状态显示 failed，但输出里是 `N passed` | npm 收尾清理 `~/.npm/_logs` 被沙箱拦下所致。**看 `N passed`，不看退出状态** |
| preview E2E 中所有 Cesium/示例页「地图引擎加载失败」而 dev 全绿 | 产物缺 `dist/node_modules` 运行时资源：裸 `vite build --outDir X` **不会**执行 `copy-example-deps.js`。补跑 `node scripts/copy-example-deps.js --outDir X`，或直接用 `npm run build` |

---

## 7. 改测试时的三个具体陷阱

1. **`.search-input` 的歧义已随分壳消失，但选择器别改回去**：以前首页有两个
   （顶栏的 + `src/components/SearchBox.vue` 的），断言顶栏必须写
   `.nav-search .search-input`。现在顶栏搜索只存在于 `ResourceShell`，
   `/` 上仅剩 `SearchBox` 那一个，strict mode violation 不再可能发生；
   保留 `.nav-search` 限定是因为它**同时表达了"这是顶栏那条"的意图**，
   改窄会让以后重新引入产品侧搜索时悄悄改测到别的元素。
   该歧义在 dev 下曾因首页渲染慢而侥幸通过，是 preview 才暴露的。
2. **断言「首页是否预载 registry」时，识别正则要排除 `registry/index.js`** ——
   那是 barrel，被 `useExampleFilters` 静态导入，首页请求它属正常；
   只有 11 个**数据分块**才该被拦。
3. **关键词过滤的测试数据要选对**：标题/描述/标签多为中文，实测 `water` / `camera`
   在这三个字段里命中数为 **0**（页面直接空态）。可用：`shader`(27)、`gltf`(184)、`地球`(11)。
   也不要 grep 整个 registry 文件来判断 —— 那会把 `entry` 路径和 `category` 算进去，会误判。

> 补测试的正确顺序：**先让新断言在旧代码上通过，再动重构。** 本项目已有两次靠这个顺序
> 在拆分组件时当场发现真缺陷（滚动锁泄漏、`copyTimer` 未清理）。

---

## 8. 文档地图

| 想知道 | 去哪 |
|---|---|
| 项目介绍、命令、目录结构 | [`README.md`](./README.md) |
| 提交规范、常见改动场景（改/删/改名示例、加环境变量）、红线 | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| 架构与关键机制（示例解析、资源清理、兼容层、分包） | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) |
| **历史坑与不可逆操作** | [`docs/KNOWN_PITFALLS.md`](./docs/KNOWN_PITFALLS.md) |
| 范围声明、待办与优先级 | [`docs/ROADMAP.md`](./docs/ROADMAP.md) |
| TypeScript 整体迁移的范围、批次与进度 | [`docs/TS_MIGRATION.md`](./docs/TS_MIGRATION.md) |
| 治理轮次的已完成项归档 | [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) |
| 部署形态、托管要求与发布前校验 | [`docs/DEPLOY.md`](./docs/DEPLOY.md) |
| three.js 兼容层机制与退出步骤 | [`docs/THREE_UPGRADE.md`](./docs/THREE_UPGRADE.md) |
| 首屏性能基线与测量方法 | [`docs/PERF_BASELINE.md`](./docs/PERF_BASELINE.md) |
| **示例去重 / 缩减的可行性调研（结论：真重复仅 17 条）** | [`docs/DEDUP_RESEARCH.md`](./docs/DEDUP_RESEARCH.md) |
| **示例封面空白的根因排查（含 84 个示例渲染失败的发现过程）** | [`docs/THUMBNAIL_ROOT_CAUSE.md`](./docs/THUMBNAIL_ROOT_CAUSE.md) |
| **graphics / mygrapics 84 个示例渲染失败的根因与修复** | [`docs/GL_RENDERER_FIX.md`](./docs/GL_RENDERER_FIX.md) |
| 脚本分类（质量闸门 / registry 写入 / 一次性） | [`scripts/README.md`](./scripts/README.md) |
| 历史 spec 归档（**路径已失效，仅决策留痕**） | `.trae/specs/`、`.trae/documents/` |

关键源码位置：

```
src/examples/registry/index.ts        # 11 个 registry 按 source 懒加载（注意：getAllExamples() 是同步缓存版，
                                      #   未加载时返回 []，脚本里必须用 getAllExamplesAsync()）
src/examples/registry/provenance.ts   # 按来源的上游溯源登记（手工维护，接入新源必须补一条，有用例闸门）
src/examples/components/index.ts      # 组件「约定路径」解析（import.meta.glob）
src/examples/composables/useGalleryFilters.ts   # 画廊筛选状态机 + URL 同步 + 分页
                                                #   ⚠ 本页滚动容器是 #app，不是 window
src/examples/composables/useExampleFilters.ts   # 技术栈分组 / 子分类定义（改分类的主要修改点）
src/examples/utils/exampleMeta.ts     # 从 id 剥分类前缀推区分尾段（分开 127 组重名标题用）
scripts/lib/example-component.mjs     # 组件约定路径的单一事实来源（生成器与校验器共用）
scripts/lib/registry-guard.mjs        # registry 写入守卫 + --dry-run/--check/--force
```

---

## 9. 文档准确性

- **各类计数会随时间漂移**（示例条数 / `.vue` 文件数 / 组件行数 / 分包体积）。
  需要精确数字时**以实测为准**，不要直接引用文档里的旧值。
- 反过来：**改动会让这些计数变化的代码时，顺手把这些数字改对** ——
  它们分散在 `README.md`、`docs/`、`.github/workflows/ci.yml` 的注释里，不会自动更新。
  例如 `grep -rn '个 \`\.vue\`' README.md docs/ .github/`。
- 历史教训：文档里的「校验项数」「分包机制」这类**结构性描述**一旦滞后，
  比数字过时更危险 —— 会让人按错误的心智模型动手。
  发现即修，不要只在新文档里记一笔。

---

## 10. 提交规范（摘要）

- 提交信息**用中文**，`type(scope): 摘要`；正文说明「**为什么**」，而不只是「改了什么」。
  常用 type：`feat` / `fix` / `refactor` / `perf` / `chore` / `docs` / `test` / `build`。
- **小步提交**，单次提交聚焦一个主题（历史上有过「一次提交 226 个文件」的教训，
  导致 diff 无法审查、回滚困难）。
- 不要把跨天未完成的改动一直留在工作树 —— 工作树长期 dirty 会让进度不可见、且无法回退。
- 可选启用本地钩子（每个克隆执行一次）：`git config core.hooksPath .githooks`
  （只做秒级的凭据扫描，完整校验交给 CI）。
