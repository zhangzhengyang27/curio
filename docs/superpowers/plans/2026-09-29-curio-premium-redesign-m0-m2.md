# Curio 大厂级重塑 · M0–M2 实施计划(深空指挥中心)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成审计(M0)、设计系统 v2 与零依赖基础组件(M1)、样板页——顶栏 + 首页地球(M2),以用户验收样板页收尾。

**Architecture:** 令牌先行(`theme.css` 是棘轮豁免文件,可自由改值)→ 基础组件(`src/components/ui/`,只用 `var(--cu-*)`,零新依赖)→ 逐页换装。E2E 选择器冻结;纯逻辑状态机用 Node 内置 `node:test` 做 TDD(仓库无 vitest);视觉组件用 DesignKit 自检页 + E2E 断言。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">`、纯 CSS 令牌(无组件库)、Playwright E2E、`node --experimental-strip-types --test`、`verify:theme` 棘轮。

**Spec:** [docs/superpowers/specs/2026-09-29-curio-premium-redesign-design.md](../specs/2026-09-29-curio-premium-redesign-design.md)(计划与 spec 配套阅读;执行者两份都要读)

**范围裁定:** 本计划只做 M0+M1+2。M2 是硬验收闸门(用户看真实页面点头),M3/M4 在验收后另立计划。

## Global Constraints(每个任务默认携带)

- 静态对比度 ≥ 4.5:1,双主题零容忍;刻意例外必须上一行写 `/* theme-tokens:allow */`;
- `verify:theme` 是棘轮:基线只允许下降;`--update` 只用于收紧已 token 化的批次,**不得**用来让失败消失;
- `src/styles/theme.css` 与 `src/styles/code-highlight.css` 是棘轮豁免文件(`verify-theme-tokens.mjs` 的 SKIP_FILES),令牌定义本身不计数;
- **E2E 选择器冻结**:`.app-nav`、`.nav-search .search-input`、`.nav-dropdown` 及一切既有 `data-testid` 不改名(`perf.spec.ts` / `smoke.spec.ts` / `shell-nav.css` 头注释);
- `--cu-top-nav-height: 56px` 不变(全站 19 处 / 14 个文件的布局偏移依赖它);
- PC-only(`min-width: 1024` 不动);不引入第三方组件库或新的运行时依赖(`node:test` 是 Node 内置,不算);
- 1421 个示例组件、registry 体系、`EarthCanvas` 内部实现一律不碰;
- E2E 端口 `E2E_PORT`(默认 5299)+ strictPort;`npm run typecheck` **独占跑**(并发会出 TS6053 假错);构建输出到仓外 `/tmp`(本机批量删除保护);
- 提交信息中文,`type(scope): 摘要`,小步提交,单提交聚焦单一主题;
- 新 CSS 一律 `var(--cu-*)`;组件 `<style>` 禁止裸秒数 transition(必须用 `--cu-dur-*` / `--cu-ease`);
- `html.dark` 的 `.cu-glass` 类组件暗色覆写必须用 `:global(html.dark)`(scoped 样式不认祖先选择器)。

## Review Focus(spec 暗示但任务测试覆盖不到的输入,人最容易被咬的地方)

1. **E2E 选择器被顺手改名** → 全站冒烟假死。责任任务:Task 8/9/10 每次改完必跑 `npx playwright test tests/smoke.spec.ts tests/perf.spec.ts`。
2. **新组件在亮色主题下对比度不足**(开发时全程暗色,亮色最容易漏)→ 不可读。责任任务:Task 2 的对比度脚本 + Task 3 的双主题 E2E 断言。
3. **命令面板泄漏到 /examples**(spec 决策点 2:仅首页)→ 抢占资源库顶栏搜索的快捷键语义。责任任务:Task 11 的第二条 E2E 用例。
4. **首屏闪白回归 / 主题偏好丢失**(index.html 预置脚本与 `useThemeStore` 键名必须同步)→ 首访暗色用户先看见白。责任任务:Task 2 的预置脚本 + Task 3 的「首访默认暗色」E2E。
5. **浮层改造破坏信息面板开合 / 巡游模式**(z-index、`with-info` 联动、tourUIVisible 隐藏逻辑)→ 布局错乱。责任任务:Task 9/10 每次改完跑 `npx playwright test tests/earth-url-state.spec.ts tests/viz-loading.spec.ts tests/tour.spec.ts`。

---

### Task 1: M0 全站走查审计

**Files:**
- Create: `docs/superpowers/specs/2026-09-29-m0-audit.md`
- Create(一次性,不入库): `/tmp/m0-shots.mjs`

**Interfaces:**
- Produces: P0/P1/P2 差距清单 + 亮色模式质量结论(spec 第 11 节决策点 1 的输入)。**若审计结论与 spec 优先级冲突,在此任务停止并知会用户**(spec 第 10 节约定),不得擅自改道。

- [ ] **Step 1: 预检**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git status --short && test -d node_modules && echo "deps ok"
```
Expected: 工作树干净(git status 无输出)、`deps ok`。工作树不干净先停下处理。

- [ ] **Step 2: 起 dev server(后台)**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx vite --port 5177 --strictPort
```
后台运行;看到 `Local: http://localhost:5177/` 即就绪。

- [ ] **Step 3: 写截图脚本(一次性,放 /tmp 不入库)**

```js
// /tmp/m0-shots.mjs —— 在仓库根目录运行,复用仓库的 playwright
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5177'
const OUT = '/tmp/curio-m0'
mkdirSync(OUT, { recursive: true })

const routes = ['/', '/tools', '/analysis', '/monitor', '/workbench', '/examples', '/three-globe', '/bmap']
const browser = await chromium.launch()
for (const theme of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(t => localStorage.setItem('tv-theme', t), theme)
  const page = await ctx.newPage()
  for (const r of routes) {
    // Cesium/百度 SDK 页冷启动慢:goto 超时不致命,截到什么算什么
    await page.goto(BASE + r, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {})
    await page.waitForTimeout(4000)
    await page.screenshot({ path: `${OUT}/${theme}${r.replaceAll('/', '_')}.png` })
    console.log('shot', theme, r)
  }
  await ctx.close()
}
await browser.close()
```

- [ ] **Step 4: 执行截图**

```bash
cd /Users/zhangzhengyang/Desktop/curio && node /tmp/m0-shots.mjs
```
Expected: `/tmp/curio-m0/` 下 16 张 png,console 打印 16 行 `shot`。

- [ ] **Step 5: 逐张走查,写审计文档**

逐张看图,按模板写 `docs/superpowers/specs/2026-09-29-m0-audit.md`:

```markdown
# M0 轻量审计 —— 深空指挥中心(2026-09-29)

## 方法
dev server(5177)+ Playwright 截图,8 条路由 × 暗/亮双主题,1440×900。
截图在 /tmp/curio-m0/(一次性产物,不入库)。

## 差距清单
| 级别 | 页面/组件 | 发现 | 建议归属 |
|---|---|---|---|
| P0 | (逐条填) | | M1/M2/M3 |
| P1 | | | |
| P2 | | | |

## 亮色模式质量结论(spec 决策点 1 输入)
结论:只保对比度闸门 / 需与暗色同级精修(二选一,给证据)

## 与 spec 优先级的冲突
无 → 继续按 spec 执行 / 有 → 列出并停止,知会用户
```

走查必查项(每页):顶栏 active 态、浮层/卡片容器是否统一、加载/空/错误态缺失、暗色下文字可读性、明显硬编码色造成的「跳色」。

- [ ] **Step 6: 提交**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git add docs/superpowers/specs/2026-09-29-m0-audit.md && git commit -m "docs(audit): M0 全站走查审计,产出 P0/P1/P2 差距清单"
```

- [ ] **Step 7: 关停 dev server,汇报审计结论**

若「与 spec 优先级的冲突」非空 → 停止,把冲突点报给用户决策。无冲突 → 向用户简报 P0 清单后进入 Task 2。

---

### Task 2: theme.css 令牌 v2 + 首屏闪白修复 + 对比度校验

**Files:**
- Modify: `src/styles/theme.css`(:root 增补共享令牌;`html.dark` 整块重校准)
- Modify: `index.html`(`<head>` 增加主题预置脚本)

**Interfaces:**
- Produces(后续所有任务依赖): `--cu-pad-compact/--cu-pad/--cu-pad-loose`、`--cu-fs-display-1/2`、`--cu-dur-slow`、`--cu-data-*` 六色、`--cu-glow-sm/md/lg`、暗色四阶表面。**以下色值为起始值,对比度脚本不过就调值重跑,直到全过(闸门是硬的)。**

- [ ] **Step 1: `theme.css` 的 `:root` 末尾(`--cu-focus-ring` 之后)增补共享令牌**

```css

  /* ── Design System v2 增补(深空指挥中心,spec §4) ── */
  --cu-pad-compact: 12px;
  --cu-pad: 16px;
  --cu-pad-loose: 24px;
  --cu-fs-display-1: 48px;
  --cu-fs-display-2: 64px;
  --cu-dur-slow: 400ms;

  /* 数据语义色板(亮色):只允许出现在数据上(标记/折线/数字高亮),禁止用于 chrome */
  --cu-data-quake: #b3402f;
  --cu-data-layer: #0f766e;
  --cu-data-track: #6d28d9;
  --cu-data-flight: #1d4ed8;
  --cu-data-warn: #92400e;
  --cu-data-ok: #15803d;

  /* 发光三档:白名单场景 = 主 CTA 悬停 / active 段控 / 地球交互反馈 / 关键数字 */
  --cu-glow-sm: 0 0 0 1px color-mix(in srgb, var(--cu-primary) 45%, transparent);
  --cu-glow-md: 0 0 0 1px color-mix(in srgb, var(--cu-primary) 55%, transparent),
    0 0 16px color-mix(in srgb, var(--cu-primary) 28%, transparent);
  --cu-glow-lg: 0 0 0 1px color-mix(in srgb, var(--cu-primary) 65%, transparent),
    0 0 28px color-mix(in srgb, var(--cu-primary) 40%, transparent);
```

- [ ] **Step 2: `html.dark` 块整体替换为重校准版(四阶表面 + 提亮文字/accent + 暗色数据色板)**

保留该块内本模板未列出的既有令牌行(`--cu-secondary-*`、`--cu-tertiary-*`、`--cu-error*`、`--cu-warning`、`--cu-success`、`--cu-primary-fixed*`、`--cu-secondary-fixed*`、`--cu-tertiary-fixed*`、`--cu-shadow-*` 原样不动):

```css
html.dark {
  /* Dark Mode - Deep Space v2(四阶表面 0→3 递亮;层级 = 色阶 + 1px 描边,shadow 降权) */
  --cu-background: #090d15;
  --cu-surface: rgba(17, 23, 37, 0.82);
  --cu-surface-dim: #090d15;
  --cu-surface-bright: #1c2334;
  --cu-surface-container-lowest: rgba(13, 18, 30, 0.92);
  --cu-surface-container-low: rgba(19, 25, 40, 0.88);
  --cu-surface-container: rgba(26, 33, 52, 0.9);
  --cu-surface-container-high: rgba(35, 43, 66, 0.92);
  --cu-surface-container-highest: rgba(46, 55, 82, 0.94);
  --cu-surface-variant: rgba(46, 55, 82, 0.6);

  --cu-on-surface: #eef1f8;
  --cu-on-surface-variant: #9fa9c0;
  --cu-inverse-surface: #eef1f9;
  --cu-inverse-on-surface: #2d3137;

  --cu-outline: rgba(214, 226, 248, 0.24);
  --cu-outline-variant: rgba(214, 226, 248, 0.11);

  --cu-primary: #79b1e8;
  --cu-on-primary: #071120;
  --cu-primary-container: #1c3a5f;
  --cu-on-primary-container: #cfe2fa;
  --cu-inverse-primary: #0057c2;
  --cu-surface-tint: #79b1e8;

  /* 数据语义色板(暗色) */
  --cu-data-quake: #ff8a7a;
  --cu-data-layer: #52dcc8;
  --cu-data-track: #b990ff;
  --cu-data-flight: #6db3ff;
  --cu-data-warn: #ffc46b;
  --cu-data-ok: #5cd695;
```

(替换后确认块尾 `--cu-shadow-1/2/3` 三行仍在,再接 `}`。)

- [ ] **Step 3: `index.html` 的 `<head>` 内、百度 SDK 脚本**之前**插入主题预置**

```html
    <!--
      主题预置:Vue 挂载前按已保存偏好(无偏好默认暗色,与 useThemeStore.init 一致)
      给 <html> 打 .dark,消除「先画亮色再翻暗色」的首屏闪白。
      键名与 useThemeStore 的 localStorage 键一致(tv-theme);
      M4 把该键改名为 cu-theme 时必须同步改这里,并在此处读旧键迁移。
    -->
    <script>
      ;(function () {
        var t = 'dark'
        try { t = localStorage.getItem('tv-theme') || 'dark' } catch (e) { /* 隐私模式等 */ }
        if (t === 'dark') document.documentElement.classList.add('dark')
      })()
    </script>
```

- [ ] **Step 4: 写对比度校验脚本(一次性,/tmp)**

```js
// /tmp/cu-contrast.mjs —— 对 spec §4.6 的关键令牌对做 WCAG 对比度实测。
// 半透明表面先按暗色底 #090d15 合成(玻璃面板实际效果),再算文字对比度。
function comp(fg, alpha, bg) {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)))
}
function lum(rgb) {
  const [r, g, b] = rgb.map(v => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const hex = s => [0, 2, 4].map(i => parseInt(s.slice(1 + i, 3 + i), 16))

const DARK_BG = hex('#090d15')
const surfaces = {
  lowest: comp(hex('#0d121e'), 0.92, DARK_BG),
  low: comp(hex('#131928'), 0.88, DARK_BG),
  container: comp(hex('#1a2134'), 0.9, DARK_BG),
  high: comp(hex('#232b42'), 0.92, DARK_BG),
  highest: comp(hex('#2e3752'), 0.94, DARK_BG),
}
const textPairs = [
  ['on-surface vs lowest', hex('#eef1f8'), surfaces.lowest],
  ['on-surface vs high', hex('#eef1f8'), surfaces.high],
  ['on-surface vs highest', hex('#eef1f8'), surfaces.highest],
  ['on-surface-variant vs lowest', hex('#9fa9c0'), surfaces.lowest],
  ['on-surface-variant vs container', hex('#9fa9c0'), surfaces.container],
  ['on-surface-variant vs high', hex('#9fa9c0'), surfaces.high],
  ['on-primary vs primary', hex('#071120'), hex('#79b1e8')],
  ['on-primary-container vs primary-container', hex('#cfe2fa'), hex('#1c3a5f')],
  ['亮: on-surface vs surface-container', hex('#181c22'), hex('#ebeef6')],
  ['亮: on-surface-variant vs surface-container-low', hex('#454b59'), hex('#f1f3fc')],
  ['亮: on-primary vs primary', hex('#ffffff'), hex('#0057c2')],
  ['亮: on-primary-container vs primary-container', hex('#002d5e'), hex('#d6e4fa')],
]
// 数据色是图形不是正文,按 WCAG 图形件 3:1 校验(信息级,不进 CI 闸门)
const dataPairs = [
  ['暗: data-quake vs bg', hex('#ff8a7a'), DARK_BG],
  ['暗: data-layer vs bg', hex('#52dcc8'), DARK_BG],
  ['暗: data-track vs bg', hex('#b990ff'), DARK_BG],
  ['亮: data-quake vs background', hex('#b3402f'), hex('#f4f6fb')],
  ['亮: data-layer vs background', hex('#0f766e'), hex('#f4f6fb')],
]
let fail = 0
for (const [name, fg, bg] of textPairs) {
  const r = ratio(fg, bg)
  const ok = r >= 4.5
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1  ${name}`)
}
for (const [name, fg, bg] of dataPairs) {
  const r = ratio(fg, bg)
  console.log(`${r >= 3 ? 'PASS' : 'WARN'}  ${r.toFixed(2)}:1  ${name}`)
}
if (fail) { console.error(`\n${fail} 对文字对比度不达标 —— 调整 theme.css 起始值后重跑`); process.exit(1) }
console.log('\n全部文字对 ≥ 4.5:1')
```

- [ ] **Step 5: 跑对比度校验,不过就调值重跑**

```bash
node /tmp/cu-contrast.mjs
```
Expected: 12 对文字全 PASS,退出码 0。FAIL 时按提示调整 `theme.css` 对应值(优先调 `--cu-on-surface-variant` 与表面透明度),重跑至全过。

- [ ] **Step 6: 跑主题棘轮确认无回归**

```bash
cd /Users/zhangzhengyang/Desktop/curio && node scripts/verify-theme-tokens.mjs
```
Expected: `[verify-theme-tokens] OK`。theme.css 是豁免文件,改值不影响基线;其他文件计数不得增加。

- [ ] **Step 7: 手动确认闪白消除**

dev server 打开首页,DevTools Network 设 Fast 3G 刷新,肉眼确认首帧即暗色;清 localStorage 硬刷新,首帧仍暗色(默认值生效)。

- [ ] **Step 8: 提交**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git add src/styles/theme.css index.html && git commit -m "feat(theme): 设计系统 v2 令牌——四阶表面/数据语义色板/glow/密度与展示字阶,修复首屏闪白"
```

---

### Task 3: GlassPanel 组件 + DesignKit 自检页 + 路由(TDD)

**Files:**
- Create: `src/components/ui/GlassPanel.vue`
- Create: `src/views/DesignKitView.vue`
- Modify: `src/router/index.ts`(catch-all 之前插一条)
- Test: `tests/design-kit.spec.ts`

**Interfaces:**
- Produces: `<GlassPanel density="compact|cozy|loose|none" :interactive="boolean" as="section|aside|article">`(默认 `density="none"`、`as="section"`;根类名 `.cu-glass`,密度类 `.cu-glass--cozy` 等,交互类 `.cu-glass--interactive`)。后续任务以 `class` 透传方式给它叠加定位样式。

- [ ] **Step 1: 先写失败的 E2E**

`tests/design-kit.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('设计套件自检页', () => {
  test('路由可达,渲染玻璃面板与标题', async ({ page }) => {
    await page.goto('/design-kit')
    await expect(page.getByRole('heading', { name: '设计套件' })).toBeVisible()
    await expect(page.locator('.cu-glass').first()).toBeVisible()
  })

  test('双主题下面板均可见(亮色回归防护)', async ({ page }) => {
    for (const theme of ['dark', 'light']) {
      await page.addInitScript(t => localStorage.setItem('tv-theme', t), theme)
      await page.goto('/design-kit')
      await expect(page.locator('.cu-glass').first()).toBeVisible()
    }
  })

  test('首访(无偏好)默认暗色,html 预置脚本生效', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('tv-theme'))
    await page.goto('/design-kit')
    await expect(page.locator('html.dark')).toHaveCount(1)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/design-kit.spec.ts
```
Expected: FAIL(路由不存在 → NotFound 页,无 `.cu-glass`)。

- [ ] **Step 3: 实现 GlassPanel**

`src/components/ui/GlassPanel.vue`:

```vue
<template>
  <component
    :is="as"
    class="cu-glass"
    :class="[`cu-glass--${density}`, { 'cu-glass--interactive': interactive }]"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
/**
 * 全站唯一浮层/卡片容器语法(spec §5)。替代散落各处的 .tv-glass-panel class;
 * 密度默认 none 以对齐旧容器「自管内边距」的行为,需要留白时显式传。
 */
withDefaults(defineProps<{
  density?: 'compact' | 'cozy' | 'loose' | 'none'
  /** 可交互面板:hover 主色描边 + 阴影升一档 */
  interactive?: boolean
  /** 浮层用 aside/section,卡片用 article */
  as?: string
}>(), { density: 'none', interactive: false, as: 'section' })
</script>

<style scoped>
.cu-glass {
  background: var(--cu-surface-container-low);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--cu-outline-variant);
  box-shadow: var(--cu-shadow-1);
  border-radius: var(--cu-radius-lg);
}

/* 暗色基调:换成带透明度的 surface(与旧 .tv-glass-panel 的暗色行为一致) */
:global(html.dark) .cu-glass {
  background: var(--cu-surface);
}

.cu-glass--compact { padding: var(--cu-pad-compact); }
.cu-glass--cozy { padding: var(--cu-pad); }
.cu-glass--loose { padding: var(--cu-pad-loose); }
.cu-glass--none { padding: 0; }

.cu-glass--interactive {
  cursor: pointer;
  transition:
    border-color var(--cu-dur-fast) var(--cu-ease),
    box-shadow var(--cu-dur-fast) var(--cu-ease);
}
.cu-glass--interactive:hover {
  border-color: color-mix(in srgb, var(--cu-primary) 40%, var(--cu-outline-variant));
  box-shadow: var(--cu-shadow-2);
}
</style>
```

- [ ] **Step 4: DesignKit 页骨架 + 路由**

`src/views/DesignKitView.vue`:

```vue
<template>
  <div class="design-kit">
    <h1>设计套件 · Design System v2</h1>
    <p class="kit-desc">
      基础组件与令牌自检页(不进导航,URL 直达 /design-kit)。
      右上角可切换明暗,两套主题都必须可读。
    </p>

    <section class="kit-section">
      <h2>GlassPanel</h2>
      <div class="kit-row">
        <GlassPanel density="compact" class="kit-box">compact · 12</GlassPanel>
        <GlassPanel density="cozy" class="kit-box">cozy · 16</GlassPanel>
        <GlassPanel density="loose" class="kit-box">loose · 24</GlassPanel>
        <GlassPanel interactive density="cozy" class="kit-box">interactive(试试悬停)</GlassPanel>
      </div>
    </section>
    <!-- 后续任务在此追加各组件段落 -->
  </div>
</template>

<script setup lang="ts">
import GlassPanel from '../components/ui/GlassPanel.vue'
</script>

<style scoped>
.design-kit {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--cu-xl) var(--cu-gutter) 80px;
}
.kit-desc {
  color: var(--cu-on-surface-variant);
  margin: var(--cu-sm) 0 var(--cu-xl);
}
.kit-section { margin-bottom: var(--cu-xl); }
.kit-section h2 {
  font-size: var(--cu-fs-lg);
  font-weight: 600;
  margin-bottom: var(--cu-md);
}
.kit-row { display: flex; gap: var(--cu-md); flex-wrap: wrap; }
.kit-box {
  min-width: 150px;
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-sm);
}
</style>
```

`src/router/index.ts` 两处改动:import 区加一行;`routes` 数组在 `{ path: '/:pathMatch(.*)*', ...}`(注释写明「必须放最后」的那条)**之前**插入:

```ts
const DesignKitView = () => import('../views/DesignKitView.vue')
```

```ts
  { path: '/design-kit', name: 'design-kit', component: DesignKitView, meta: { title: `设计套件 · ${BRAND}` } },
```

- [ ] **Step 5: 跑测试确认通过**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/design-kit.spec.ts
```
Expected: 3 passed。

- [ ] **Step 6: 提交**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git add src/components/ui/GlassPanel.vue src/views/DesignKitView.vue src/router/index.ts tests/design-kit.spec.ts && git commit -m "feat(ui): GlassPanel 容器组件与 /design-kit 自检页(E2E 先行)"
```

---

### Task 4: CuButton 组件

**Files:**
- Create: `src/components/ui/CuButton.vue`
- Modify: `src/views/DesignKitView.vue`(追加段落)
- Test: `tests/design-kit.spec.ts`(追加用例)

**Interfaces:**
- Produces: `<CuButton variant="primary|ghost|icon" size="sm|md" :loading :disabled>`(默认 `variant="ghost"`、`size="md"`;根类 `.cu-btn`,修饰类 `.cu-btn--primary` 等,loading 态根类追加 `.cu-btn--loading` 且 `disabled`)。

- [ ] **Step 1: 追加失败的 E2E(design-kit.spec.ts 的 describe 内)**

```ts
  test('CuButton:loading 态禁用并显示 spinner,primary/ghost 样式类正确', async ({ page }) => {
    await page.goto('/design-kit')
    const loadingBtn = page.locator('.cu-btn--loading')
    await expect(loadingBtn).toBeDisabled()
    await expect(loadingBtn.locator('.cu-btn__spinner')).toBeVisible()
    await expect(page.locator('.cu-btn--primary').first()).toBeVisible()
    await expect(page.locator('.cu-btn--ghost').first()).toBeVisible()
  })
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/design-kit.spec.ts
```
Expected: 新用例 FAIL(无 `.cu-btn`),旧 3 条仍 PASS。

- [ ] **Step 3: 实现 CuButton**

`src/components/ui/CuButton.vue`:

```vue
<template>
  <button
    class="cu-btn"
    :class="[`cu-btn--${variant}`, `cu-btn--${size}`, { 'cu-btn--loading': loading }]"
    :disabled="disabled || loading"
    type="button"
  >
    <span
      v-if="loading"
      class="cu-btn__spinner"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'ghost' | 'icon'
  size?: 'sm' | 'md'
  loading?: boolean
  disabled?: boolean
}>(), { variant: 'ghost', size: 'md', loading: false, disabled: false })
</script>

<style scoped>
.cu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cu-xs);
  border: 1px solid transparent;
  border-radius: var(--cu-radius-md);
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--cu-dur-fast) var(--cu-ease),
    color var(--cu-dur-fast) var(--cu-ease),
    border-color var(--cu-dur-fast) var(--cu-ease),
    box-shadow var(--cu-dur-fast) var(--cu-ease);
}
.cu-btn:focus-visible {
  outline: none;
  box-shadow: var(--cu-focus-ring);
}
.cu-btn:disabled { cursor: not-allowed; opacity: 0.6; }

.cu-btn--sm { height: 28px; padding: 0 var(--cu-sm); font-size: var(--cu-fs-sm); }
.cu-btn--md { height: 36px; padding: 0 var(--cu-md); font-size: var(--cu-fs-md); }
.cu-btn--icon.cu-btn--sm { width: 28px; padding: 0; }
.cu-btn--icon.cu-btn--md { width: 36px; padding: 0; }

.cu-btn--primary {
  background: var(--cu-primary);
  color: var(--cu-on-primary);
}
.cu-btn--primary:not(:disabled):hover {
  box-shadow: var(--cu-glow-sm);
}
.cu-btn--ghost {
  background: transparent;
  color: var(--cu-on-surface-variant);
  border-color: var(--cu-outline-variant);
}
.cu-btn--ghost:not(:disabled):hover {
  background: var(--cu-surface-container);
  color: var(--cu-on-surface);
}
.cu-btn--icon {
  background: transparent;
  color: var(--cu-on-surface-variant);
}
.cu-btn--icon:not(:disabled):hover {
  background: var(--cu-surface-container);
  color: var(--cu-primary);
}

.cu-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid color-mix(in srgb, currentColor 30%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: cu-btn-spin 0.8s linear infinite;
}
@keyframes cu-btn-spin {
  to { transform: rotate(360deg); }
}
</style>
```

- [ ] **Step 4: DesignKit 追加按钮段落(`<section class="kit-section">` 列表末尾)**

```vue
    <section class="kit-section">
      <h2>CuButton</h2>
      <div class="kit-row kit-align">
        <CuButton variant="primary">主要动作</CuButton>
        <CuButton>次要动作</CuButton>
        <CuButton variant="icon" aria-label="示例图标按钮">
          <UiIcon name="camera" :size="18" />
        </CuButton>
        <CuButton variant="primary" loading>加载中</CuButton>
        <CuButton disabled>禁用</CuButton>
      </div>
    </section>
```

`<script setup>` 增加:

```ts
import CuButton from '../components/ui/CuButton.vue'
import UiIcon from '../components/UiIcon'
```

`<style scoped>` 追加:

```css
.kit-align { align-items: center; }
```

- [ ] **Step 5: 跑测试确认通过**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/design-kit.spec.ts
```
Expected: 4 passed。

- [ ] **Step 6: 提交**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git add src/components/ui/CuButton.vue src/views/DesignKitView.vue tests/design-kit.spec.ts && git commit -m "feat(ui): CuButton 三型两档按钮,内建 loading 态"
```

---

### Task 5: 状态三件套(EmptyState / ErrorState / LoadingSkeleton)

**Files:**
- Create: `src/components/ui/EmptyState.vue`、`src/components/ui/ErrorState.vue`、`src/components/ui/LoadingSkeleton.vue`
- Modify: `src/components/UiIcon.ts`(ICONS 表补 `alert` 图标)
- Modify: `src/views/DesignKitView.vue`(追加段落)
- Test: `tests/design-kit.spec.ts`(追加用例)

**Interfaces:**
- Produces:
  - `<EmptyState icon?="UiIconName"(默认 'hex') title="string" description?="string">` + `#action` 插槽;根类 `.cu-empty`;
  - `<ErrorState title?="string"(默认「加载失败」) description? retryText?="重试">` + `@retry`;根类 `.cu-error-state`;
  - `<LoadingSkeleton :lines="number"(默认 3)>`;根类 `.cu-skel`,行类 `.cu-skel__line`。

- [ ] **Step 1: 追加失败的 E2E**

```ts
  test('状态三件套:空态带标题,错误态可触发 retry,骨架屏可见', async ({ page }) => {
    await page.goto('/design-kit')
    await expect(page.getByTestId('kit-empty').getByText('暂无数据')).toBeVisible()
    await page.getByTestId('kit-error').getByRole('button', { name: '重试' }).click()
    await expect(page.getByTestId('kit-retry-count')).toHaveText('重试次数:1')
    await expect(page.getByTestId('kit-skeleton').locator('.cu-skel__line').first()).toBeVisible()
  })
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/design-kit.spec.ts
```
Expected: 新用例 FAIL,旧 4 条 PASS。

- [ ] **Step 3: UiIcon 补 `alert` 图标**

`src/components/UiIcon.ts` 的 `ICONS` 表内(`search` 行后)追加:

```ts
  alert:
    '<path d="M12 3.5 21.5 20h-19L12 3.5z"/><path d="M12 10v4.5M12 17.5h.01"/>',
```

> spec §5「补齐图标统一笔画宽度」的意图是**统一性**:UiIcon 全站默认已是 1.6px 统一 stroke,新图标进同一张表自动继承,不再另改默认值。

- [ ] **Step 4: 实现三个组件**

`src/components/ui/EmptyState.vue`:

```vue
<template>
  <div class="cu-empty">
    <div class="cu-empty__icon">
      <slot name="icon">
        <UiIcon
          :name="icon"
          :size="28"
        />
      </slot>
    </div>
    <p class="cu-empty__title">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="cu-empty__desc"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.action"
      class="cu-empty__action"
    >
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import UiIcon, { type UiIconName } from '../UiIcon'

withDefaults(defineProps<{
  icon?: UiIconName
  title: string
  description?: string
}>(), { icon: 'hex' })
</script>

<style scoped>
.cu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cu-sm);
  padding: var(--cu-xl) var(--cu-pad);
  text-align: center;
}
.cu-empty__icon { color: var(--cu-on-surface-variant); opacity: 0.7; }
.cu-empty__title { font-size: var(--cu-fs-md); font-weight: 600; color: var(--cu-on-surface); }
.cu-empty__desc { font-size: var(--cu-fs-sm); color: var(--cu-on-surface-variant); }
.cu-empty__action { margin-top: var(--cu-xs); }
</style>
```

`src/components/ui/ErrorState.vue`:

```vue
<template>
  <div
    class="cu-error-state"
    role="alert"
  >
    <div class="cu-error-state__icon">
      <UiIcon
        name="alert"
        :size="28"
      />
    </div>
    <p class="cu-error-state__title">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="cu-error-state__desc"
    >
      {{ description }}
    </p>
    <CuButton
      variant="primary"
      size="sm"
      @click="emit('retry')"
    >
      {{ retryText }}
    </CuButton>
  </div>
</template>

<script setup lang="ts">
import CuButton from './CuButton.vue'
import UiIcon from '../UiIcon'

withDefaults(defineProps<{
  title?: string
  description?: string
  retryText?: string
}>(), { title: '加载失败', retryText: '重试' })

const emit = defineEmits<{ retry: [] }>()
</script>

<style scoped>
.cu-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cu-sm);
  padding: var(--cu-xl) var(--cu-pad);
  text-align: center;
}
.cu-error-state__icon { color: var(--cu-error); }
.cu-error-state__title { font-size: var(--cu-fs-md); font-weight: 600; }
.cu-error-state__desc { font-size: var(--cu-fs-sm); color: var(--cu-on-surface-variant); }
</style>
```

`src/components/ui/LoadingSkeleton.vue`:

```vue
<template>
  <div
    class="cu-skel"
    aria-hidden="true"
  >
    <div
      v-for="i in lines"
      :key="i"
      class="cu-skel__line"
      :style="{ width: widths[(i - 1) % widths.length] }"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  lines?: number
}>(), { lines: 3 })

// 末行收窄的伪文本节奏,比等宽行更像在「读内容」
const widths = ['100%', '92%', '78%']
</script>

<style scoped>
.cu-skel {
  display: flex;
  flex-direction: column;
  gap: var(--cu-sm);
  padding: var(--cu-pad);
}
.cu-skel__line {
  height: 14px;
  border-radius: var(--cu-radius-md);
  background: var(--cu-surface-container-high);
  animation: cu-skel-pulse 1.4s var(--cu-ease) infinite;
}
@keyframes cu-skel-pulse {
  50% { opacity: 0.55; }
}
</style>
```

- [ ] **Step 5: DesignKit 追加状态段落**

```vue
    <section class="kit-section">
      <h2>状态三件套</h2>
      <div class="kit-row">
        <GlassPanel density="cozy" data-testid="kit-empty" class="kit-state">
          <EmptyState
            title="暂无数据"
            description="调整筛选条件或导入一份试试"
          >
            <template #action>
              <CuButton variant="primary" size="sm">导入数据</CuButton>
            </template>
          </EmptyState>
        </GlassPanel>
        <GlassPanel density="cozy" data-testid="kit-error" class="kit-state">
          <ErrorState
            title="数据加载失败"
            description="网络抖了,重试一下"
            @retry="retryCount++"
          />
        </GlassPanel>
        <GlassPanel density="cozy" data-testid="kit-skeleton" class="kit-state">
          <LoadingSkeleton :lines="4" />
        </GlassPanel>
      </div>
      <p data-testid="kit-retry-count" class="kit-retry-log">重试次数:{{ retryCount }}</p>
    </section>
```

`<script setup>` 追加:

```ts
import { ref } from 'vue'
import EmptyState from '../components/ui/EmptyState.vue'
import ErrorState from '../components/ui/ErrorState.vue'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.vue'

const retryCount = ref(0)
```

`<style scoped>` 追加:

```css
.kit-state { width: 260px; }
.kit-retry-log { margin-top: var(--cu-md); color: var(--cu-on-surface-variant); font-size: var(--cu-fs-sm); }
```

- [ ] **Step 6: 跑测试确认通过**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/design-kit.spec.ts
```
Expected: 5 passed。

- [ ] **Step 7: 提交**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git add src/components/ui/EmptyState.vue src/components/ui/ErrorState.vue src/components/ui/LoadingSkeleton.vue src/components/UiIcon.ts src/views/DesignKitView.vue tests/design-kit.spec.ts && git commit -m "feat(ui): 空/错/加载三态组件与 alert 图标,统一状态语法"
```

---

### Task 6: CuTooltip 组件

**Files:**
- Create: `src/components/ui/CuTooltip.vue`
- Modify: `src/views/DesignKitView.vue`(追加段落)
- Test: `tests/design-kit.spec.ts`(追加用例)

**Interfaces:**
- Produces: `<CuTooltip label="string" kbd?="string" placement?="'top'|'bottom'|'left'|'right'">(触发元素)</CuTooltip>`(默认 `placement="top"`;气泡类 `.cu-tip__bubble`,kbd 类 `.cu-tip__kbd`)。Task 10 的 Toolbar 以 `placement="left"` 消费。

- [ ] **Step 1: 追加失败的 E2E**

```ts
  test('CuTooltip:悬停出现气泡,支持快捷键标注', async ({ page }) => {
    await page.goto('/design-kit')
    const trigger = page.getByTestId('kit-tip-trigger')
    await trigger.hover()
    await expect(page.getByTestId('kit-tip-bubble')).toBeVisible()
    await expect(page.getByTestId('kit-tip-bubble').getByText('截图')).toBeVisible()
    await expect(page.getByTestId('kit-tip-bubble').locator('.cu-tip__kbd')).toHaveText('S')
  })
```

- [ ] **Step 2: 跑测试确认失败**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/design-kit.spec.ts
```
Expected: 新用例 FAIL。

- [ ] **Step 3: 实现 CuTooltip**

`src/components/ui/CuTooltip.vue`:

```vue
<template>
  <span class="cu-tip">
    <slot />
    <span
      class="cu-tip__bubble"
      :class="`cu-tip__bubble--${placement}`"
      role="tooltip"
      :data-testid="testdata"
    >
      <span class="cu-tip__text">{{ label }}</span>
      <kbd
        v-if="kbd"
        class="cu-tip__kbd"
      >{{ kbd }}</kbd>
    </span>
  </span>
</template>

<script setup lang="ts">
/**
 * 替代原生 title 属性与各页面手搓 tooltip(spec §5)。
 * 纯 CSS 悬停/聚焦显隐,无定位库;触发元素必须只有一个根元素。
 */
withDefaults(defineProps<{
  label: string
  /** 快捷键标注,如 'S' / 'Space' / '⌘K';无则不显示 */
  kbd?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** 供 E2E 定位气泡(可选) */
  testdata?: string
}>(), { placement: 'top' })
</script>

<style scoped>
.cu-tip {
  position: relative;
  display: inline-flex;
}
.cu-tip__bubble {
  position: absolute;
  z-index: 400;
  display: flex;
  align-items: center;
  gap: var(--cu-xs);
  padding: 4px 10px;
  border-radius: var(--cu-radius-md);
  background: var(--cu-inverse-surface);
  color: var(--cu-inverse-on-surface);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  box-shadow: var(--cu-shadow-2);
  transition: opacity var(--cu-dur-fast) var(--cu-ease);
}
.cu-tip:hover .cu-tip__bubble,
.cu-tip:focus-within .cu-tip__bubble {
  opacity: 1;
  /* 悬停 300ms 后才出现,避免扫过工具栏时气泡乱闪 */
  transition-delay: 300ms;
}
.cu-tip__bubble--top { bottom: calc(100% + 8px); left: 50%; translate: -50% 0; }
.cu-tip__bubble--bottom { top: calc(100% + 8px); left: 50%; translate: -50% 0; }
.cu-tip__bubble--left { right: calc(100% + 10px); top: 50%; translate: 0 -50%; }
.cu-tip__bubble--right { left: calc(100% + 10px); top: 50%; translate: 0 -50%; }

.cu-tip__kbd {
  font-family: var(--cu-font-mono);
  font-size: 10px;
  line-height: 14px;
  padding: 0 5px;
  border: 1px solid color-mix(in srgb, var(--cu-inverse-on-surface) 35%, transparent);
  border-radius: var(--cu-radius-sm);
}
</style>
```

- [ ] **Step 4: DesignKit 追加段落**

```vue
    <section class="kit-section">
      <h2>CuTooltip</h2>
      <div class="kit-row kit-align">
        <CuTooltip
          label="截图"
          kbd="S"
          placement="top"
          testdata="kit-tip-bubble"
        >
          <CuButton
            variant="icon"
            data-testid="kit-tip-trigger"
          >
            <UiIcon
              name="camera"
              :size="18"
            />
          </CuButton>
        </CuTooltip>
        <span class="kit-tip-note">悬停 300ms 后出现(防扫过乱闪)</span>
      </div>
    </section>
```

`<script setup>` 追加 `import CuTooltip from '../components/ui/CuTooltip.vue'`;
`<style scoped>` 追加:

```css
.kit-tip-note { color: var(--cu-on-surface-variant); font-size: var(--cu-fs-sm); }
```

- [ ] **Step 5: 跑测试确认通过**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/design-kit.spec.ts
```
Expected: 6 passed。

- [ ] **Step 6: 提交**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git add src/components/ui/CuTooltip.vue src/views/DesignKitView.vue tests/design-kit.spec.ts && git commit -m "feat(ui): CuTooltip 气泡,支持快捷键标注与四向定位"
```

---

### Task 7: M1 收尾闸门

**Files:** 无新改动(纯验证;失败则回对应任务修)。

**Interfaces:**
- Consumes: Task 2–6 全部产物。

- [ ] **Step 1: 一致性七环**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npm run verify
```
Expected: 七环全绿(凭据/registry/漂移/封面/three 兼容/gl-renderer/主题棘轮)。

- [ ] **Step 2: typecheck(独占,不并行任何其他命令)**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npm run typecheck
```
Expected: 0 error。出现 TS6053「文件不存在」先怀疑并发负载(AGENTS.md §6),独占重跑再定论。

- [ ] **Step 3: lint**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npm run lint:ci
```
Expected: 0 error(`v-html` 的 eslint-disable 注释保留在 Toolbar 原位,本任务不动它)。

- [ ] **Step 4: 生产构建(后台,输出到仓外)**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx vite build --outDir /tmp/earth-build-m1 --emptyOutDir true
```
后台运行(本机构建 7~37 分钟)。Expected: `✓ built in`。

- [ ] **Step 5: 全量 E2E(dev)**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npm run test:e2e
```
Expected: 输出 `N passed`(本机 npm 收尾清理可能报 failed,以 `N passed` 为准,AGENTS.md §6)。

- [ ] **Step 6: 汇报 M1 完成**

向用户汇报:令牌/组件清单 + DesignKit 截图(可复用 Task 1 截图脚本思路对 `/design-kit` 截图)。然后进入 M2。

---

### Task 8: ShellNav pill 段控 active 态

**Files:**
- Modify: `src/styles/shell-nav.css`(`.nav-links a` 三条规则 + `.dropdown-trigger` 三条规则)

**Interfaces:**
- Consumes: Task 2 令牌。
- Produces: 顶栏 active = pill 段控视觉。**类名、DOM 结构、E2E 选择器一概不动。**品牌区走查已符合排印规范(logo 32px、brand-name 18px/700、间距 `--cu-sm`、tag 已 pill 化),本任务不动。

- [ ] **Step 1: 替换 `.nav-links a` 三条规则**

将现有这三条(`shell-nav.css:74-94`):

```css
.app-nav .nav-links a { /* ...height: 100%; border-bottom: 2px solid transparent; padding-top: 2px; ... */ }
.app-nav .nav-links a:hover { color: var(--cu-primary); }
.app-nav .nav-links a.active { color: var(--cu-primary); border-bottom-color: var(--cu-primary); }
```

替换为:

```css
.app-nav .nav-links a {
  display: flex;
  align-items: center;
  /* 从撑满 56px 改为固定 36px:上下留白让 pill 有呼吸感;顶栏总高不变 */
  height: 36px;
  padding: 0 var(--cu-md);
  border-radius: var(--cu-radius-full);
  color: var(--cu-on-surface-variant);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition:
    color var(--cu-dur-fast) var(--cu-ease),
    background var(--cu-dur-fast) var(--cu-ease);
}

.app-nav .nav-links a:hover {
  color: var(--cu-on-surface);
  background: var(--cu-surface-container);
}

.app-nav .nav-links a.active {
  color: var(--cu-on-surface);
  background: var(--cu-surface-container-high);
}
```

- [ ] **Step 2: 替换 `.dropdown-trigger` 三条规则(`shell-nav.css:195-217`)**

将现有三条(`height: 100%; border-bottom: 2px solid transparent; padding-top: 2px` 一族)替换为:

```css
.app-nav .dropdown-trigger {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 var(--cu-md);
  border-radius: var(--cu-radius-full);
  color: var(--cu-on-surface-variant);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color var(--cu-dur-fast) var(--cu-ease),
    background var(--cu-dur-fast) var(--cu-ease);
}

.app-nav .dropdown-trigger:hover {
  color: var(--cu-on-surface);
  background: var(--cu-surface-container);
}

.app-nav .dropdown-trigger.active {
  color: var(--cu-on-surface);
  background: var(--cu-surface-container-high);
}
```

(与 `.nav-links a` 保持同一视觉;暗色下 hover 落 `--cu-secondary-container` 的既有规则不动。)

- [ ] **Step 3: 跑顶栏相关 E2E(选择器冻结验证)**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/smoke.spec.ts tests/perf.spec.ts tests/example-gallery-facets.spec.ts
```
Expected: 全 passed(`.app-nav` / `.nav-search .search-input` / 示例中心下拉交互均不受影响)。

- [ ] **Step 4: 亮暗两态肉眼验收**

dev server 下分别看 `/`(暗)与 `/examples`(亮),确认 pill 在两主题下的对比度与聚焦环。截图留档 `/tmp/curio-m2-nav.png`。

- [ ] **Step 5: 提交**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git add src/styles/shell-nav.css && git commit -m "feat(shell): 顶栏导航升级 pill 段控 active 态,动效全部走令牌"
```

---

### Task 9: EarthView 浮层 GlassPanel 化 + 错峰进场编排

**Files:**
- Modify: `src/views/EarthView.vue`(模板 6 处 `tv-glass-panel`、import 区、`<style scoped>`)

**Interfaces:**
- Consumes: `GlassPanel`(Task 3)、`--cu-dur-slow`(Task 2)。
- Produces: 首页四组浮层统一容器语法 + 60ms stagger 进场。`.left-panel/.right-panel/.tools-panel/.bottom-bar` 定位类名保留(Task 10 及 E2E 依赖)。

- [ ] **Step 1: 模板替换 6 处容器**

`EarthView.vue` 模板中以下元素换用 GlassPanel(`class` 原样透传到组件根元素,定位样式不受影响):

| 原 | 新 |
|---|---|
| `<aside class="left-panel tv-glass-panel">` | `<GlassPanel as="aside" class="left-panel">` |
| `<aside v-if="interactionStore.showInfoPanel" class="right-panel tv-glass-panel">` | `<GlassPanel v-if="interactionStore.showInfoPanel" as="aside" class="right-panel">` |
| `<aside class="tools-panel tv-glass-panel" :class="{ 'with-info': interactionStore.showInfoPanel }">` | `<GlassPanel as="aside" class="tools-panel" :class="{ 'with-info': interactionStore.showInfoPanel }">` |
| `<div v-if="!tourUIVisible" class="bottom-bar tv-glass-panel">` | `<GlassPanel v-if="!tourUIVisible" as="div" class="bottom-bar">` |
| `<div v-if="earthStore.vizLoading" class="viz-loading tv-glass-panel" data-testid="viz-loading">` | `<GlassPanel v-if="earthStore.vizLoading" as="div" class="viz-loading" data-testid="viz-loading">` |
| `<div v-if="earthStore.vizError" class="viz-loading viz-error tv-glass-panel" data-testid="viz-error">` | `<GlassPanel v-if="earthStore.vizError" as="div" class="viz-loading viz-error" data-testid="viz-error">` |

闭合标签同步改名(`</GlassPanel>`)。`<script setup>` import 区追加:

```ts
import GlassPanel from '../components/ui/GlassPanel.vue'
```

- [ ] **Step 2: `<style scoped>` 追加错峰进场(translate 属性与既有 transform 定位不冲突)**

```css
/* 面板错峰进场(spec §6.2):地球先入,浮层 60ms stagger 跟进。
   用独立 translate 属性而不是 transform——tools-panel/bottom-bar 的居中
   依赖 transform: translate(-50%)/translateY(-50%),两者互不覆盖 */
.left-panel,
.right-panel,
.tools-panel,
.bottom-bar {
  animation: cu-panel-in var(--cu-dur-slow) var(--cu-ease) backwards;
}
.right-panel { animation-delay: 60ms; }
.tools-panel { animation-delay: 120ms; }
.bottom-bar { animation-delay: 180ms; }

@keyframes cu-panel-in {
  from {
    opacity: 0;
    translate: 0 8px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}
```

- [ ] **Step 3: 底栏按钮过渡令牌化(顺手,消灭裸秒数)**

`.viz-btn` 的 `transition: all 0.2s ease;` 替换为:

```css
  transition:
    color var(--cu-dur-fast) var(--cu-ease),
    background var(--cu-dur-fast) var(--cu-ease);
```

> spec §6.2「底部模式条改分段控件样式」:现有「pill 容器 + active 主色药丸」已具备分段控件形态,本任务不另起炉灶重画;若验收时想要更强的分段感(active 改表面色阶 + glow),按你的反馈在修订轮细化,不预先加戏。

- [ ] **Step 4: 跑首页相关 E2E(浮层行为无回归)**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/smoke.spec.ts tests/earth-url-state.spec.ts tests/viz-loading.spec.ts tests/tour.spec.ts tests/earth-split.spec.ts
```
Expected: 全 passed。`viz-loading`/`viz-error` 的 `data-testid` 未动,viz-loading.spec 必须原样通过。

- [ ] **Step 5: 肉眼验收进场编排**

dev server 打开 `/`,硬刷新:地球先入,左面板 → 右工具条 → 底栏 60ms 错峰浮入;开启信息面板确认 `.tools-panel.with-info` 让位逻辑正常;进巡游确认浮层隐藏/恢复正常。

- [ ] **Step 6: 提交**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git add src/views/EarthView.vue && git commit -m "feat(earth): 首页浮层统一 GlassPanel 容器语法,60ms 错峰进场"
```

---

### Task 10: Toolbar 分组 + CuTooltip 接入

**Files:**
- Modify: `src/components/Toolbar.vue`

**Interfaces:**
- Consumes: `CuTooltip`(Task 6)。
- Produces: 工具条四分组(视图 / 效果 / 截图 / 巡游),分隔线类 `.toolbar-sep`;按钮保留 `.tool-btn` 类名与 `aria-label`。**按钮顺序有调整,依赖点击顺序的 E2E 若挂,以 title/aria 定位修正断言,不得回退分组。**

- [ ] **Step 1: 模板替换**

`Toolbar.vue` `<template>` 整体替换为:

```vue
<template>
  <div class="toolbar">
    <template
      v-for="(group, gi) in toolGroups"
      :key="group.key"
    >
      <span
        v-if="gi > 0"
        class="toolbar-sep"
        aria-hidden="true"
      />
      <CuTooltip
        v-for="tool in group.tools"
        :key="tool.key"
        :label="tool.title"
        :kbd="tool.kbd"
        placement="left"
      >
        <button
          class="tool-btn"
          :class="{ active: tool.active }"
          :aria-label="tool.title"
          @click="tool.action"
        >
          <!-- eslint-disable vue/no-v-html -- tool.icon 来自组件内静态 SVG 常量表,非外部输入 -->
          <span
            class="tool-icon"
            v-html="tool.icon"
          />
          <!-- eslint-enable vue/no-v-html -->
        </button>
      </CuTooltip>
    </template>
  </div>
</template>
```

- [ ] **Step 2: `tools` computed 改为分组结构**

`<script setup>` 中:import 区追加 `import CuTooltip from './ui/CuTooltip.vue'`;把现有 `const tools = computed(() => [...])` 整体替换为(每条目的 icon/action/active 逻辑**原样搬移**,只是重新分组;`title` 保留原中文文案):

```ts
interface ToolItem {
  key: string
  title: string
  icon: string
  action: () => void
  active?: boolean
  /** 既有全局快捷键才标 kbd:空格=旋转、S=截图、N=夜间(spec §6.2) */
  kbd?: string
}

const toolGroups = computed<Array<{ key: string; label: string; tools: ToolItem[] }>>(() => [
  {
    key: 'view',
    label: '视图',
    tools: [
      { key: 'rotate', title: '自动旋转', icon: icons.rotate, action: toggleRotation, active: earthStore.isRotating, kbd: 'Space' },
      { key: 'terrain', title: '地形', icon: icons.terrain, action: handleTerrainToggle, active: terrainActive.value },
      { key: 'split', title: '分屏对比', icon: icons.split, action: () => props.onSplitScreen?.() },
      { key: 'realistic', title: '真实地球', icon: icons.realistic, action: handleRealisticEarthToggle, active: realisticActive.value },
    ],
  },
  {
    key: 'effect',
    label: '效果',
    tools: [
      { key: 'cloud', title: '云层', icon: icons.cloud, action: handleCloudToggle, active: cloudActive.value },
      // 夜间模式状态取自 store:快捷键 n 改的是同一份,按钮不能另存一份
      { key: 'night', title: '夜间模式', icon: icons.night, action: () => props.onNightToggle?.(), active: earthStore.nightMode, kbd: 'N' },
      { key: 'storm', title: '风暴', icon: icons.storm, action: () => props.onStorm?.() },
      { key: 'bloom', title: '辉光', icon: icons.bloom, action: handleBloomToggle, active: bloomActive.value },
    ],
  },
  {
    key: 'capture',
    label: '截图',
    tools: [
      { key: 'screenshot', title: '截图', icon: icons.screenshot, action: () => props.onScreenshot?.(), kbd: 'S' },
      { key: 'record', title: recording.value ? '停止录制' : '录制 GIF', icon: icons.record, action: handleRecordGif, active: recording.value },
    ],
  },
  {
    key: 'tour',
    label: '巡游',
    tools: [
      { key: 'tour', title: '数据巡游', icon: icons.tour, action: () => props.onTour?.() },
    ],
  },
])
```

- [ ] **Step 3: 样式追加分隔线、删除旧 tooltip**

`<style scoped>` 追加:

```css
.toolbar-sep {
  width: 24px;
  height: 1px;
  background: var(--cu-outline-variant);
  margin: var(--cu-xs) 0;
}
```

删除整个 `.tool-tooltip` 规则块与 `.tool-btn:hover .tool-tooltip` 规则(功能由 CuTooltip 接管);`.tool-btn` 的 `transition: all 0.2s ease;` 替换为:

```css
  transition:
    background var(--cu-dur-fast) var(--cu-ease),
    color var(--cu-dur-fast) var(--cu-ease);
```

- [ ] **Step 4: 跑工具条相关 E2E**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/tour.spec.ts tests/earth-split.spec.ts tests/smoke.spec.ts
```
Expected: 全 passed。若有用例按「第 N 个按钮」定位而挂,把断言改为按 `aria-label`/title 定位后重跑(这是测试改进,不是功能回退)。

- [ ] **Step 5: 肉眼验收**

悬停各按钮:气泡从左侧出现、300ms 防误触延迟生效、带快捷键标注(Space / N / S);四组分隔线在亮暗两主题下均可见。

- [ ] **Step 6: 提交**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git add src/components/Toolbar.vue && git commit -m "feat(earth): 工具条四分组 + CuTooltip 气泡(快捷键标注/防误触延迟)"
```

---

### Task 11: 命令面板(核心状态机 TDD + E2E + 首页集成)

**Files:**
- Create: `src/composables/commandPaletteCore.ts`(纯 TS,不 import vue)
- Create: `src/components/CommandPalette.vue`
- Modify: `src/views/EarthView.vue`(集成)
- Test: `tests/unit/commandPaletteCore.test.ts`、`tests/command-palette.spec.ts`

**Interfaces:**
- Consumes: `earthStore.searchIndex`(`Record<string, { lon: number; lat: number }>`),`layerStore.layers`(`LayerNode[]`:`{ id, name, visible, opacity, children }`),EarthView 既有 handlers。
- Produces:
  - `commandPaletteCore.ts`:`type PaletteItem = { key: string; group: string; label: string; hint?: string }`;`filterItems(items: PaletteItem[], query: string, limit = 12): PaletteItem[]`;`moveActive(current: number, delta: number, total: number): number`;`export type CommandItem = PaletteItem & { run: () => void }`(类型放核心层:`<script setup>` 内不允许 ES export,Vue 层与 EarthView 都从这里引);
  - `<CommandPalette ref>`:props `groups: Array<{ name: string; items: Array<PaletteItem & { run: () => void }> }>`;`defineExpose({ open })`;emit `execute(item)`;根 `data-testid="command-palette"`;
  - 范围:**仅首页挂载**(spec 决策点 2 的最小落地)。

- [ ] **Step 1: 先写失败的核心单测(Node 内置 test,仓库无 vitest;`allowImportingTsExtensions` 已开,tests/ 不在 vue-tsc 范围)**

`tests/unit/commandPaletteCore.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterItems, moveActive, type PaletteItem } from '../../src/composables/commandPaletteCore.ts'

const items: PaletteItem[] = [
  { key: '地点:中国', group: '地点', label: '中国' },
  { key: '地点:智利', group: '地点', label: '智利' },
  { key: '图层:地震', group: '图层', label: '地震历史数据' },
  { key: '工具:截图', group: '工具', label: '截图' },
]

test('空查询按原序返回,受 limit 截断', () => {
  assert.equal(filterItems(items, '').length, 4)
  assert.deepEqual(filterItems(items, '', 2).map(i => i.key), ['地点:中国', '地点:智利'])
})

test('子串过滤命中 label', () => {
  assert.deepEqual(filterItems(items, '地震').map(i => i.key), ['图层:地震'])
})

test('无命中返回空数组(不抛错)', () => {
  assert.deepEqual(filterItems(items, '不存在的词'), [])
})

test('moveActive 环绕移动,空列表安全', () => {
  assert.equal(moveActive(0, -1, 4), 3)
  assert.equal(moveActive(3, 1, 4), 0)
  assert.equal(moveActive(0, 1, 0), 0)
})
```

- [ ] **Step 2: 跑单测确认失败**

```bash
cd /Users/zhangzhengyang/Desktop/curio && node --experimental-strip-types --test tests/unit/commandPaletteCore.test.ts
```
Expected: FAIL,`Cannot find module .../commandPaletteCore.ts`。

- [ ] **Step 3: 实现核心状态机**

`src/composables/commandPaletteCore.ts`:

```ts
/**
 * 命令面板核心:纯数据变换,不 import vue —— 让 node:test 能直接跑
 * (tests/unit/commandPaletteCore.test.ts)。Vue 响应式壳在 CommandPalette.vue。
 */
export interface PaletteItem {
  /** 全局唯一:`${group}:${id}` */
  key: string
  group: string
  label: string
  hint?: string
}

export function filterItems(items: PaletteItem[], query: string, limit = 12): PaletteItem[] {
  const q = query.trim().toLowerCase()
  const hit = q
    ? items.filter(i => i.label.toLowerCase().includes(q))
    : items
  return hit.slice(0, limit)
}

/** 环绕移动;total 为 0 时恒返回 0,避免 NaN 混进 activeIndex */
export function moveActive(current: number, delta: number, total: number): number {
  if (total === 0) return 0
  return (current + delta + total) % total
}

/** Vue 层的命令项:带执行器。核心层只定义类型不执行,保持可单测 */
export type CommandItem = PaletteItem & { run: () => void }
```

- [ ] **Step 4: 跑单测确认通过**

```bash
cd /Users/zhangzhengyang/Desktop/curio && node --experimental-strip-types --test tests/unit/commandPaletteCore.test.ts
```
Expected: 4 passed(`# PASS` 输出,退出码 0)。

- [ ] **Step 5: 再写失败的 E2E**

`tests/command-palette.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('首页命令面板', () => {
  test('Ctrl/Cmd+K 唤起,搜索地点后回车执行并关闭', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('ControlOrMeta+k')
    const palette = page.getByTestId('command-palette')
    await expect(palette).toBeVisible()
    await palette.locator('input').fill('中国')
    await expect(palette.getByRole('button', { name: /中国/ })).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(palette).toBeHidden()
  })

  test('Escape 关闭;范围仅首页,/examples 上不响应(spec 决策点 2)', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByTestId('command-palette')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('command-palette')).toBeHidden()

    await page.goto('/examples')
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByTestId('command-palette')).toHaveCount(0)
  })
})
```

- [ ] **Step 6: 跑 E2E 确认失败**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/command-palette.spec.ts
```
Expected: FAIL(`command-palette` 不存在)。

- [ ] **Step 7: 实现 CommandPalette.vue**

`src/components/CommandPalette.vue`:

```vue
<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="cu-palette-mask"
      data-testid="command-palette"
      @mousedown.self="close"
    >
      <div
        class="cu-palette"
        role="dialog"
        aria-label="命令面板"
      >
        <div class="cu-palette__input-row">
          <UiIcon
            name="search"
            :size="18"
            class="cu-palette__search-icon"
          />
          <input
            ref="inputRef"
            v-model="query"
            class="cu-palette__input"
            placeholder="搜索地点、图层或工具…"
            @keydown.down.prevent="active = moveActive(active, 1, flat.length)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="executeActive()"
            @keydown.escape.prevent="close"
          >
          <kbd class="cu-palette__esc">Esc</kbd>
        </div>
        <div class="cu-palette__results">
          <template
            v-for="group in visibleGroups"
            :key="group.name"
          >
            <p class="cu-palette__group-name">
              {{ group.name }}
            </p>
            <button
              v-for="item in group.items"
              :key="item.key"
              class="cu-palette__item"
              :class="{ active: item.key === activeKey }"
              type="button"
              @click="execute(item)"
              @mousemove="active = flat.findIndex(f => f.key === item.key)"
            >
              <span class="cu-palette__item-label">{{ item.label }}</span>
              <span
                v-if="item.hint"
                class="cu-palette__item-hint"
              >{{ item.hint }}</span>
            </button>
          </template>
          <p
            v-if="!flat.length"
            class="cu-palette__empty"
          >
            没有匹配的结果
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import UiIcon from './UiIcon'
import { filterItems, moveActive, type CommandItem } from '../composables/commandPaletteCore'

const props = defineProps<{
  groups: Array<{ name: string; items: CommandItem[] }>
}>()

const emit = defineEmits<{ execute: [item: CommandItem] }>()

const open = ref(false)
const query = ref('')
const active = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const flat = computed(() =>
  filterItems(
    props.groups.flatMap(g => g.items),
    query.value,
  ),
)

const visibleGroups = computed(() => {
  const keys = new Set(flat.value.map(i => i.key))
  return props.groups
    .map(g => ({ name: g.name, items: g.items.filter(i => keys.has(i.key)) }))
    .filter(g => g.items.length)
})

const activeKey = computed(() => flat.value[active.value]?.key)

watch(query, () => { active.value = 0 })

watch(open, async (v) => {
  if (v) {
    query.value = ''
    active.value = 0
    await nextTick()
    inputRef.value?.focus()
  }
})

function move(delta: number) {
  active.value = moveActive(active.value, delta, flat.value.length)
}

function execute(item: CommandItem) {
  close()
  item.run()
  emit('execute', item)
}

function executeActive() {
  const item = flat.value[active.value]
  if (item) execute(item as CommandItem)
}

function close() {
  open.value = false
}

defineExpose({
  open: () => { open.value = true },
})
</script>

<style scoped>
.cu-palette-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: color-mix(in srgb, var(--cu-background) 55%, transparent);
  display: flex;
  justify-content: center;
  /* 顶栏 56px 之下视觉居中 */
  padding-top: calc(var(--cu-top-nav-height) + 12vh);
  animation: cu-palette-fade var(--cu-dur-fast) var(--cu-ease);
}
.cu-palette {
  width: min(560px, calc(100% - var(--cu-margin) * 2));
  height: fit-content;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  background: var(--cu-surface-container-lowest);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--cu-outline-variant);
  border-radius: var(--cu-radius-xl);
  box-shadow: var(--cu-shadow-3);
  overflow: hidden;
  animation: cu-palette-pop var(--cu-dur) var(--cu-ease);
}
.cu-palette__input-row {
  display: flex;
  align-items: center;
  gap: var(--cu-sm);
  padding: var(--cu-md);
  border-bottom: 1px solid var(--cu-outline-variant);
}
.cu-palette__search-icon { color: var(--cu-outline); flex-shrink: 0; }
.cu-palette__input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  color: var(--cu-on-surface);
  font-size: var(--cu-fs-lg);
}
.cu-palette__input::placeholder { color: var(--cu-outline); }
.cu-palette__esc {
  font-family: var(--cu-font-mono);
  font-size: var(--cu-fs-xs);
  color: var(--cu-on-surface-variant);
  border: 1px solid var(--cu-outline-variant);
  border-radius: var(--cu-radius-sm);
  padding: 1px 6px;
}
.cu-palette__results { overflow-y: auto; padding: var(--cu-sm); }
.cu-palette__group-name {
  font-size: var(--cu-fs-xs);
  font-weight: 600;
  color: var(--cu-on-surface-variant);
  padding: var(--cu-sm) var(--cu-sm) var(--cu-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cu-palette__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cu-sm);
  width: 100%;
  padding: 9px var(--cu-sm);
  border: none;
  border-radius: var(--cu-radius-md);
  background: transparent;
  color: var(--cu-on-surface);
  font-size: var(--cu-fs-md);
  cursor: pointer;
  text-align: left;
}
.cu-palette__item.active,
.cu-palette__item:hover {
  background: var(--cu-surface-container-high);
}
.cu-palette__item-hint {
  font-size: var(--cu-fs-xs);
  color: var(--cu-on-surface-variant);
  font-variant-numeric: tabular-nums;
}
.cu-palette__empty {
  padding: var(--cu-lg);
  text-align: center;
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-sm);
}

@keyframes cu-palette-fade {
  from { opacity: 0; }
}
@keyframes cu-palette-pop {
  from {
    opacity: 0;
    translate: 0 -6px;
  }
}
</style>
```

- [ ] **Step 8: EarthView 集成**

`EarthView.vue`:

import 区追加:

```ts
import CommandPalette from '../components/CommandPalette.vue'
import { type CommandItem } from '../composables/commandPaletteCore'
```

script 中 `const fileInput = ...` 之后追加:

```ts
// ── 命令面板(仅首页挂载,spec 决策点 2)──
const commandPaletteRef = ref<InstanceType<typeof CommandPalette> | null>(null)

const paletteGroups = computed<Array<{ name: string; items: CommandItem[] }>>(() => [
  {
    name: '地点',
    items: Object.entries(earthStore.searchIndex).map(([name, d]) => ({
      key: `地点:${name}`,
      group: '地点',
      label: name,
      hint: `${d.lon.toFixed(0)}, ${d.lat.toFixed(0)}`,
      run: () => earthCanvasRef.value?.flyTo(d.lon, d.lat),
    })),
  },
  {
    name: '图层',
    items: layerList.value.map(l => ({
      key: `图层:${l.id}`,
      group: '图层',
      label: l.name,
      hint: l.visible ? '显示中' : '已隐藏',
      run: () => handleLayerToggle(l.id, !l.visible),
    })),
  },
  {
    name: '工具',
    items: [
      { key: '工具:自动旋转', group: '工具', label: '自动旋转', hint: 'Space', run: () => { earthStore.isRotating = !earthStore.isRotating } },
      { key: '工具:截图', group: '工具', label: '截图', hint: 'S', run: handleScreenshot },
      { key: '工具:夜间模式', group: '工具', label: '夜间模式', hint: 'N', run: handleNightToggle },
      { key: '工具:云层', group: '工具', label: '云层', run: handleCloudToggle },
      { key: '工具:风暴', group: '工具', label: '风暴', run: handleStorm },
      { key: '工具:分屏对比', group: '工具', label: '分屏对比', run: handleSplitScreen },
      { key: '工具:数据巡游', group: '工具', label: '数据巡游', run: openTourPicker },
    ],
  },
])
```

模板在 `<input ref="fileInput" ...>` 之前加:

```vue
    <CommandPalette
      ref="commandPaletteRef"
      :groups="paletteGroups"
    />
```

`handleKeydown` 函数体**最前面**(在 INPUT/SELECT 守卫之前,保证输入框聚焦时 ⌘K 仍可唤起)插入:

```ts
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    commandPaletteRef.value?.open()
    return
  }
```

同函数 `switch` 内(`case ' '` 之前)追加:

```ts
    case '/': e.preventDefault(); commandPaletteRef.value?.open(); break
```

- [ ] **Step 9: 跑命令面板 E2E 确认通过**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/command-palette.spec.ts
```
Expected: 2 passed。

- [ ] **Step 10: 跑首页回归 E2E**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx playwright test tests/smoke.spec.ts tests/earth-url-state.spec.ts tests/tour.spec.ts tests/viz-loading.spec.ts tests/earth-geo-index.spec.ts
```
Expected: 全 passed(`/` 快捷键语义未被破坏:`/` 原本无绑定,Space/S/N 等原样)。

- [ ] **Step 11: 提交**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git add src/composables/commandPaletteCore.ts src/components/CommandPalette.vue src/views/EarthView.vue tests/unit/commandPaletteCore.test.ts tests/command-palette.spec.ts && git commit -m "feat(earth): 首页命令面板(⌘K /),聚合地点/图层/工具三组命令"
```

---

### Task 12: M2 验收闸门 + 用户硬验收

**Files:** 无新改动(纯验证 + 交付)。

- [ ] **Step 1: 全量七环 + typecheck(独占)+ lint**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npm run verify && npm run lint:ci
```

```bash
cd /Users/zhangzhengyang/Desktop/curio && npm run typecheck
```
Expected: 全绿。

- [ ] **Step 2: 生产构建到仓外目录(后台)**

```bash
cd /Users/zhangzhengyang/Desktop/curio && npx vite build --outDir /tmp/earth-build-m2 --emptyOutDir true
```

完成后**必须**补运行时资源(裸 vite build 不含 copy-example-deps,preview 下示例页会全挂,AGENTS.md §6):

```bash
cd /Users/zhangzhengyang/Desktop/curio && node scripts/copy-example-deps.js --outDir /tmp/earth-build-m2
```

- [ ] **Step 3: preview 全量 E2E**

```bash
cd /Users/zhangzhengyang/Desktop/curio && E2E_TARGET=preview E2E_PREVIEW_OUT_DIR=/tmp/earth-build-m2 npm run test:e2e
```
Expected: `N passed`(看 passed 数,不看 npm 退出状态)。dev 侧若 Step 1 前没跑过,补一遍 `npm run test:e2e`。

- [ ] **Step 4: 截取样板页成品图交用户**

复用 Task 1 截图脚本思路,对 `/`(暗色,加载完成后浮层齐备)与 `/`(亮色)各截一张到 `/tmp/curio-m2-final/`,连同 DesignKit 页一起打包给用户看。

- [ ] **Step 5: 硬闸门——停下等用户验收**

向用户呈现截图与变更摘要(顶栏 pill / 浮层统一 / 错峰进场 / 工具条分组 / 命令面板 / 闪白修复),**明确请求验收**。用户点头前不得开始 M3/M4;用户提出修改意见 → 回对应任务修,重跑本任务 Step 1–4。

- [ ] **Step 6: 验收通过后收尾**

```bash
cd /Users/zhangzhengyang/Desktop/curio && git status --short
```
Expected: 干净。汇报 M0–M2 完成,M3(平台四页 + 示例库)/ M4(tv- 清零、EarthView 拆分)另立计划再启动。
