# Curio 大厂级重塑 · M4 实施计划(代码收尾)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 spec §7 代码质量线:`tv-` 前缀全量清零(含 4 个存储键的带迁移改名)、`EarthView.vue`(814 行)拆分至 <300 行、两项终审遗留小项,全闸门后合并收官。

**Architecture:** 机械改名类任务以「grep 归零 + 全闸门」验收;存储键迁移统一模式 = init 读旧键回填新键并清除旧键,`index.html` 预置脚本与 `useThemeStore` 双向同步(spec §7.1 注明的耦合点);EarthView 拆分按「行为等价 + E2E 选择器冻结」验收。

**Tech Stack:** 同 M3b。

**Spec:** [docs/superpowers/specs/2026-09-29-curio-premium-redesign-design.md](../specs/2026-09-29-curio-premium-redesign-design.md) §7;2026-09-30 重测底账:纯样式 `tv-glass-panel`×30 / `tv-num`×9 / `tv-card-hover`×2,存储键 `tv-theme`×7 / `tv-monitor-status-v2`×4 / `tv-map-bookmarks`×2 / `tv-map-annotations`×2,DOM 钩子 `tv-echarts-full`×2 / `tv-html-anchor`×1 / `tv-mo`×1(待查证),合计 60 处 / 37 文件。

## Global Constraints(沿用全部既有条款)

- registry / src/examples/components/** 不碰;E2E 选择器与 `data-testid` 冻结(改测试文件中的**存储键字面量**不算改选择器);
- `index.html` 预置脚本与 `useThemeStore` 的键读取逻辑必须逐字同步(两处都要「读新键 → 回退旧键 → 迁移」);
- 钩子类更名前必须 grep tests/scripts/同文件 JS 引用;`querySelector` 字符串与模板类名同步改;
- EarthView 拆分不改任何 `data-testid` / 类名 / 事件行为;`viz-loading`/`viz-error`/`.viz-btn`/`.bottom-bar` 等全部原样;
- 每任务收尾跑受影响面 spec;Task 6 全闸门。

## Review Focus

1. **键名迁移后老用户偏好丢失**(只写新不读旧)→ Task 2 的迁移逻辑 + 预置脚本同步是审查重点。
2. **`index.html` 与 store 的读取逻辑漂移**(一处迁移一处不迁移 → 首帧暗色判定与挂载后判定不一致,闪白回归)→ Task 2 双处 diff 并排审。
3. **EarthView 拆分行为漂移**(GIF 录制清理、巡游还原、hash 竞态守卫被搬丢)→ Task 4 以 earth 系 5 spec + tour + url-state 全绿为验收。
4. **钩子类改名弄破 tools-examples 示例**(JS querySelector 与模板类名不同步)→ Task 3 逐文件内自洽 + map-tools/tools-examples spec。
5. **机械改名撞上 E2E 冻结类名**(`tv-num` 若被 spec 引用)→ Task 1 改名前 grep tests/。

---

### Task 1: 纯样式类机械改名(tv-glass-panel / tv-num / tv-card-hover → cu-*)

**Files:** Modify: `src/styles/theme.css`(定义处)+ 全部用点(grep 定位);前置:grep tests/ 确认无 spec 引用这三类名

- [ ] Step 0: `grep -rn "tv-glass-panel\|tv-num\|tv-card-hover" tests/` 确认零引用(有则先裁决)
- [ ] Step 1: theme.css 定义改名(`.tv-glass-panel`→`.cu-glass-panel`、`.tv-num`→`.cu-num`、`.tv-card-hover`→`.cu-card-hover`,含 html.dark 分支);注意:GlassPanel 组件用的是 `.cu-glass` 独立类,两者不冲突
- [ ] Step 2: 全部用点批量替换;`grep -rE "\btv-(glass-panel|num|card-hover)" src index.html` 归零
- [ ] Step 3: `npm run verify` + typecheck + 全量 E2E(dev 后台)
- [ ] Step 4: **Commit** `refactor(theme): tv- 纯样式类全量更名 cu-*(机械改名,行为零变化)`

### Task 2: 存储键迁移(4 键统一模式:读旧 → 回填新 → 清旧)

**Files:** Modify: `src/stores/useThemeStore.ts`、`index.html`、`src/map/monitor/useEarthquakeFeed.ts`、`src/map/bookmarks.ts`、`src/map/tools/mapToolsController.ts`、`tests/design-kit.spec.ts`、`tests/example-gallery-facets.spec.ts`、`tests/monitor.spec.ts`、`tests/map-tools.spec.ts`

- [ ] Step 1: `useThemeStore.init`:读 `cu-theme` → 无则回退 `tv-theme` 并写入 `cu-theme`、清除 `tv-theme`;`apply` 写 `cu-theme`;`index.html` 预置脚本同逻辑(读新→回退旧→顺手迁移,一行不差地镜像 store)
- [ ] Step 2: `useEarthquakeFeed` 的 `tv-monitor-status-v2`、`bookmarks.ts` 的 `tv-map-bookmarks`、`mapToolsController.ts` 的 `tv-map-annotations` 同模式迁移(各文件内私有函数封装读写);对应 4 个测试文件的键字面量同步为 `cu-*`
- [ ] Step 3: 跑 design-kit / example-gallery-facets / monitor / map-tools 四 spec + 手动验证「旧键存在时首访迁移后偏好保留」(Node 内无法仿真 localStorage,以代码评审 + E2E 全绿兜底,记 ledger)
- [ ] Step 4: **Commit** `refactor(theme): 存储 4 键更名 cu-* 并带一次性迁移,预置脚本与 store 镜像同步`

### Task 3: DOM 钩子类查证与更名

**Files:** Modify: 查证后涉及的文件(`src/views/tools-examples/HtmlOverlayExample.vue`、`EchartsOverlayExample.vue`、以及 `tv-mo` 所在文件)

- [ ] Step 0: 逐一 grep 每个钩子类在**同文件 JS**(querySelector/hasClass)与 tests/scripts 的引用,登记进 ledger
- [ ] Step 1: 引用自洽的更名(`tv-echarts-full`→`cu-echarts-full` 等);`tv-mo` 查明身份后处理
- [ ] Step 2: 跑 tools-examples / map-tools spec;`grep -rE "\btv-[a-z0-9-]" src index.html scripts tests` **全仓归零**
- [ ] Step 3: **Commit** `refactor: tv- 前缀全仓清零,DOM 钩子类更名 cu-*`

### Task 4: EarthView 拆分(814 → <300 行,行为等价)

**Files:**
- Create: `src/components/VizModeBar.vue`(底部模式条:模板段 + vizModes 数组 + switchViz/openFileImport + `.viz-btn` 系样式)
- Create: `src/composables/useGifRecorder.ts`(GIF 录制整块:常量/帧采集/编码/清理)
- Create: `src/composables/useEarthUrlSync.ts`(hash 白名单侦听 + currentVisualization→hash replaceState + 'default' 豁免)
- Modify: `src/views/EarthView.vue`(消费以上三者;palette groups 迁往 `src/composables/usePaletteGroups.ts`)

- [ ] Step 0: 通读 EarthView 现文,列出各块的依赖清单(earthCanvasRef 是共享依赖 → 以参数注入 composable,不引入新 store)
- [ ] Step 1: 提取 `useGifRecorder`(纯逻辑,earthCanvasRef 注入)+ `useEarthUrlSync`(依赖 earthStore + tour 状态守卫,tour 守卫以 getter 注入)
- [ ] Step 2: 提取 `VizModeBar.vue`(props: modes/current/loading;emits: switch/import;保留 `.viz-btn`/`.bottom-bar` 类名与全部样式;GlassPanel 外壳留在 EarthView 还是移入以「`.bottom-bar` 类落在根元素」为准)
- [ ] Step 3: 提取 `usePaletteGroups`(依赖 handlers 以对象注入)
- [ ] Step 4: EarthView 收敛 <300 行;`wc -l` 留档
- [ ] Step 5: 跑 earth 全系 spec(smoke/url-state/viz-loading/tour/earth-split/earth-geo-index/earth-postfx/earth-gl-*/earth-picking/earth-layer-build)+ command-palette
- [ ] Step 6: **Commit** `refactor(earth): EarthView 拆分——VizModeBar/useGifRecorder/useEarthUrlSync/usePaletteGroups(行为等价,选择器冻结)`

### Task 5: 两项终审遗留小项

**Files:** Modify: `src/views/ThreeGlobeGallery.vue`(卡片 hover 收敛到 -2px/shadow-2/主色描边语法)、`src/components/SearchBox.vue`(占位文案「搜索坐标、地点或数据...」→「搜索地点...」,与能力诚实一致)

- [ ] Step 1: 改 + 跑画廊三 spec / earth-geo-index;**Commit** `style: 三球画廊 hover 收敛按钮语法;SearchBox 占位文案诚实化`

### Task 6: 收官闸门 + 终审 + 合并

- [ ] verify 八环 / typecheck 独占 / lint:ci / build+copy 后台 / preview + dev 全量 E2E
- [ ] fresh review 全分支(M0 起的完整重塑由 M3b 已分段终审,M4 终审范围 = 本分支 diff)→ 修复 → 合并 main → 更新 README/docs 中受影响计数
