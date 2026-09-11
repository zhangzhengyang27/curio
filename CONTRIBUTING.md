# 贡献指南

## 1. 环境准备

```bash
npm install --legacy-peer-deps     # peer 冲突见 docs/KNOWN_PITFALLS.md C1
cp .env.example .env.local         # 可选：填地图 AK / 天地图令牌
npm run dev
```

可选：启用本地提交钩子（每个克隆执行一次，属于本机 git 配置，需自行决定）：

```bash
git config core.hooksPath .githooks
```

钩子只做一件事：提交前跑 `scripts/check-secrets.mjs`（秒级）。完整校验交给 CI。

---

## 2. 提交规范

- **提交信息用中文**，采用 `type(scope): 摘要` 形式，正文说明「为什么」而不只是「改了什么」。
  - 示例：`fix(examples): 示例去除对全局 DOM 的硬依赖，lil-gui 实例统一追踪清理`
  - 常用 type：`feat` / `fix` / `refactor` / `perf` / `chore` / `docs` / `test` / `build`
- **小步提交**：单次提交聚焦一个主题。历史上有过「一次提交 226 个文件」的教训，
  导致 diff 无法审查、回滚困难。
- **不要把跨天未完成的改动一直留在工作树**：工作树长期 dirty 会让进度不可见、且无法回退。
  未完成就先提交到功能分支。

---

## 3. 提交前检查清单

```bash
npm run check:secrets     # 凭据没有明文入库
npm run lint:ci           # ESLint 无 error
npm run typecheck:ts      # 自有 TS 源码类型检查
npm run verify            # 注册表 / 封面 / 兼容层 三项一致性
npm run build             # 能正常构建
npm run test:e2e          # 冒烟用例通过（dev server，反馈快）
E2E_TARGET=preview npm run test:e2e   # 冒烟用例跑生产产物（合并前必跑）
```

改动涉及 `vite.config.js` 的分包、构建期 env 注入、或任何产物形态时，
**必须**跑 `E2E_TARGET=preview` 那一遍 —— dev 模式不经过生产打包，测不出这类问题。

CI（`.github/workflows/ci.yml`）会执行同样的门禁，本地先跑一遍能省一轮往返。

---

## 4. 常见改动场景

### 4.1 修改 / 修复已有示例

1. 组件文件位于 `src/examples/components/{source}/{category}/{PascalCase(id)}Example.vue`。
2. 改完确认 `npm run verify:registry` 通过。
3. 涉及渲染的改动，请用 `npm run dev` 打开对应详情页实测。

### 4.2 删除示例

严格按顺序执行（否则会出现「注册表引用不存在的文件」）：

1. `git rm` 源文件（如 `public/external-examples/.../*.js`、对应 `.tsx`）。
2. 手动编辑 `src/examples/registry/<对应>.js` 删除条目。
3. 清理 `scripts/_thumb_map.json` 中对应映射。
4. 删除缩略图 `public/example-thumbs/.../<id>.jpg`。
5. 如生成器脚本中有 titleMap 之类的死键，一并清理，防止重跑复活。
6. `npm run verify` 通过。

> 不要通过重跑生成器脚本来"自动清理"，参见 `docs/KNOWN_PITFALLS.md` B1。

### 4.3 重命名示例 id

`id` 与组件文件名是强约定关系，必须同步：

```bash
git mv .../components/{source}/{category}/OldNameExample.vue \
       .../components/{source}/{category}/NewNameExample.vue
# 同时更新 registry 中的 id（以及 entry / thumbnail 若含 id）
npm run verify:registry   # 必须通过
```

### 4.4 接入新的示例来源

**当前已冻结**（见 `docs/ROADMAP.md` 第 0 节）。确需接入时需先在 ROADMAP 登记并说明长期归属，
然后再按以下流程：

1. 在 `src/examples/registry/` 新增注册表文件，`source` 必须全局唯一
   （历史上 `city-realtime` 因 source 与 `webgl` 撞车导致示例不可达）。
2. 在 `src/examples/registry/index.js` 的 `registryLoaders` 中登记。
3. 组件目录必须落在 `src/examples/components/{source}/...`，与 source 名称严格一致
   （否则组件解析会失败，且不会有构建报错）。
4. 在 `useExampleFilters.js` 中补充技术栈归类。
5. `npm run verify` 通过。

### 4.5 新增环境变量

1. 在 `.env.example` 登记变量名并写清楚申请入口与安全要求。
2. 本地真实值写 `.env.local`（**不要**写进任何入库文件）。
3. 代码中通过 `import.meta.env.VITE_XXX` 读取，并在 `env.d.ts` 的 `ImportMetaEnv` 中补类型。
4. 做好「未配置时优雅降级」，不要因为缺配置就整页白屏。
5. 若为第三方凭据，请同时评估是否需要配置 Referer / 域名白名单。

---

## 5. 红线

| 红线 | 说明 |
|---|---|
| 凭据入库 | 任何 AK / Token / 私钥都不得写进受版本控制的文件 |
| 硬编码本机绝对路径 | 配置文件、脚本中不得出现 `/Users/<某人>/...` 这类路径 |
| 直接 push 到 `main` | 大改动请走分支 + PR，至少一道复审 |
| 重跑覆盖式生成脚本 | 见 `docs/KNOWN_PITFALLS.md` B1 |
| 只改 registry 不改组件文件名（或反之） | 会静默产生白屏示例，CI 会拦截 |
| 绕过 CI | 不要用 `--no-verify` 跳过钩子；闸门失败请修问题而不是绕开 |

---

## 6. 评审要求

- 评审者重点看：是否有回归风险、是否新增未登记的凭据/路径、是否补充了对应校验。
- 涉及示例解析约定、注册表结构、`vite.config.js` 解析逻辑的改动，必须说明影响面。
- 改动页面结构时，同步更新 `tests/smoke.spec.js` 中的选择器（若选择了对应元素）。
