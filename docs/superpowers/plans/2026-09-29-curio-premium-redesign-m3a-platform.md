# Curio 大厂级重塑 · M3a 实施计划(平台四页 + 公共件)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已批准 spec §6.3 完成平台四页(tools / analysis / monitor / workbench)+ bmap 分类的重塑铺开,收编终审延后 Minor,并把对比度检查转正为常驻闸门。

**Architecture:** 延续 M0–M2 语法:GlassPanel / 状态三件套 / CuButton / 令牌先行;新增 `PageHeader` 统一页头;`verify:contrast` 转正进 `npm run verify` 与 CI,让「零容忍」有常驻执行体。E2E 选择器继续冻结。

**Tech Stack:** 同 M0–M2(Vue 3.5 script setup TS、纯 CSS 令牌、Playwright、node:test)。

**Spec:** [docs/superpowers/specs/2026-09-29-curio-premium-redesign-design.md](../specs/2026-09-29-curio-premium-redesign-design.md) §6.3;输入还包括 [M0 审计](../specs/2026-09-29-m0-audit.md) 的 P0/P1 行与终审延后 Minor。

**范围裁定:** 示例库壳层(/examples、/three-globe、双搜索合并、画廊卡片)归 **M3b 另立计划**;首页图层面板死空间一并收进本计划 Task 8(改动极小)。

## Global Constraints(与 M0–M2 相同,逐条携带)

- 静态对比度 ≥ 4.5:1 双主题零容忍;`theme-tokens:allow` 豁免需上一行注释;`verify:theme` 棘轮只紧不松;
- E2E 选择器冻结:`.app-nav`、`.nav-search .search-input`、全部既有 `data-testid`(含 `country-search` / `country-list` / `metric-tab-*` / `trend-chart` / `tools-gallery` / `tools-example-card` / `reset-drill` 等)不改名;
- `--cu-top-nav-height: 56px` 不变;PC-only `min-width: 1024`;不引第三方组件库;
- 1421 个示例组件、registry、各页 ECharts/地图数据逻辑不动(只动壳层与图表**样式**配置);
- 传给 ECharts/地图 SDK 的 JS 数据色(如 `#2271b2`)不在令牌棘轮范围,不为降数字而改;
- typecheck 独占跑;build 输出仓外 /tmp;E2E_PORT 5299;提交中文、小步、单主题;
- 新 CSS 一律 `var(--cu-*)`;组件禁止裸秒数 transition(Task 8 的豁免注释约定落地后按约定写)。

## Review Focus

1. **平台页既有 E2E 依赖的选择器/类名被重塑顺手改掉** → 后台静默红。每个页面任务收尾必跑该页对应 spec(映射见各任务)。
2. **ECharts 配置改动破坏图表功能**(label formatter 改动可能吃掉数值语义)→ Task 5 必须保留 `formatValue` 语义或等价 compact,workbench.spec.ts 全绿为证。
3. **bmap 分组重构破坏深链/激活逻辑**(`个性化地图` 等 chip 是路由/激活状态)→ map-tools.spec / tools-examples.spec 全绿为证。
4. **对比度转正脚本误报**(把 ECharts/SDK 的 JS 色当 CSS 扫)→ 脚本只解析 `theme.css` 令牌值 + 内置对清单,不扫全仓;Task 1 的破坏性自检通过为证。
5. **GlassPanel `:where()` 降特异性改变了既有页面的覆写结果** → Task 8 后跑 earth/design-kit/smoke 三件套。

---

### Task 1: 对比度脚本转正为常驻闸门

**Files:**
- Create: `scripts/verify-contrast.mjs`
- Modify: `package.json`(scripts 增 `verify:contrast`,verify 串末尾追加)
- Modify: `.github/workflows/ci.yml`(主题守卫步骤后加一步)
- Modify: `scripts/verify-theme-tokens.mjs` 头注释(提一句分工:它管字面量棘轮,verify-contrast 管令牌值对)

**Interfaces:**
- Produces: `npm run verify:contrast`(退出码 0/1);从 `src/styles/theme.css` 解析 `--cu-*` 值(含 `html.dark` 覆写),对内置「关键文字对清单」(M0 的 12 对 + placeholder 4 对 + glow 数据色 5 对)逐对算 WCAG,任一文字对 <4.5 退出码 1。

- [ ] **Step 1: 写脚本**(以 /tmp/cu-contrast.mjs 为底,改三处:①令牌值不再硬编码,用正则从 theme.css 的 `:root` 与 `html.dark` 块提取对应变量值,rgba() 半透明表面先按各自 `--cu-background` 合成;②失败输出到 stderr 并 exit 1;③头部注释写明「只对 theme.css 令牌值,不扫组件——字面量棘轮在 verify-theme-tokens.mjs」)
- [ ] **Step 2: 破坏性自检(RED)**:临时把 `html.dark` 的 `--cu-on-surface-variant` 改成 `#555555`,跑 `npm run verify:contrast` → 必须非零退出并列出失败对;还原后复跑 → 0
- [ ] **Step 3: 接线**:package.json 两处 + CI 步骤(名称「令牌对比度守卫(关键文字对)」),`npm run verify` 全量跑一遍确认七环变八环
- [ ] **Step 4: Commit** `build(gate): 对比度令牌对检查转正常驻闸门,纳入 verify 与 CI`

### Task 2: PageHeader 组件 + DesignKit 展示

**Files:**
- Create: `src/components/ui/PageHeader.vue`;Test: `tests/design-kit.spec.ts` 追加用例;Modify: `src/views/DesignKitView.vue`、`src/views/MapToolsGallery.vue`

**Interfaces:**
- Produces: `<PageHeader title="string" :count?="number" countLabel?="string">` + `#actions` 插槽;根类 `.cu-page-header`,含 `h1.cu-page-header__title`(display 字阶 `--cu-fs-3xl`、weight 600)、描述行、右侧动作区。

- [ ] **Step 1: RED**——design-kit.spec 追加「PageHeader 渲染标题与 actions 插槽」用例,跑 → FAIL
- [ ] **Step 2: 实现**(标题 600 字重——spec §4.3 标题字重收敛的落点;count 显示为 `.cu-num` + 数据语义色高亮数字);DesignKit 加段落;MapToolsGallery 的 `.gallery-header` 换用 PageHeader(title=地图工具箱,desc 原文案,count=TOOLS_EXAMPLES.length,countLabel=个工具)
- [ ] **Step 3: GREEN** + 跑 `tests/tools-examples.spec.ts`(data-testid 全保留)
- [ ] **Step 4: Commit** `feat(ui): PageHeader 统一页头组件,工具箱页接入`

### Task 3: /tools 卡片媒体区质感升级(M0 审计 P1「占位块感」)

**Files:** Modify: `src/views/MapToolsGallery.vue`(`<style>` 的 `.card-media` / `.card-icon-chip`)

- [ ] **Step 1:** `.card-media` 从「单 radial 微光」升级为「细网格线纹理 + 底部主色光晕」:`background: linear-gradient(color-mix(in srgb, var(--cu-outline-variant) 55%, transparent) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, …同参… ) 0 0 / 24px 24px, radial-gradient(260px 120px at 50% 115%, color-mix(in srgb, var(--cu-primary) 16%, transparent), transparent), var(--cu-surface-container)`,加 `mask-image: radial-gradient(120% 100% at 50% 0%, black 60%, transparent)` 让网格向外淡出;`.card-icon-chip` 悬停时 `box-shadow: var(--cu-glow-sm)`(白名单场景:卡片焦点预览)
- [ ] **Step 2:** 亮暗双主题截图自检(`/tmp` 一次性脚本,复用 m2 思路);跑 `tests/tools-examples.spec.ts`
- [ ] **Step 3: Commit** `feat(tools): 卡片媒体区网格纹理与光晕,消解占位块感`

### Task 4: /analysis 重塑(审计:原生 checkbox、列表裁切、chips 孤行、三态)

**Files:** Modify: `src/views/AnalysisView.vue`;Test: `tests/analysis.spec.ts` 全程护航

- [ ] **Step 0(Discovery):** Read 该文件 565–918 的 `<style>` 段,记录 `.country-list` / `.metric-tabs` / `.load-error` 现状行号
- [ ] **Step 1:** 三处 `tv-glass-panel` → `GlassPanel`(`as="aside"`/`as="div"`,class 原样透传;`data-testid` 全保留)
- [ ] **Step 2:** 对比 checkbox 自定义样式:`.compare-toggle input` 保留原生控件(已吃 accent-color),但加 `width/height: 15px` 与 hover 提亮;整行 `.country-row.active` 参照首页图层面板的选中态(主色 container 底)
- [ ] **Step 3:** 列表裁切修复:`.country-list` 加 `mask-image: linear-gradient(to bottom, black calc(100% - 28px), transparent)` 底部淡出,替代生硬截断
- [ ] **Step 4:** `.metric-tabs` 改 `display: grid; grid-template-columns: repeat(3, 1fr)`,消灭「碳排放」孤行;标签宽度不足时 `font-size: var(--cu-fs-sm)`
- [ ] **Step 5:** 三个 `.load-error` 分支 → `ErrorState`(`data-testid` 移到其根)/`LoadingSkeleton`,语义不变(v-if 链原样)
- [ ] **Step 6:** 跑 `tests/analysis.spec.ts` 全量 + 截图自检;**Commit** `feat(analysis): 平台重塑——GlassPanel/对比框样式/列表淡出/指标网格/三态`

### Task 5: /workbench 重塑 + 暗色图表标签修复(M0 审计 P0)

**Files:** Modify: `src/views/WorkbenchView.vue`;Test: `tests/workbench.spec.ts` 全程护航

- [ ] **Step 0(Discovery):** Read 440–470(ECharts option 构造)与 522 起的 `<style>`;确认 `chartTextColor()` 与 `formatCompact` 的实现
- [ ] **Step 1:** 条形图 series `label`(约 466 行)补 `color: chartTextColor()` 且 formatter 换 `formatCompact`(重叠根因 = 默认深灰 #333 在暗底不可读 + `万亿` 长文案互相压盖;compact 数值 + 正确颜色双治);确认 `formatCompact` 输出仍可读(如 `30.8T`),若语义损失则改 `formatValue` 的紧凑中文变体并注明
- [ ] **Step 2:** 面板容器 `tv-glass-panel` → `GlassPanel`;`data-testid` 不动
- [ ] **Step 3:** 跑 `tests/workbench.spec.ts` 全量(含「选国下钻」「导出报告」)+ 暗色截图核对标签可读;**Commit** `feat(workbench): 图表标签暗色可读化(compact 数值+主题色),面板统一 GlassPanel`

### Task 6: /monitor 重塑(审计:底部统计与 Cesium logo 相撞、顶部条、三态)

**Files:** Modify: `src/views/MonitorView.vue`;Test: `tests/monitor.spec.ts` 全程护航

- [ ] **Step 0(Discovery):** Read 模板 165–200(底部统计区)与对应样式,确认 `.panel-left` 的 bottom 定位与 Cesium logo 的重叠几何
- [ ] **Step 1:** 相撞修复:`.panel-left` 的 `bottom` 从 `var(--cu-margin)` 改为 `calc(var(--cu-margin) + 22px)`(给 Cesium ion logo 让出底层带),或把统计行收进面板内容流末尾加 `padding-bottom` —— 以 Discovery 实测几何为准,二者取更稳者
- [ ] **Step 2:** `tv-glass-panel` → `GlassPanel`(全部出现处);顶部统计条改 `GlassPanel density="compact"` 包裹、数字 `.cu-num`
- [ ] **Step 3:** 空态(未选择事件)→ `EmptyState`;加载/错误分支 → 三件套(若有)
- [ ] **Step 4:** 跑 `tests/monitor.spec.ts` 全量 + 截图核对 logo 区;**Commit** `feat(monitor): 平台重塑——logo 区避让/GlassPanel/统计条/空态统一`

### Task 7: /bmap 分类 chip 墙分组(审计 P1:50+ 平铺无层级)

**Files:** Modify: `src/views/BMap/index.vue`;Test: `tests/map-tools.spec.ts`(如涉 bmap)全绿

- [ ] **Step 0(Discovery):** Read 全文件,找到分类数组的数据结构与 chip 激活机制(路由参数 or 本地状态)
- [ ] **Step 1:** 在 script 定义分组映射常量(六组上下:基础与地图模式 / 覆盖物与标注 / 绘制与量算 / 动画与轨迹 / 可视化与热力 / 服务与工具),把平铺数组归组;无法归类的进「其他」——分组常量全量显式列出,不留「按需」
- [ ] **Step 2:** 模板改为「分组标题 + 组内 chips」;激活逻辑/链接目标逐字保留;默认展开第一组,其余可点组题展开(纯 CSS `details`/`v-show`,无新依赖)
- [ ] **Step 3:** 跑相关 spec + 亮暗截图;**Commit** `feat(bmap): 分类 chips 六组收纳,激活逻辑不变`

### Task 8: 终审延后 Minor 收编 + 图层面板死空间

**Files:** Modify: `src/components/CommandPalette.vue`、`src/components/Toolbar.vue`、`src/components/ui/GlassPanel.vue`、`src/views/EarthView.vue`、`src/views/DesignKitView.vue`(豁免注释示例)、`tests/command-palette.spec.ts`、`tests/design-kit.spec.ts`

- [ ] **Step 1:** palette 焦点圈闭:mask 层 `@keydown.escape` 兜底关窗 + 关闭时 `document.activeElement` 归还;`role="dialog"` 补 `aria-modal="true"`;E2E 加断言(Tab 出输入框后 Esc 仍关)
- [ ] **Step 2:** Toolbar 每组套 `<div role="group" :aria-label="group.label">`,`label` 字段转正
- [ ] **Step 3:** GlassPanel 基类可覆写属性(radius/border/shadow)包 `:where(.cu-glass)` 降零特异性;design-kit 加一行「动效豁免约定」注释(spinner/skeleton 类循环动画允许裸秒数,交互动效必须走令牌)
- [ ] **Step 4:** 首页浮层进场动画只做首挂载:`.left-panel` 等加 `animation` 的同时,给 `.right-panel` 的重挂载场景去动画——用 `:once` 思路:EarthView 根加 `panel-entered` 类(setTimeout 600ms 后),`.panel-entered .right-panel { animation: none }`(信息面板开合不再重放 460ms)
- [ ] **Step 5:** 首页图层面板死空间:`.left-panel { bottom: auto; max-height: calc(100% - var(--cu-margin) * 2) }`(audit P1)
- [ ] **Step 6:** command-palette.spec 补「Enter 后命令真的执行」断言(执行分屏命令后 `.earth-container` 计数为 2,随后 Esc 复原或直接断言 store 效果)
- [ ] **Step 7:** 跑 design-kit / command-palette / smoke / earth-url-state 四件套;**Commit** `fix(ui): 终审 Minor 收编——焦点圈闭/分组 aria/GlassPanel 特异性/进场只做首挂载/面板高度`

### Task 9: M3a 验收闸门 + 截图交用户

- [ ] `npm run verify`(八环)/ typecheck(独占)/ lint:ci / build 后台仓外 + copy-example-deps / preview 全量 E2E + dev 全量 E2E
- [ ] 平台四页 + bmap 暗亮双主题截图到 `/tmp/curio-m3a-final/`,连同变更摘要**停下交用户验收**(M2 同款硬闸门)
- [ ] 用户点头后按 finishing-a-development-branch 流程合并
