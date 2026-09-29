# Curio 大厂级重塑 · M3b 实施计划(示例库壳层 + 搜索收敛)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 spec §6.4 示例库壳层重塑(画廊卡片质感、筛选侧栏、分页/工具条容器)与 M0 审计 P1「双搜索合并」;并对 M2 终审 Important#3(首页搜索与命令面板并存)作出最终裁决收口。

**Architecture:** 顶栏搜索(ResourceShell)升级为**作用域感知**:在 /examples 上就地过滤(现状),在 /three-globe 上回车写该页 `?search=`;ThreeGlobeGallery 改读路由查询,删除页内第二搜索框。视觉组件沿用 `src/components/ui/` 语法。E2E 选择器冻结(`.nav-search .search-input`、`.page-btn`、画廊 spec 全部选择器)。

**Tech Stack:** 同 M3a。

**Spec:** [docs/superpowers/specs/2026-09-29-curio-premium-redesign-design.md](../specs/2026-09-29-curio-premium-redesign-design.md) §6.4;输入含 [M0 审计](../specs/2026-09-29-m0-audit.md) P1 行。

## Global Constraints(沿用 M0–M3a 全部条款:对比度/棘轮/选择器冻结/零依赖/PC-only/令牌/小步提交)

- 示例**组件本体**(src/examples/components/**)与 registry 一律不碰;只动壳层视图与两个 shell 文件;
- `useGalleryFilters` 的滚动根(#app)、URL 同步、分页逻辑不改;只动视图容器与样式;
- smoke.spec 对顶栏搜索的行为契约(在 /examples 就地过滤;在 /bmap /three-globe 输入不拽走)必须全绿——它是本次搜索合并的行为边界。

## Review Focus

1. **顶栏搜索行为契约被改破**(smoke.spec:213-235 的「其它页输入不拽走」)→ Task 1 每步跑 smoke。
2. **useGalleryFilters 的 URL 状态机被绕开**(直接改 keyword 不经 ?search=)→ ThreeGlobeGallery 只读 query,写回仍走 router。
3. **示例卡片选择器/懒加载行为被破坏**(example-gallery-*.spec 三件)→ Task 2/3 每步跑画廊三 spec。
4. **分页/侧栏 DOM 结构变化导致 gallery spec 断言失效** → 只改样式与容器标签,不改类名。
5. **首页搜索被误动**(earth-geo-index 冻结用例)→ Task 5 只记裁决不改代码。

---

### Task 1: 顶栏搜索作用域感知 + /three-globe 页内搜索下线

**Files:**
- Modify: `src/shells/ResourceShell.vue`(submit/onInput 按 route.path 分流;/three-globe 时目标 = `/three-globe?search=`)
- Modify: `src/views/ThreeGlobeGallery.vue`(searchQuery 改读 `route.query.search` 初始化 + watch 同步;删除页内 `.search-box` 模板与样式)
- Test: `tests/smoke.spec.ts` 全程护航;`tests/three-globe`相关(如无独立 spec,以 smoke 为准)

- [ ] Step 0(Discovery): 读 smoke.spec:205-240 顶栏搜索契约与 ThreeGlobeGallery 的 searchQuery 消费链
- [ ] Step 1: ResourceShell `buildQuery/target` 分流:`onGallery` 扩展为 `route.path === '/examples' || route.path === '/three-globe'`,就地 replace 的 path 用当前 path;非画廊页回车跳 /examples(现状语义保留)
- [ ] Step 2: ThreeGlobeGallery:`searchQuery` 改为 query 驱动(初始化 + `watch(() => route.query.search)`),删除页内搜索框模板/样式
- [ ] Step 3: 跑 `tests/smoke.spec.ts` + 截图 /three-globe 确认单搜索;**Commit** `feat(shell): 顶栏搜索作用域感知,/three-globe 页内搜索下线(双搜索合并)`

### Task 2: GalleryFilterSidebar + GalleryToolbar 容器统一

**Files:** Modify: `src/examples/views/GalleryFilterSidebar.vue`、`src/examples/views/GalleryToolbar.vue`(如有 `tv-glass-panel`/自绘容器 → `GlassPanel`;裸秒数 → 令牌)

- [ ] Step 1: Discovery 两文件的容器与样式;Step 2: 换 GlassPanel/令牌;Step 3: 跑 `tests/example-gallery-facets.spec.ts` + `example-gallery-scroll.spec.ts`;**Commit** `feat(gallery): 筛选侧栏与工具条容器统一 GlassPanel 语法`

### Task 3: GalleryPagination 按钮语法统一

**Files:** Modify: `src/examples/views/GalleryPagination.vue`(保留 `.page-btn` 等类名,样式对齐 CuButton ghost 语法:令牌化过渡/描边/active 主色 container)

- [ ] Step 1: 样式令牌化重写(类名不动);Step 2: 跑 `tests/example-gallery-pagination.spec.ts`;**Commit** `feat(gallery): 分页控件样式对齐按钮语法(类名冻结)`

### Task 4: ExampleCard 暗色质感收尾

**Files:** Modify: `src/examples/views/ExampleCard.vue`(16:10 已达标;补 hover 微升按暗色高程策略:边框主色化 + shadow-2,不走大位移)

- [ ] Step 1: hover 态对齐 M2 交互语法;Step 2: 跑画廊三 spec + 截图;**Commit** `feat(gallery): 卡片 hover 对齐暗色高程策略`

### Task 5: M2 终审 Important#3 最终裁决(只记不改)

- [ ] Ledger 裁决:首页双入口 = 分工而非重复——SearchBox 是地点搜索的**可见主入口**(earth-geo-index 冻结用例钉住),命令面板的「地点」组是同一能力的**键盘快路径**(⌘K);SearchBox 从未有坐标搜索(占位文案撒谎),palette 无能力缺失;本裁决关闭 M2 终审 Important#3,首页搜索代码不动。

### Task 6: M3b 验收闸门 + 硬验收

- [ ] verify 八环 / typecheck 独占 / lint:ci / build+copy 后台 / preview + dev 全量 E2E
- [ ] /examples、/three-globe 双主题截图交用户硬验收;点头后 fresh review → 修复 → 合并
