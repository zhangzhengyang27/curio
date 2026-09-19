# TerraVista 3D（earth-app）

基于 Vue 3 + Vite + Three.js + Cesium 的 **3D 数据可视化项目**，包含两条主线：

1. **首页地球应用**：可交互的 3D 地球，叠加人口、GDP、航线、地震、疫情、灯光等多类可视化图层，含时间轴、图层管理、对比视图，以及**数据巡游**（一键自动导览：相机逐站飞行、逐层点亮、字幕解说，`?tour=` 链接可分享，见 [`docs/TOUR_ROUTES.md`](docs/TOUR_ROUTES.md)）。
2. **示例中心**：聚合 **11 个来源、1417 条** Three.js / Cesium / WebGL / 图形学示例的可浏览画廊，支持按技术栈与子分类筛选、搜索、分页、查看源码。

> 当前范围已冻结：**不再接入新的示例来源**，先收口存量并补齐工程治理。
> 详见 [`docs/ROADMAP.md`](docs/ROADMAP.md)。

---

## 快速开始

```bash
# 1. 安装依赖
#    three@0.185 与 three-good-godrays 存在 peer 冲突，需要 --legacy-peer-deps
npm install --legacy-peer-deps

# 2. 配置环境变量（可选，仅百度地图示例需要）
cp .env.example .env.local
#   编辑 .env.local，填入 VITE_BMAP_AK / VITE_TDT_TOKEN

# 3. 启动开发服务器
npm run dev          # http://localhost:5173

# 4. 生产构建
npm run build
```

### 环境变量

| 变量 | 用途 | 是否必需 |
|---|---|---|
| `VITE_BMAP_AK` | 百度地图开放平台 AK（`/bmap` 页面） | 否，未配置时页面优雅降级 |
| `VITE_TDT_TOKEN` | 天地图令牌（部分 Cesium 示例底图） | 否，未配置时相关示例不加载瓦片 |

凭据只写在 `.env.local`（已被 `.gitignore` 忽略），**严禁提交进仓库**；CI 会执行
`npm run check:secrets` 拦截。新增变量请在 `.env.example` 登记。

---

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建（含示例依赖拷贝） |
| `npm run preview` | 预览构建产物 |
| `npm run lint` / `npm run lint:ci` | ESLint（前者自动修复） |
| `npm run typecheck` | 类型检查（`vue-tsc`，覆盖全部 1500 个 `.vue` + 自有 `.ts`，当前 0 error） |
| `npm run test:e2e` | Playwright 冒烟测试（`tests/smoke.spec.js`，跑 dev server） |
| `E2E_TARGET=preview npm run test:e2e` | 冒烟测试跑**已构建产物**（需先 `npm run build`） |
| `npm run verify` | **一键跑全部一致性校验**（见下） |

### 质量阀门

`npm run verify` 串联五项校验，CI 与本地都应保持全绿：

| 校验 | 脚本 | 拦截什么 |
|---|---|---|
| 明文凭据 | `scripts/check-secrets.mjs` | AK / Token / 私钥被写进仓库 |
| 注册表一致性 | `scripts/verify-registry.mjs` | 主键冲突、字段缺失、**示例组件文件找不到** |
| 注册表漂移 | `npm run verify:drift` | 改了 registry 却没同步生成器（或反之）。串起 3 个生成器以 `--check` 做**逐字节**比对，比行数统计严格 |
| 封面完整性 | `scripts/verify-thumbnails.mjs` | 非空 thumbnail 对应文件缺失（线上破图） |
| 兼容层守卫 | `scripts/verify-three-compat.mjs` | three.js 本地兼容层被静默改动 |

CI 定义在 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)：
`凭据扫描 → ESLint → 类型检查 → 四项校验 → 生产构建 → 冒烟 E2E（dev + 生产产物）`。

> 冒烟测试要跑两种模式：dev server 反馈快，但**不经过生产打包**，
> 测不出分包 / 产物相关问题，因此 CI 里还会用 `vite preview` 跑一遍真实产物。

---

## 目录结构

```
src/
├── App.vue                 # 全站顶栏（品牌 / 导航 / 搜索 / 主题切换）
├── main.js
├── router/index.js         # / · /three-globe · /examples · /bmap · /tools（地图工具箱）· /analysis（全球数据分析）· /workbench（分析工作台）· /monitor（业务监控）
├── components/             # 首页地球应用组件（EarthCanvas、面板、工具栏…）
├── composables/            # 首页用 composable（useScene/useRenderLoop/useRaycaster…）
├── stores/                 # Pinia：地球/图层/时间轴/主题/交互
├── three/                  # 首页地球渲染层：objects / layers / geo / utils / gc
├── views/                  # EarthView、ThreeGlobeGallery、GlobeDemo、BMap
└── examples/               # ★ 示例中心
    ├── registry/           # 11 个数据源注册表 + 聚合入口 index.js
    ├── components/         # 1429 个示例组件(全部 lang="ts")，按 {source}/{category}/{Id}Example.vue 约定
    ├── views/              # ExampleGallery（画廊）/ ExampleDemo（详情）/ ExampleHost（宿主）
    ├── runners/            # IframeRunner
    ├── composables/        # useExampleFilters、各技术栈 stage
    ├── jsm-compat/         # three.js addons 本地副本
    └── three-build-compat/ # three.js 预发布 build 兼容层（见 docs/THREE_UPGRADE.md）
```

---

## 文档

| 文档 | 内容 |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | 架构与关键机制（示例解析、兼容层、资源清理） |
| [`docs/KNOWN_PITFALLS.md`](docs/KNOWN_PITFALLS.md) | **动手前必读**：历史踩坑与不可逆操作 |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | 范围声明、待办与优先级（已完成项归档见 [`docs/CHANGELOG.md`](docs/CHANGELOG.md)） |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | 部署指引：产物形态、托管硬性要求、发布前校验 |
| [`docs/THREE_UPGRADE.md`](docs/THREE_UPGRADE.md) | three.js 兼容层机制与切回 npm 的步骤 |
| [`docs/PERF_BASELINE.md`](docs/PERF_BASELINE.md) | 首屏/画廊性能基线与测量方法（`npm run test:e2e` 含 `性能基线` 用例） |
| [`docs/TOUR_ROUTES.md`](docs/TOUR_ROUTES.md) | 数据巡游分镜与路线数据（改文案/镜头只改 `src/three/tours/*.json`） |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | 提交规范、评审要求、红线 |
| [`.trae/specs/`](.trae/specs/) · [`.trae/documents/`](.trae/documents/) | 历史 spec 与实施计划归档（早期接入各示例源时的规格与任务清单）。**路径为当时环境的绝对路径，已失效，仅作决策留痕** |

## 参考

- 主要技术栈：Vue 3.5 · Vite 8 · Three.js 0.185（+ r186dev 兼容层）· Cesium 1.142 · Pinia 3
- 示例来源（11）：`threejs-official`、`three-cesium-examples`、`cesium-examples`、`webgl`、
  `graphics`、`mygrapics`、`three-project`、`threejs-lesson`、`earth-lessons`、
  `city-realtime-webgl`、`granary-3d`
