# scripts 目录说明

本目录承载三类东西，**用途与风险差别很大**，动手前请先看清属于哪一类：

| 类别 | 说明 | 是否可随时重跑 |
|---|---|---|
| **A. 质量闸门** | CI 与 `npm run verify` 使用的校验脚本 | ✅ 只读，安全 |
| **B. 注册表写入** | 生成 / 改写 `src/examples/registry/*.js` | ⚠ **受 registry-guard 保护**，需显式确认 |
| **C. 一次性脚本** | 历史转换、修复补丁、诊断调试 | ❌ 多数只在当时有效，**不要重跑** |

---

## A. 质量闸门（只读，CI 使用）

| 脚本 | 作用 |
|---|---|
| `check-secrets.mjs` | 扫描明文凭据（AK / Token / 私钥） |
| `verify-registry.mjs` | 注册表主键唯一、字段完整、**组件文件按命名约定命中** |
| `verify-thumbnails.mjs` | 非空 thumbnail 对应的封面文件是否存在（防线上破图） |
| `verify-three-compat.mjs` | three.js 本地兼容层的哈希基线守卫（`--update` 可更新基线） |
| `audit-deps.mjs` | 依赖使用情况审计（`npm run audit:deps`）。分层扫描 src / public / 配置 / bin / types，输出「未检测到引用」的候选清单；**只输出线索、不改 package.json** |
| `copy-example-deps.js` | 构建后把示例依赖拷进产物（`npm run build` 的一部分） |

## B. 注册表写入脚本（⚠ 需显式确认）

> **约定**：所有会写 `src/examples/registry/*.js` 的脚本都必须经过
> `lib/registry-guard.mjs`，行为是：
>
> ```bash
> node scripts/<脚本>              # 拒绝写入并说明原因（默认安全）
> node scripts/<脚本> --dry-run    # 只预览影响，不落盘  ← 重跑前先跑这个
> node scripts/<脚本> --force      # 确认后写入
> ```
>
> `--dry-run` 会打印目标文件的行数 / 条目数 / 缩略图数量的前后对比，
> 便于发现「这次重跑会丢什么」。

| 脚本 | 写入对象 | 风险说明 |
|---|---|---|
| `generate-registry.js` | `threeCesiumExamples.js`、`cesiumExamples.js` | 自带合并保护，会保留手工字段；相对安全 |
| `generate-threejs-lesson-registry.js` | `threejsLesson.js` | 按磁盘 `.js` 扫描重建条目集合，会整体重写顺序与格式 |
| `generate-earth-lessons-registry.js` | `earthLessons.js` | 同上 |
| `improve-example-meta.mjs` | 指定 source 的 registry | 重写 `title` / `description` / `tags`；用法 `[source] [--dry-run\|--force]` |
| `patch-registry-thumbs.mjs` | 全部 registry | 按 `_thumb_map.json` 回填 `thumbnail` |

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

## C. 一次性脚本（不建议重跑）

| 组 | 脚本 | 说明 |
|---|---|---|
| 示例转换 | `convert-*.js` / `convert-*.cjs`、`migrate-mygrapics-cleanup.cjs`、`sync-vue-runners.js`、`gen-cesium-shim.js` | 把外部示例源批量转成 Vue 组件，产物已入库；重跑需先确认源目录仍存在 |
| 修复补丁 | `fix-base-var-declarations*.cjs`、`fix-conversion-artifacts.js`、`fix-graphics-cleanup.cjs`、`fix-missing-controls.cjs`、`fix-webgl-conversion-bugs.cjs`、`patch-convert-*.cjs`、`upgrade-glmatrix-legacy.cjs` | 针对当时转换产物的一次性修正，已完成 |
| 截图流水线 | `screenshot-examples.mjs`、`download-threejs-screenshots.mjs`、`_thumb_map.json` | 生成封面；重跑后需 `patch-registry-thumbs.mjs` 回填 |
| 诊断 / 试验 | `debug-*.js/mjs`、`build-diagnostics.js`、`diag-failures.js`、`scan-*.js`、`test-convert.js`、`test-dedup.mjs`、`test-function-map.js`、`test-implicit-decl.mjs` | 一次性排查工具 |
| 历史校验（Python 等） | `verify-examples*.py`、`verify-godrays.py`、`verify-webcam.py`、`verify-webgl-examples.cjs`、`verify-three-cesium-vue-examples.js`、`verify-earth-lessons.py`、`verify-examples-screenshot.py` | 早于当前 CI 校验体系的自建脚本，已被 `verify-*.mjs` 取代，保留作参考 |

> `scripts/` 下的 `.js` / `.mjs` / `.cjs` 在 ESLint 中被整体放宽（允许未使用变量），
> 它们属于工具脚本，不参与应用代码的质量约束。

## lib/

| 文件 | 作用 |
|---|---|
| `lib/registry-guard.mjs` | 写入守卫 + 命令行开关解析 + `preserveCuratedFields()` 字段保留 |
