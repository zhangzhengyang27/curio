# Curio

> **Curio · 数字地球平台**：以 Cesium 为底座的 3D 数据可视化应用——
> 开场地球 + 地图工具箱 + 全球数据分析 + 地震应急监测 + 分析工作台五个页面，另附 ThreeGlobe 示例集与百度地图集成。

基于 Vue 3 + Vite + Three.js + Cesium 的数字地球平台：

1. **首页地球**：可交互的 3D 地球，叠加人口、GDP、航线、地震、疫情、灯光等多类可视化图层，含时间轴、图层管理、对比视图，以及**数据巡游**（一键自动导览：相机逐站飞行、逐层点亮、字幕解说，`?tour=` 链接可分享，见 [`docs/TOUR_ROUTES.md`](docs/TOUR_ROUTES.md)）。
2. **平台四页**（顶栏进入，各自闭环）：
   - `/tools` **地图工具箱**：量距/量面/标绘（顶点编辑）/坐标转换/书签/导出 GeoJSON，+ vue-cesium 十七示例
   - `/analysis` **全球数据分析**：GDP/人口/碳排放着色图 + 国家对比 + 时间轴播放
   - `/monitor` **地震应急监测**：真实 USGS 数据链路（零依赖后端 `server/`）→ 告警处置流转 → 统计大盘
   - `/workbench` **主题分析工作台**：双主题着色图 + Top10 + 图表联动 + 一键导出自包含 HTML 报告
3. **附属**：`/three-globe` ThreeGlobe 示例集（18 个 Globe 演示）、`/bmap` 百度地图集成。

> 历史沿革：本仓库曾聚合 11 来源 / 1400+ 条前端可视化示例（「示例中心」）。
> 2026-10-05~08 分两批迁出至 [html5-dataviz](../publish/html5-dataviz) 项目，
> **2026-10-15 示例中心整体移除**，curio 收敛为纯数字地球平台。历史文档见 `docs/CHANGELOG.md`。

---

## 快速开始

```bash
# 1. 安装依赖
#    部分依赖曾有 peer 冲突，一贯使用 --legacy-peer-deps（示例中心移除后冲突源已删，flag 保留以防万一）
npm install --legacy-peer-deps

# 2. 配置环境变量（可选，仅百度地图示例需要）
cp .env.example .env.local
#   编辑 .env.local，填入 VITE_BMAP_AK / VITE_TDT_TOKEN / VITE_AMAP_KEY

# 3. 启动开发服务器
npm run dev          # http://localhost:5173

# 4. 生产构建
npm run build
```

### 环境变量

| 变量 | 用途 | 是否必需 |
|---|---|---|
| `VITE_BMAP_AK` | 百度地图开放平台 AK（`/bmap` 页面） | 否，未配置时页面优雅降级 |
| `VITE_TDT_TOKEN` | 天地图令牌（平台各页底图，支持逗号分隔多 key） | 否，未配置时相关图层不加载瓦片 |
| `VITE_AMAP_KEY` | 高德 Web 服务 key（工具箱地名搜索的兜底通道） | 否 |
| `VITE_TILE_PROXY` | 设为 `/tiles` 时启用天地图瓦片反代（需 `server/` 在跑） | 否，探测失败自动退回直连 |

凭据只写在 `.env.local`（已被 `.gitignore` 忽略），**严禁提交进仓库**；CI 会执行
`npm run check:secrets` 拦截。新增变量请在 `.env.example` 登记。

---

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建（`vite build` + 拷贝 Cesium 运行时到 `dist/node_modules`） |
| `npm run preview` | 预览构建产物 |
| `npm run lint` / `npm run lint:ci` | ESLint（前者自动修复） |
| `npm run typecheck` | 类型检查（`vue-tsc`，覆盖 `src` 下全部 `.vue` 与自有 `.ts`，当前 0 error） |
| `npm run test:e2e` | Playwright 冒烟测试（跑 dev server） |
| `E2E_TARGET=preview npm run test:e2e` | 冒烟测试跑**已构建产物**（需先 `npm run build`） |
| `npm run test:unit` | 前端纯逻辑单测（Node 内置 `node:test`） |
| `npm run verify` | **一键跑四项一致性校验**（见下） |
| `npm run dev:server` / `test:server` | `/monitor` 地震数据后端（零依赖，:8787） |
| `npm run audit:deps` | 依赖使用审计（只出线索，不改文件） |

### 质量阀门

`npm run verify` 串联四项校验，CI 与本地都应保持全绿：

| 校验 | 脚本 | 拦截什么 |
|---|---|---|
| 明文凭据 | `scripts/check-secrets.mjs` | AK / Token / 私钥被写进仓库 |
| three 兼容层守卫 | `scripts/verify-three-compat.mjs` | 本地兼容层（产品 three.js 的实际来源）被静默改动 |
| 主题令牌/对比度 | `npm run verify:theme` | 硬编码色值超出棘轮基线；`color`/`background` 字面量对比度 < 4.5:1 |
| 令牌对比度（关键文字对） | `npm run verify:contrast` | theme.css 令牌值本身：12 对关键文字对 WCAG 实测 ≥ 4.5:1，且全仓 `::placeholder` 只允许 on-surface 系令牌 |

CI 定义在 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)：
`凭据扫描 → ESLint → 类型检查 → 四项校验 → 单测（server + 前端纯逻辑）→ 生产构建 → 冒烟 E2E（dev + 生产产物）`。

> 冒烟测试要跑两种模式：dev server 反馈快，但**不经过生产打包**，
> 测不出分包 / 产物相关问题，因此 CI 里还会用 `vite preview` 跑一遍真实产物。

---

## 目录结构

```
src/
├── App.vue                 # 按路由选外壳（ProductShell / ResourceShell）
├── shells/                 # 两个顶栏外壳：产品（5 项平台导航）/ 资源（ThreeGlobe + 百度地图）
├── router/index.ts         # / · /tools · /analysis · /monitor · /workbench · /three-globe · /bmap · /design-kit
├── components/             # 首页地球应用组件（EarthCanvas、面板、工具栏…）
├── composables/            # 首页用 composable（useScene/useRenderLoop/useRaycaster…）
├── stores/                 # Pinia：地球/图层/时间轴/主题/交互
├── three/                  # 首页地球渲染层：objects / layers / geo / utils / gc
├── map/                    # 平台共享底座：Cesium 加载器、工具箱控制器、analysis/monitor 数据层
├── views/                  # EarthView、tools、analysis、monitor、workbench、ThreeGlobe、BMap
└── examples/               # ★ three.js 兼容层（产品依赖，非示例）
    ├── three-build-compat/ # three r186dev 预发布 build，`import 'three'` 的实际解析目标
    └── jsm-compat/         # three 官方 examples/jsm 本地副本（CSS2DRenderer 等 14+ 处产品导入）
```

---

## 文档

| 文档 | 内容 |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | 架构与关键机制（页面结构、兼容层、资源清理） |
| [`docs/KNOWN_PITFALLS.md`](docs/KNOWN_PITFALLS.md) | **动手前必读**：历史踩坑与不可逆操作 |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | 范围声明、待办与优先级（已完成项归档见 [`docs/CHANGELOG.md`](docs/CHANGELOG.md)） |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | 部署指引：产物形态、托管硬性要求、发布前校验 |
| [`docs/THREE_UPGRADE.md`](docs/THREE_UPGRADE.md) | three.js 兼容层机制与切回 npm 的步骤 |
| [`docs/PERF_BASELINE.md`](docs/PERF_BASELINE.md) | 首屏/平台页性能基线与测量方法 |
| [`docs/TOUR_ROUTES.md`](docs/TOUR_ROUTES.md) | 数据巡游分镜与路线数据（改文案/镜头只改 `src/three/tours/*.json`） |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | 提交规范、评审要求、红线 |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | 治理轮次归档（含示例中心从接入到迁出、移除的全过程） |

## 参考

- 主要技术栈：Vue 3.5 · Vite 8（Rolldown 内核）· Three.js 0.185（+ r186dev 兼容层）· Cesium 1.142 · vue-cesium 3 · Pinia 3
- 关联项目：示例库内容（原 11 来源 1400+ 条）现由 **html5-dataviz** 项目承载
