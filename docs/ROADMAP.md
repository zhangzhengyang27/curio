# 路线图与范围声明

## 0. 范围声明（重要）

**自本文件生效起，示例中心冻结接入新的示例来源。**

理由：项目已从「地球数据可视化应用」蔓延为 11 个来源、1417 条示例的聚合体，
而工程治理（版本控制、CI、测试、文档）严重滞后。继续接新源会持续放大维护成本，
且每个新源都是「半集成」状态（如 `city-realtime-webgl` 的 source 改名后组件路径一度失配）。

允许的动作：修复存量示例、优化已有机制。
需要评审的动作：接入新来源（必须先在本文档登记并说明长期归属）。

---

## 1. 已完成（本轮治理）

| 项 | 说明 |
|---|---|
| 资产保全 | 852 个积压改动按主题拆为 8 个语义化提交，工作树清零；移除指向他人机器路径的 `.npmrc` store-dir |
| 凭据外置 | 百度地图 AK、天地图令牌改为 `VITE_*` 环境变量注入；新增 `check-secrets.mjs` 闸门 |
| 修复静默假通过 | `verify-thumbnails.mjs` 因注册表懒加载改造而静默失效，已修复 |
| 修复真实缺陷 | 校验闸门抓出并修复 **4 个组件路径失配的示例**（2 个 city-realtime-webgl + 2 个 three-cesium） |
| 质量阀门 | 新增 `verify-registry.mjs`、`verify-three-compat.mjs`；修复 `.gitignore` 过宽规则（曾吞掉 `tests/`） |
| E2E 恢复 | 新增 `tests/smoke.spec.js`（5 条核心链路用例），`test:e2e` 不再是空阀门 |
| CI | 新增 `.github/workflows/ci.yml`：凭据扫描 → ESLint → 类型检查 → 三项校验 → 构建 → 冒烟 E2E |
| 文档 | README 重写；新增 ARCHITECTURE / KNOWN_PITFALLS / THREE_UPGRADE / ROADMAP / CONTRIBUTING |
| 兼容层守卫 | 兼容层建立哈希基线 + CI 校验，防止预发布 build 静默漂移 |
| 分包规则修复 | 原 `manualChunks` 在 Rolldown 下已废弃且只有部分生效（three.js 被重复打包进其它 vendor 块，`vendor-cesium` 混入 echarts/theatre/lil-gui 达 8.3 MB）。改用 `codeSplitting.groups` + `priority` 后 15 个分包全部生效，`vendor-three`(1.36 MB)/`vendor-echarts`(1.07 MB)/`vendor-lil-gui`(30 KB) 独立，`vendor-cesium` 降至 696 KB |
| E2E 覆盖生产产物 | 原 E2E 只跑 dev server，测不出分包/产物问题。新增 `E2E_TARGET=preview` 模式，CI 中 dev 与 preview 两种模式都跑 |
| 生成器安全化 | 新增 `scripts/lib/registry-guard.mjs`：5 个会写 registry 的脚本改为「默认拒绝写入 + `--dry-run` 预览 + `--force` 确认」。实测拦下两个生成器的破坏性覆盖（threejs-lesson 丢 29 张封面 + 全部精修文案、earth-lessons 丢 6 张封面），并通过 `preserveCuratedFields()` 根治（保留 title/description/tags/thumbnail/runner） |
| 脚本目录归档说明 | 新增 `scripts/README.md`，区分「质量闸门 / 注册表写入 / 一次性脚本」三类，标明哪些不可重跑 |
| 依赖审计与瘦身 | 新增 `scripts/audit-deps.mjs`（分层扫描 src / public / 配置 / bin / types，排除 CLI 与类型包等假阳性）。据此清掉 **7 个未使用依赖**：`@mediapipe/tasks-vision`（示例走 jsdelivr CDN）、`lottie-web`（同）、`heatmap.js`（示例自带内联实现）、`monomorph`、`solar-calculator`（零引用）、`@vue/eslint-config-prettier`、`@vue/eslint-config-typescript`（eslint 配置未引用）。移除后 28 个包被剪除、锁文件 -651 行，产物模块数与 chunk 数完全不变（5957 modules / 3203 chunks），证明确为死依赖 |

---

## 2. 待办

### P0（未完成，建议优先）

| 项 | 说明 | 备注 |
|---|---|---|
| 建立远端仓库并推送 | 当前仓库 **没有任何 remote**，8 个提交只存在于本机磁盘 | 一次磁盘故障即全部丢失 |
| 轮换已泄露的凭据 | 百度 AK 与天地图令牌曾以明文存在于工作区，应视为已泄露 | 需在对应控制台轮换 + 配置白名单 |
| 首次跑通 CI | 仓库尚无 `.github`，需推送后才能验证流水线 | 依赖安装、`npm ci` 与 lockfile 一致性需实测 |

### P1（技术债）

| 项 | 说明 |
|---|---|
| 拆分巨石组件 | 已抽出 `ExampleCard.vue`：`ExampleGallery.vue` 由 895 行降至 671 行（卡片模板 + 缩略图兜底状态 + 卡片样式全部迁走，缩略图失败状态改为每卡自持）。**仍待拆**：`ExampleGallery.vue` 剩余的筛选状态机与侧栏/分页、`CodeDrawer.vue`（675 行）、`EarthCanvas.vue`（653 行）、`PersonFirstMoveExample.vue`（2081 行）。拆分需配合视觉/交互回归验证，属独立任务 |
| 类型检查完全落地 | 当前 `typecheck:ts` 只覆盖 23 个自有 `.ts` 文件；全部示例仍是 JS 无类型保护，需评估是否值得推进 |
| 示例资源收敛 | 把裸 canvas 示例逐步收口到 `useExampleStage`，减少对 `ExampleHost` 兜底的依赖 |
| 清理 `console.log` | 218 个示例文件含调试日志，建议对应用层代码启用 `no-console`，示例作为参考代码保留 |
| 依赖分层（长期） | 已用 `scripts/audit-deps.mjs` 建立审计口径并清掉 7 个未使用依赖（见「已完成」）。**仍待做**：把「产品运行时依赖」与「1400+ 示例专用依赖」分开管理（例如把纯示例依赖移到可选安装），以控制安装体积与主包大小 |
| three 兼容层退出 | 指定 owner，跟踪 npm `three` 稳定版进度，达成条件后按 `THREE_UPGRADE.md` 退出 |

### P2（体验与工程效率）

| 项 | 说明 |
|---|---|
| 脚本物理归档 | 已在 `scripts/README.md` 用文档区分「质量闸门 / 注册表写入 / 一次性脚本」，但一次性脚本仍与主流程脚本混在同一目录。可进一步移入 `scripts/legacy/`（注意 `test-convert.js` 与 `convert-threejs-official-to-vue.js` 存在 import 依赖，移动时需同步改路径） |
| 生成器输出格式对齐 | 生成器输出与现有 registry 存在**格式差异**（`patch-registry-thumbs.mjs` 会在 `"id"` 后插入空行，生成器不产出），因此 `--dry-run` 会稳定显示 -6 / -29 行的行数差异。对齐格式后，才可能把 `--dry-run` 接进 CI 做「registry 与生成器漂移检测」；当前若直接接入会产生持续噪声 |
| 构建产物瘦身 | 1417 示例 × 2 chunk（组件 + `?raw` 源码）导致产物数量膨胀（当前 3203 个 JS chunk / 34 MB），可评估按需策略 |
| 画廊性能 | 卡片列表的过滤结果缺少记忆化 |
| 超大 vendor 块 | `vendor-spark`(4.8 MB)、`vendor-web-ifc`(3.4 MB) 仍超过 `chunkSizeWarningLimit`；可用 `codeSplitting.groups` 的 `maxSize` 进一步切分（仅在确有收益前不动） |

---

## 3. 明确不做

- 不再接入新的示例来源（见第 0 节）。
- 不为历史遗留的转换产物（`src/examples/components/{webgl,graphics,mygrapics}` 等由 HTML 批量转换而来的示例）
  做逐文件代码风格整改 —— 它们在 ESLint 配置中已被整体豁免，视为「保留原始风格的外部代码」。
- 不追求把 1429 个示例组件全部纳入 TypeScript。
