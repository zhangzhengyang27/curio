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

**数字地球平台**：开场地球 + 平台四页（`/tools` 地图工具箱、`/analysis` 全球数据分析、
`/monitor` 地震应急监测、`/workbench` 分析工作台），另附 ThreeGlobe 示例集与百度地图集成。
两个顶栏外壳（`src/shells/`，由 `App.vue` 按 `route.path` 首段选择）：

| 壳 | 覆盖路由 | 顶栏 |
|---|---|---|
| `ProductShell` | `/`、`/tools`、`/analysis`、`/monitor`、`/workbench` | 5 项平台导航，无搜索框 |
| `ResourceShell` | `/three-globe`、`/bmap` | 2 项（ThreeGlobe / 百度地图） |

> 历史沿革：本仓库曾聚合 11 来源 / 1400+ 条示例（「示例中心」，`/examples`）。
> 2026-10-05~08 分两批迁出至 html5-dataviz 项目，**2026-10-15 整体移除**。
> `src/examples/` 现在只剩 `three-build-compat/` 与 `jsm-compat/` 两个兼容层目录——
> 它们是**产品 three.js 的实际来源**（`import 'three'` 由 vite 的 threeCompatResolver
> 重定向过去），**不能删**，见 R6。原「范围冻结（不再接新源）」声明随移除一同终结。

- 路由表：`/`、`/tools`、`/tools/:slug`、`/analysis`、`/workbench`、`/monitor`、
  `/three-globe`、`/three-globe/:example`、`/bmap`、`/design-kit`。
- 仓库现状：远端 `github.com/zhangzhengyang27/curio`（私有），仅 `main` 分支；CI 已于 2026-10-14 首跑全绿（`.github/workflows/ci.yml`，全链约 25 分钟）。⚠ 到 github.com 直连不稳定，push 可能需多次重试。

---

## 2. 开工前（三条）

1. 安装依赖**必须**带 `--legacy-peer-deps`：
   `npm install --legacy-peer-deps`
   （`three@0.185` 与 `three-good-godrays` / `postprocessing` / `three-tile` 存在 peer 冲突，
   见 KNOWN_PITFALLS C1；CI 走 `npm ci --legacy-peer-deps`。）
2. **先读 [`docs/KNOWN_PITFALLS.md`](./docs/KNOWN_PITFALLS.md)。**
   其中多条是「静默假通过」「静默丢数据」类缺陷 —— 不看会重踩，且踩了很难自查。
3. 动手前 `git status` 确认工作树干净。

---

## 3. 铁律

违反以下任一条，**多数不会产生构建报错**，只会静默出错或丢数据。

| # | 规则 | 原因 |
|---|---|---|
| **R1** | **（已作废 2026-10-15）** registry 生成器与 `verify:drift` 已随示例中心移除；「生成器是唯一事实来源、逐字节漂移检测」的教训见 git 历史与 KNOWN_PITFALLS B1 | — |
| **R2** | **（已作废 2026-10-15）** registry 写入守卫（`--dry-run/--check/--force`）已随示例中心移除 | — |
| **R3** | **（已作废 2026-10-15）** 示例 `id` → 组件文件名约定已随示例中心移除 | — |
| **R4** | **凭据只写 `.env.local`**（已 gitignore）。新增变量要三件事齐做：登记 `.env.example`、在 `env.d.ts` 的 `ImportMetaEnv` 补类型、实现「未配置时优雅降级」。 | `npm run check:secrets` 在本地 git 钩子与 CI 双重拦截。 |
| **R5** | **不要写死本机绝对路径**（配置文件、脚本都不行）。生成脚本用 `new URL('./...', import.meta.url)` 推导。 | 历史上 `.npmrc` 写过他人机器的 `store-dir`，换机器/换 CI 直接失败。 |
| **R6** | **不要改 `node_modules/three` 来「验证」问题** —— 改动不会生效。 | `three` / `three/webgpu` / `three/tsl` 被 `vite.config.ts` 的 `threeCompatResolver` 重定向到 `src/examples/three-build-compat/`；`three/examples/jsm`、`three/addons` → `src/examples/jsm-compat/`。⚠ 示例中心移除后这两个目录**只剩兼容层**，是产品 three.js 的实际来源，更不能动。 |
| **R7** | 分包只用 `codeSplitting.groups`，**不要用 `manualChunks`**。给某个库新增分组前，先确认它是否真的出现在首页/常用页的依赖图里。 | Vite 8 内核是 Rolldown，`manualChunks` 已废弃且**静默失效**；而分组会把库变成**共享 chunk** 并被提升进 `modulepreload` —— 曾因此让首页预载 1.7 MB 用不到的高斯泼溅库。 |
| **R8** | **（已作废 2026-10-15）** 示例删除流程（registry→缩略图→生成器死键）已随示例中心移除 | — |
| **R9** | 不要 `--no-verify` 跳过钩子，不要绕过闸门合代码。 | 闸门失败请修问题，而不是绕开。 |

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
| `npm run test:unit` | 前端纯逻辑单测（Node 内置 `node:test`，`tests/unit/`，零依赖）。命令面板核心等纯状态机放这里；CI 同步跑 |
| `npm run verify` | **一键跑 4 项一致性校验**（见下） |
| `npm run audit:deps` / `node scripts/audit-console.mjs` | 依赖 / console 审计，**只输出线索，不改文件** |

---

## 5. 改完必须跑的闸门

```bash
npm run verify      # 凭据扫描 → three 兼容层 → 主题令牌/对比度 → 令牌关键文字对/placeholder 用法
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
- `npm run verify:theme` 是**棘轮（ratchet）**：`scripts/_theme_token_baseline.json` 记录每个文件
  允许的硬编码色值上限，**只允许下降**。改完一批 token 化后跑
  `node scripts/verify-theme-tokens.mjs --update` 收紧基线；
  **不要用 `--update` 让失败消失**，那等于把闸门关掉。静态对比度不达标（< 4.5:1）零容忍、不进基线。
  刻意保留的例外（如压在地图 SDK 自绘白底上的色）写在上一行加 `/* theme-tokens:allow */`。
- `npm run verify:contrast` 守 **theme.css 令牌值本身**（`verify:theme` 管组件字面量，两者分工写在两脚本头注释）：
  12 对关键文字对双主题 WCAG 实测 ≥ 4.5:1 + 全仓 `::placeholder` 只允许
  `--cu-on-surface[-variant]`（placeholder 是对比度事故惯犯——M2 终审 CommandPalette 1.9:1、
  M3a 终审 SearchBox 1.91:1 都曾无闸门可见）。清单勿删，失败请改令牌值。

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
| 仓库目录改名后（09-29 实测 `earth-app` → `curio`），已开会话的 shell 持久化 cwd 仍钉在旧路径，每条命令 spawn 报 `ENOENT` | 先用 Write 工具往**旧路径**写一个占位文件把目录撑起来（Write 会自动建父目录），shell 即恢复；此后每条命令以 `cd <新路径> &&` 开头，在最后一条命令里删掉占位目录。改名后同时 `rm -rf node_modules/.vite`（缓存含绝对路径，不清会导致 dev/build 异常） |

---

## 7. 改测试时的三个具体陷阱

1. **`.search-input` 的歧义已随分壳消失，但选择器别改回去**：以前首页有两个
   （顶栏的 + `src/components/SearchBox.vue` 的），断言顶栏必须写
   `.nav-search .search-input`。现在顶栏搜索只存在于 `ResourceShell`，
   `/` 上仅剩 `SearchBox` 那一个，strict mode violation 不再可能发生；
   保留 `.nav-search` 限定是因为它**同时表达了"这是顶栏那条"的意图**，
   改窄会让以后重新引入产品侧搜索时悄悄改测到别的元素。
   该歧义在 dev 下曾因首页渲染慢而侥幸通过，是 preview 才暴露的。
> 补测试的正确顺序：**先让新断言在旧代码上通过，再动重构。** 本项目已有两次靠这个顺序
> 在拆分组件时当场发现真缺陷（滚动锁泄漏、`copyTimer` 未清理）。
>
> （2026-10-15 注：原第 2、3 条——「registry 预载断言要排除 barrel」「关键词过滤测试
> 数据要选对」——随示例中心与对应用例移除而失效，教训原文见 git 历史。）

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
| **示例去重 / 缩减的可行性调研（结论：真重复仅 17 条；示例中心已移除，仅历史留痕）** | [`docs/DEDUP_RESEARCH.md`](./docs/DEDUP_RESEARCH.md) |
| **示例封面空白的根因排查（含 84 个示例渲染失败的发现过程；仅历史留痕）** | [`docs/THUMBNAIL_ROOT_CAUSE.md`](./docs/THUMBNAIL_ROOT_CAUSE.md) |
| **graphics / mygrapics 84 个示例渲染失败的根因与修复（仅历史留痕）** | [`docs/GL_RENDERER_FIX.md`](./docs/GL_RENDERER_FIX.md) |
| 脚本分类（质量闸门 / registry 写入 / 一次性） | [`scripts/README.md`](./scripts/README.md) |
| 历史 spec 归档（**路径已失效，仅决策留痕**） | `.trae/specs/`、`.trae/documents/` |

关键源码位置：

```
src/map/cesiumLoader.ts               # Cesium 动态加载（window.Cesium），生产依赖 copy-example-deps 拷入的 Build 产物
src/shells/                           # 双外壳：ProductShell（平台）/ ResourceShell（ThreeGlobe+bmap）
src/composables/commandPaletteCore.ts # 首页命令面板纯核心（tests/unit 覆盖）
src/utils/legacyStorage.ts            # 存储键 cu-* 一次性迁移协议
scripts/verify-three-compat.mjs       # three 兼容层哈希基线守卫（--update 更新）
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
