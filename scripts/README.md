# scripts 目录说明

本目录承载三类东西，**用途与风险差别很大**，动手前请先看清属于哪一类：

| 类别 | 说明 | 是否可随时重跑 |
|---|---|---|
| **A. 质量闸门** | CI 与 `npm run verify` 使用的校验脚本 | ✅ 只读，安全 |
| **B. 注册表写入** | 生成 / 改写 `src/examples/registry/*.js` | ⚠ **受 registry-guard 保护**，需显式确认 |
| **C. 一次性脚本** | 历史转换、修复补丁、诊断调试，已归档到 `legacy/` | ❌ 多数只在当时有效，**不要重跑** |

---

## A. 质量闸门（只读，CI 使用）

| 脚本 | 作用 |
|---|---|
| `check-secrets.mjs` | 扫描明文凭据（AK / Token / 私钥） |
| `verify-registry.mjs` | 注册表主键唯一、字段完整、**组件文件按命名约定命中** |
| `npm run verify:drift` | **registry 与生成器漂移检测**：依次以 `--check` 跑下面 3 个生成器，逐字节比对生成结果与已提交文件。四个 registry（`threeCesiumExamples` / `cesiumExamples` / `threejsLesson` / `earthLessons`）当前均为 0 漂移 |
| `verify-thumbnails.mjs` | 非空 thumbnail 对应的封面文件是否存在（防线上破图） |
| `verify-three-compat.mjs` | three.js 本地兼容层的哈希基线守卫（`--update` 可更新基线） |
| `verify-theme-tokens.mjs` | 主题令牌棘轮 + 静态 WCAG 对比度守卫（`npm run verify:theme`）。逐文件统计绕过 `--tv-*` 的硬编码色值，**只允许比 `scripts/_theme_token_baseline.json` 更少**；同一条规则里 `color` 与 `background` 均为字面量且对比度 < 4.5:1 时直接失败（不进基线、零容忍）。`--report` 看清单，`--update` 收紧基线。豁免写在被豁免行的**上一行**：`/* theme-tokens:allow */`。排除 `src/examples/components/**`（三方抓取）、vendored 构建产物、`theme.css`（令牌定义）、`code-highlight.css`（语法配色表）。**注意**：`var(--tv-x, #hex)` 里的 `#hex` 是回退值不是违规，脚本已剔除 |
| `audit-deps.mjs` | 依赖使用情况审计（`npm run audit:deps`）。分层扫描 src / public / 配置 / bin / types，输出「未检测到引用」的候选清单；**只输出线索、不改 package.json** |
| `audit-console.mjs` | 示例层 console 调用分类审计（`node scripts/audit-console.mjs [目录]`）。按「错误/告警/ElMessage 替代/教学演示输出/疑似噪声」分类；**只输出线索、不改文件** |
| `audit-pages.mjs` | 数字地球平台四页巡检（`node scripts/audit-pages.mjs`，需 dev server 已跑在 5173）。逐页检查 load-error / canvas / pageerror / HTTP≥400；**只输出线索、不改文件** |
| `copy-example-deps.js` | 构建后把示例依赖拷进产物（`npm run build` 的一部分） |

## B. 注册表写入脚本（⚠ 需显式确认）

> **约定**：所有会写 `src/examples/registry/*.js` 的脚本都必须经过
> `lib/registry-guard.mjs`，行为是：
>
> ```bash
> node scripts/<脚本>              # 拒绝写入并说明原因（默认安全）
> node scripts/<脚本> --dry-run    # 只预览影响，不落盘  ← 重跑前先跑这个
> node scripts/<脚本> --check      # 只读：比对生成结果与磁盘文件，漂移则退出码 1
> node scripts/<脚本> --force      # 确认后写入
> ```
>
> `--dry-run` 会打印目标文件的行数 / 条目数 / 缩略图数量的前后对比，
> 便于发现「这次重跑会丢什么」。
>
> `--check` 是**逐字节**比对（`npm run verify:drift` 与 CI 都在用），
> 比 `--dry-run` 的行数统计严格得多：只改字段顺序、只改文案这类
> 「行数不变」的漂移，`--dry-run` 看不出来，`--check` 能抓到。
> 字段顺序的唯一事实来源是生成器，所以**不要手工调整 registry 的格式**，
> 有改动请改生成器后重跑。

| 脚本 | 写入对象 | 风险说明 |
|---|---|---|
| `generate-registry.js` | `threeCesiumExamples.js`、`cesiumExamples.js` | 自带合并保护，会保留手工字段；相对安全。**只登记已转换为 Vue 组件的条目**（与校验闸门同用 `lib/example-component.mjs` 判断），未转换的会跳过并列出 |
| `generate-threejs-lesson-registry.js` | `threejsLesson.js` | 按磁盘 `.js` 扫描重建条目集合，会整体重写顺序与格式 |
| `generate-earth-lessons-registry.js` | `earthLessons.js` | 同上 |
| `improve-example-meta.mjs` | 指定 source 的 registry | 重写 `title` / `description` / `tags`；用法 `[source] [--dry-run\|--force]` |
| `patch-registry-thumbs.mjs` | 全部 registry | 按 `_thumb_map.json` **就地更新** `thumbnail` 的值（不移动字段位置，重跑幂等） |

### 已内置的字段保留

`generate-*` 系列在写入前会调用 `preserveCuratedFields()`，按 `category/id` 保留已有条目的：

`title` · `description` · `tags` · `thumbnail` · `runner`

原因（实测取证，见 `--dry-run` 输出）：

- 生成器不产出封面（封面来自截图流水线），历史上会把
  threejs-lesson 的 29 张、earth-lessons 的 6 张封面全部抹掉；
- 生成器产出的 `description` 是模板文案、`tags` 是 `[source, id]` 原始值，
  会覆盖 `improve-example-meta.mjs` 精修并经人工校对的结果；
- 生成器的 `runner` 由 `hasVueComponent()` 推导，会在组件缺失时写 `iframe`，
  而项目不变量是全部 `vue`。

**新增条目不受影响**：现有文件中不存在的条目仍由生成器正常产出。

## C. 一次性脚本 → `scripts/legacy/`（不建议重跑）

历史遗留的一次性脚本已统一归档到 **`scripts/legacy/`**，从 38 个文件的平铺改为按用途分组存放。
**不要重跑它们**：多数只对当时的源数据/产物有效，重跑前需先确认前置条件仍然成立。

| 组 | 代表脚本 | 说明 |
|---|---|---|
| 示例转换 | `convert-*.js` / `convert-*.cjs`、`migrate-mygrapics-cleanup.cjs`、`sync-vue-runners.js`、`gen-cesium-shim.js` | 把外部示例源批量转成 Vue 组件；产物已入库，源码目录未必还在 |
| 修复补丁 | `fix-base-var-declarations*.cjs`、`fix-conversion-artifacts.js`、`fix-graphics-cleanup.cjs`、`fix-missing-controls.cjs`、`fix-webgl-conversion-bugs.cjs`、`patch-convert-*.cjs`、`upgrade-glmatrix-legacy.cjs` | 针对当时转换产物的一次性修正，已完成 |
| 诊断 / 试验 | `debug-*.js/mjs`、`build-diagnostics.js`、`diag-failures.js`、`scan-*.js`、`test-convert.js`、`test-dedup.mjs`、`test-function-map.js`、`test-implicit-decl.mjs` | 一次性排查工具 |
| 历史校验 | `verify-examples*.py`、`verify-godrays.py`、`verify-webcam.py`、`verify-earth-lessons.py`、`verify-webgl-examples.cjs`、`verify-three-cesium-vue-examples.js`、`test-*-cesium*.py`（原在 `tests/`，2026-09 迁入）、`verify-examples.mjs`（早期截图脚本，`screenshot-examples.mjs` 的前身，写死端口 5183） | 早于当前 CI 校验体系的自建脚本，已被 `verify-*.mjs` 取代，保留作参考 |
| 数据清单 | `threejs-official-assets-manifest.json`、`threejs-official-manual-review.json` | 仅被 `legacy/` 内的脚本读取 |

> ⚠ 归档时已同步修正 `legacy/` 内指向 `scripts/` 的硬编码路径。
> 若将来再移动脚本，请一并 grep `'scripts/` 与 `path.join(root, 'scripts'` 确认没有断链。

### 仍留在 `scripts/` 的截图流水线

| 脚本 | 作用 |
|---|---|
| `screenshot-examples.mjs` | 用 Playwright + swiftshader 批量截封面（支持 `--overwrite` / `--only-failed`） |
| `download-threejs-screenshots.mjs` | 从 threejs.org 下载官方示例截图 |
| `_thumb_map.json` | 截图清单，被上面两个脚本与 `patch-registry-thumbs.mjs` 共用 |
| `patch-registry-thumbs.mjs` | 把清单回填进 registry（受 registry-guard 保护） |

> `scripts/` 下的 `.js` / `.mjs` / `.cjs`（含 `legacy/`）在 ESLint 中被整体放宽（允许未使用变量），
> 它们属于工具脚本，不参与应用代码的质量约束。

## lib/

| 文件 | 作用 |
|---|---|
| `lib/registry-guard.mjs` | 写入守卫 + 命令行开关解析（`--dry-run` / `--check` / `--force`）+ `preserveCuratedFields()` 字段保留 |
| `lib/example-component.mjs` | 示例组件「约定路径」解析的**单一事实来源**。`generate-registry.js` 与 `verify-registry.mjs` 共用，避免两边各写一份后判断不一致 |
