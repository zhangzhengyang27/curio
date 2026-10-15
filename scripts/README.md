# scripts 目录说明

> 2026-10-15 示例中心整体移除（内容归 html5-dataviz 项目）后，本目录收敛为
> 「产品闸门 + 数据工具」两类。历史上承载的 registry 生成器 / 注册表写入守卫 /
> 截图流水线 / legacy 一次性脚本（约 50 个文件）已随示例中心一并删除，
> 其行为约定与事故教训仍可在 git 历史（`docs/KNOWN_PITFALLS.md` A6/B1 等）中查到。

| 类别 | 脚本 | 是否可随时跑 |
|---|---|---|
| **质量闸门（只读）** | `check-secrets.mjs`（凭据扫描）、`verify-three-compat.mjs`（three 兼容层哈希基线守卫，`--update` 更新）、`verify-theme-tokens.mjs`（令牌棘轮 + 静态对比度，`--update` 收紧）、`verify-contrast.mjs`（令牌关键文字对 + placeholder 用法） | ✅ 安全，`npm run verify` 串联四项 |
| **审计（只出线索）** | `audit-deps.mjs`（依赖分层扫描，找孤儿依赖）、`audit-pages.mjs`（平台四页巡检，需 dev server） | ✅ 不改文件 |
| **数据工具** | `refresh-quake-snapshot.mjs`（重生成 /monitor 的打包降级快照）、`copy-example-deps.js`（构建后把 `cesium/Build/Cesium` 拷进 `dist/node_modules`——/tools 与 vue-cesium 的生产运行时，由 `npm run build` 自动调用，支持 `--outDir X` 配合裸 `vite build`） | ✅ 可重跑 |

## 主题棘轮的使用提醒

- `verify-theme-tokens.mjs` 的基线在 `scripts/_theme_token_baseline.json`，**只允许下降**；
  改完一批 token 化后用 `--update` 收紧基线。**不要用 `--update` 让失败消失**，那等于把闸门关掉。
- 静态对比度不达标（< 4.5:1）零容忍、不进基线。刻意保留的例外写在被豁免行的
  上一行：`/* theme-tokens:allow */`。

> `scripts/` 下的 `.js` / `.mjs` / `.cjs` 在 ESLint 中被整体放宽（允许未使用变量），
> 它们属于工具脚本，不参与应用代码的质量约束。
