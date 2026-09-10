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
| 拆分巨石组件 | `ExampleGallery.vue`（895 行）、`CodeDrawer.vue`（675 行）、`EarthCanvas.vue`（653 行）、`PersonFirstMoveExample.vue`（2081 行） |
| 类型检查完全落地 | 当前 `typecheck:ts` 只覆盖 23 个自有 `.ts` 文件；全部示例仍是 JS 无类型保护，需评估是否值得推进 |
| 示例资源收敛 | 把裸 canvas 示例逐步收口到 `useExampleStage`，减少对 `ExampleHost` 兜底的依赖 |
| 清理 `console.log` | 218 个示例文件含调试日志，建议对应用层代码启用 `no-console`，示例作为参考代码保留 |
| 依赖分层 | 区分「示例专用依赖」与「产品运行时依赖」，控制安装体积与主包大小 |
| three 兼容层退出 | 指定 owner，跟踪 npm `three` 稳定版进度，达成条件后按 `THREE_UPGRADE.md` 退出 |

### P2（体验与工程效率）

| 项 | 说明 |
|---|---|
| 脚本归档 | `scripts/` 下 19 个一次性 `convert-*` / `fix-*` 脚本建议移入 `scripts/legacy/`，保留可重复运行的进入主流程 |
| 生成器 `--check` 模式 | 让 registry 生成器支持「只校验不写入」，在 CI 中检测 registry 与生成器不一致 |
| 构建产物瘦身 | 1417 示例 × 2 chunk（组件 + `?raw` 源码）导致产物数量膨胀，可评估按需策略 |
| 画廊性能 | 卡片列表的过滤结果缺少记忆化 |

---

## 3. 明确不做

- 不再接入新的示例来源（见第 0 节）。
- 不为历史遗留的转换产物（`src/examples/components/{webgl,graphics,mygrapics}` 等由 HTML 批量转换而来的示例）
  做逐文件代码风格整改 —— 它们在 ESLint 配置中已被整体豁免，视为「保留原始风格的外部代码」。
- 不追求把 1429 个示例组件全部纳入 TypeScript。
