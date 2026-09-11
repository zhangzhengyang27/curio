# 已知坑点与不可逆操作

> **动手前必读。** 以下每一条都是历史上真实发生过、并且造成过误判或返工的问题。
> 原先是散落在开发会话记忆里的，现沉淀到仓库，避免「只有一个人知道」。

---

## A. 会造成误判的「静默假通过」

### A1. 注册表懒加载：同步取值会返回空数组

**现象**：写脚本校验示例数据，输出「总示例: 0 / 无问题」，看起来全绿，其实一条都没检查。

**根因**：`src/examples/registry/index.js` 已改为按 source 懒加载，
`getAllExamples()` 只读缓存，未加载时返回 `[]`。

**正确做法**：脚本中一律使用 `await getAllExamplesAsync()`（或先 `await loadAllRegistries()`）。

**已加固**：`verify-thumbnails.mjs` 曾因此静默失效，现已修复；`verify-registry.mjs` 额外增加了
「总数不得为 0」的兜底断言。

### A2. 校验脚本必须能被 CI 真正执行

**现象**：`playwright.config.js` 的 `testDir` 指向 `tests/`，但 `.gitignore` 里
`verify-examples.mjs` / `check-*.mjs` / `test-*.py` 缺少前导 `/`，会匹配任意层级，
把整个 `tests/` 目录与 `scripts/check-secrets.mjs` 一并忽略 —— 结果是「配置存在、用例为 0」。

**正确做法**：忽略一次性脚本时必须用 `/` 锚定仓库根目录；新增校验脚本后，
本地执行一次确认退出码符合预期，并确认 `git check-ignore -v <path>` 没有命中。

### A3. 封面截图黑屏会被当成成功

**现象**：`areaMap.jpg` 只有 3 KB 纯黑，却被判定截图成功。

**根因**：脚本按文件大小阈值（>500B）判断成功，均匀黑 JPEG 也会超过阈值。

**正确做法**：对依赖异步数据构建几何体的示例，截图前等待 `networkidle` 并做
「非纯色/亮度方差」校验。参考 `scripts/screenshot-examples.mjs` 的 CDP 截图方案。

---

## B. 不可逆 / 高危操作

### B1. 不要随便重跑示例注册表生成脚本

`scripts/generate-threejs-lesson-registry.js` 会**整体覆盖** `src/examples/registry/threejsLesson.js`：
其 `runner` 由 `hasVueComponent()` 决定（无对应 `.vue` 就写 `iframe`），并且会丢掉手工维护的
标题 / 描述 / 缩略图 / 标签。

其他生成器（`generate-registry.js`、`convert-*.cjs`、`generate-*.js`）也有同类风险，
文件头通常写着「自动生成，请勿手动修改」，但它们与手工维护的 registry 混用，
**重跑前务必先 `git diff` 确认**，或先提交当前状态作为回退点。

**删除示例的正确流程**：`git rm` 源 `.js`/`.tsx` → 手动编辑 registry 删条目 →
清理 `scripts/_thumb_map.json` 映射 →（可选）删生成脚本中的死键。

### B2. 生成器脚本中曾写死过他人机器路径

历史版本里部分 `convert-*` 脚本把源目录写死成某台机器的绝对路径，在本机从未成功生成过产物。
新增/修改生成脚本时**不要写死绝对路径**，统一基于 `new URL('./...', import.meta.url)` 推导。

### B3. 改名示例 id 必须同步改名组件文件

registry 里的 `id` 通过 `PascalCase(id)Example.vue` 约定映射到组件文件。
只改 registry 不改文件（或反之）会得到「未找到 Vue 组件」的白屏，
且**不会有任何构建报错**。

`scripts/verify-registry.mjs` 会在 CI 中拦住这类问题。改 id 时请同时执行：

```bash
git mv .../OldNameExample.vue .../NewNameExample.vue
npm run verify:registry
```

---

## C. 运行时与构建

### C1. 安装依赖必须加 `--legacy-peer-deps`

`three@0.185` 与 `three-good-godrays`（要求 `three <= 0.182`）存在 peer 冲突。

```bash
npm install --legacy-peer-deps
```

### C2. lil-gui 的类名带 `lil-` 前缀

本项目使用的 lil-gui 版本，根元素实际类名是 `lil-root` / `lil-auto-place`，
**不是**标准的 `root` / `autoPlace`。写全局样式覆盖时必须用 `lil-` 前缀类名，
否则选择器不命中、样式看似"写了却没生效"。

### C3. `three` 相关 import 被重定向到本地兼容层

`three` / `three/webgpu` / `three/tsl` 由 `vite.config.js` 的 `threeCompatResolver`
指向 `src/examples/three-build-compat/`，`three/examples/jsm` 与 `three/addons`
指向 `src/examples/jsm-compat/`。

所以：**不要直接改动 `node_modules/three` 来"验证"问题**，改动不会生效；
也不要在源码里硬编码 `node_modules` 物理路径（历史上 `lil-gui-tracked.js` 这么干过，
现已改为由 vite 别名注入真实入口）。

### C4. macOS 下中文（Unicode）文件名在 vite dev 无法直接服务

**现象**：封面图片在 dev 下破图，返回 `200 text/html`（SPA 兜底）而不是图片。

**根因**：macOS 文件名的 NFC/NFD 规范化 + vite 静态中间件解码不匹配。

**现状**：`vite.config.js` 的 `serveUnicodePublic` 插件（仅 `apply: 'serve'`）
用 Node `fs` 按解码后的中文路径直接读 `public/` 并返回。生产环境由真实静态服务器处理，无需该插件。

**注意**：脚本里「磁盘中文路径」与「HTTP 编码 URL」是有意不对称的，改截图/校验脚本时不要"顺手统一"。

### C5. 新增依赖后页面异常，先清 Vite 缓存

长时间运行的 dev server 在多次 HMR + 新增依赖后模块图会变脏，
表现为路由组件完全不挂载且无报错。

```bash
rm -rf node_modules/.vite && npm run dev
```

### C6. 新增重依赖请同步补 `manualChunks`

`vite.config.js` 的 `manualChunks` 是手工维护的。新增大体积三方库（>100KB）时
请补一条分包规则，否则会被打进主包。

> 注意：实测当前只有部分规则生效（见 `docs/ROADMAP.md` 的「分包规则有效性核查」），
> 调整分包策略前请先对真实产物做测量。

### C7. E2E 必须使用独立端口（默认 5199）

**现象**：`npx playwright test` 的 5 条用例全部以「元素找不到」失败，但应用本身正常。

**根因**：默认 `baseURL` 是 `http://localhost:5173`，而 5173 是 vite 的默认端口，
本机其它项目（本仓库之外）很容易占用它。`reuseExistingServer` 会把测试直接连到
**别人的 dev server** 上，于是断言的全是别的页面。

**现状**：`playwright.config.js` 已改用 `E2E_PORT`（默认 5199）并加 `--strictPort`：
端口被占用时直接失败，而不是让测试打偏。需要覆盖端口时设置环境变量 `E2E_PORT`。

**教训**：自动化测试的「假失败」和「假通过」一样危险 —— 前者会被当成代码问题排查很久，
后者会让闸门形同虚设。凡是「连接到外部服务」的测试，都要先把连接目标固定成独占资源。

---

### C8. 本机环境下第二次 `vite build` 会失败于清空 `dist/`

**现象**：第一次 `npm run build` 正常；之后每次构建都在输出阶段失败：

```
error during build:
Build failed with 1 error:
Error: [safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] {"count":3623,"threshold":500, ... "targets":[".../dist/assets"]}
```

而日志里 `✓ 5957 modules transformed` 已经出现 —— **代码本身没有问题**。

**根因**：本机开发环境对「批量删除」有保护（单次删除超过阈值即拦截，阈值 500）。
`dist/assets` 有 3600+ 个产物文件，vite 构建前清空输出目录会触发拦截。
CI（GitHub Actions 标准 runner）没有这个限制，因此 CI 不受影响。

**绕过方式**：输出到仓库外的临时目录（推荐，可重复执行）：

```bash
npx vite build --outDir /tmp/earth-build-verify --emptyOutDir true
```

或先手动删除 `dist/` 再构建。

**判断要点**：出现 `safe-delete ... BULK_CONFIRM_REQUIRED` 时不要怀疑代码，
它发生在「产物写出」阶段而非「编译」阶段。

---

## D. 凭据与配置

### D1. 地图凭据一律走环境变量

百度地图 AK 与天地图令牌都曾有明文入库的历史（现已移出）。
新凭据只写 `.env.local`（已 gitignore），在 `.env.example` 登记变量名，
代码里通过 `import.meta.env.VITE_XXX` 读取，并做好「未配置时优雅降级」。

`npm run check:secrets` 会在本地与 CI 拦截明文凭据。

### D2. 不要写死本机绝对路径到配置文件

历史问题：`.npmrc` 里写过 `store-dir=/Users/<他人>/...`，换机器/换 CI 直接失败。
已清理。配置文件应保持环境无关。
