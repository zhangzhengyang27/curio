# 项目长期约定（earth-app / TerraVista 3D）

## registry（示例注册表）铁律

- **格式归生成器所有**：`threeCesiumExamples` / `cesiumExamples` / `threejsLesson` /
  `earthLessons` 这 4 个文件的字段顺序、空行、文案由生成器决定。**不要手工调格式**，
  要改就改生成器再重跑；`npm run verify:drift`（CI 同款）会做逐字节比对并拦下。
- **判断漂移用 `--check`，不要用 `--dry-run`**：`--dry-run` 只统计行数/条目数/缩略图数，
  只换字段顺序或只改文案时它会显示 `0 / 0 / 0` 假绿。`--check` 才是逐字节比对。
- `patch-registry-thumbs.mjs` 必须**就地更新** thumbnail，绝不挪动字段位置，
  否则每次跑完都产生一次漂移（历史上它就是漂移源头）。
- 生成器只登记**已有 Vue 组件**的条目（与 `verify-registry` 共用
  `scripts/lib/example-component.mjs`）。有源文件、无组件的示例会被跳过并列出，
  不会静默丢失。
- 重跑任何写 registry 的脚本前必须 `--dry-run`；确认后 `--force`。

## E2E 必踩的坑

- **dev 与 preview 都要跑**。dev 模式首页渲染慢，会让「选择器歧义」这类缺陷侥幸
  通过；生产产物下必然暴露。曾因此漏掉 `.search-input` 命中 2 个元素的问题。
- 首页有两个 `.search-input`：顶栏 `.nav-search .search-input` 和首页地球的
  `components/SearchBox.vue`。断言顶栏时**必须**带 `.nav-search` 限定。
- 判断「首页是否预载了 registry」时，正则要**排除 `registry/index.js`**（barrel，
  静态导入属正常），只匹配 11 个数据分块。

## 验证重构等价性的套路

改 `ExampleGallery` 这类「过滤/聚合」逻辑时，别只靠肉眼看 diff：写个临时脚本直接
对**真实 registry 数据**跑「旧逻辑 vs 新逻辑」，并且**比对命中集合**而不只是数量
（数量碰巧相同会掩盖错配）。技术分桶、子分类计数、关键词命中集合三层都该比。

## 改完要跑的闸门

`npm run verify`（= 凭据扫描 → 注册表一致性 → **漂移检测** → 封面完整性 → three 兼容层），
另外 `npm run typecheck`（全量 vue-tsc，当前 0 error）与 `npm run lint:ci`。
涉及 vite 分包 / env 注入 / 产物形态时，还要跑 `E2E_TARGET=preview npm run test:e2e`。

## agent 入口

根目录 **`AGENTS.md`** 是面向 AI 代理的入口文档（2026-09-12 新增），含 9 条铁律、
5 项闸门、本机环境坑与文档地图。**改动本仓库前先读它**。

## 文档漂移：改了机制要回头改描述

本仓库文档大量**复述**代码事实（校验项数 / 分包机制 / 文件数 / 示例条数），
改了代码它们不会自动更新。已发生过一次：`verify:drift` 并入 `npm run verify` 后，
`README` / `ROADMAP` / CI 注释里的「三项校验」集体滞后（2026-09-12 已修）。
规矩：改完 `grep -rn` 一下涉及的**数字与机制名**，命中 `README` / `docs/` /
`.github/workflows/ci.yml` 注释就一起改。**结构性描述滞后比数字过时更危险。**

## 状态提醒

仓库**没有 remote**，所有提交只在本机磁盘（ROADMAP P0 未做）。
