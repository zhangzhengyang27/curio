# server/ — 地震数据后端

`/monitor`（地震应急监测）的数据后端。**零 npm 依赖**：`node:http` 路由 +
`node:sqlite` 存储 + 进程内调度，TypeScript 以 `--experimental-strip-types` 直跑
（Node ≥22.6；≥22.18/23.6 可去掉该旗标）。

## 职责

- 抓取 USGS Earthquake Hazards Program 的 GeoJSON feed（`2.5_day` 增量 /
  `2.5_week` 全量），公共领域数据、无需凭据、服务端直连规避浏览器跨境可达性问题；
- SQLite 落库（`server/data/quakes.db`，已 gitignore），USGS 字符串 id 为主键；
- **每 5 分钟增量轮询**（`QUAKE_POLL_MS`）保持实时；**每天 02:00（Asia/Shanghai，
  `QUAKE_DAILY_HOUR`/`QUAKE_DAILY_TZ`）全量重同步**并裁剪 7 天前数据——
  调度在进程内完成，不依赖 OS cron / CI schedule；
- USGS 不可达时**继续服务库内旧数据**（`/api/health.lastError` 暴露原因），
  前端另有打包快照兜底，见 `src/map/monitor/quakeSource.ts`。

## 命令

```bash
npm --prefix server run start   # 生产起服（默认 :8787）
npm --prefix server run dev     # --watch 开发
npm --prefix server run test    # node:test（含 stub USGS 的集成用例）
```

## API

| 路由 | 说明 |
|---|---|
| `GET /api/quakes?since=<ms>&limit=<n>` | `since` 缺省返回最新 200 条（time DESC）；带 `since` 返回该时刻之后的增量 |
| `GET /api/health` | `count` / `range` / `lastSyncAt` / `lastError` / `nextDailySyncAt` |
| `GET /tiles/{vec\|cva\|img\|cia}/{z}/{x}/{y}` | 天地图瓦片同源反代 + 磁盘缓存，见下节 |
| `GET /tiles/health` | 前端据此决定走反代还是直连；带 `hits`/`misses`/`placeholders` 计数 |

CORS 全开（开发期前端在 5173、后端在 8787；生产由 nginx 反代 `/api` 同源化，
见 `docs/DEPLOY.md`）。

## 天地图瓦片反代（`src/tiles.ts`）

可选能力，配了 `TDT_TOKEN` 就自动开。前端要用它还需在 `.env.local` 里设
`VITE_TILE_PROXY=/tiles`；没设或本进程没起时，前端 health 探测失败会**自动退回直连**，
底图行为与历史一致。

解决的是直连天地图的三件事（2026-09-21 实测，浏览器侧一屏新海域）：

| 场景 | 单张 p50 | 一屏补齐 |
|---|---|---|
| 直连（首访） | 117ms | 2.19s / 168 张 |
| 反代 · 服务端缓存冷 | 265ms（上游并发 8） | 2.31s / 133 张 |
| 反代 · 服务端缓存热 | **7.2ms** | 40 张抽样全部 `x-tile-cache: hit` |

1. **重复访问的延迟**：本机直连同一张 vec L8 瓦片三次实测 0.30s / 1.09s / 2.85s；
   命中反代缓存 7.2ms。而一次视角切换要 130~270 张瓦片。
   ⚠ 别指望首访变快 —— 冷缓存下反代与直连基本打平（见上表），
   它的收益从第二次访问同一区域开始，且要跨标签页/跨用户时才显出来
   （浏览器自己的磁盘缓存只能救本标签页）。
2. **并发与配额的冲突**：天地图只有 HTTP/1.1（t0~t7 同一 IP），浏览器单主机
   6 连接是硬上限；而 KNOWN_PITFALLS D3 记录过 48 并发必触发限流。走反代后
   浏览器可以并行打同源，上游并发由 `TILE_UPSTREAM_CONCURRENCY`（默认 8）收口。
   取 8 的依据：冷缓存同一屏，4 并发补齐 3.16s / 单张 p50 331ms，
   8 并发补齐 2.31s / p50 265ms；141 次上游请求 0 占位 0 错误。
3. **缓存键**：直连时 `tk` 在 URL 里，多 key 轮转 = 同一张瓦片多个缓存键；
   反代后浏览器侧 URL 不含 key，`max-age=432000` 与磁盘缓存都吃得满。

⚠ **上游必须伪装浏览器请求头**：天地图「浏览器端」key 拒绝非浏览器 UA
（实测 node 默认 UA → 403，带 Chrome UA + Referer → 200）。默认 UA 可用
`TILE_UPSTREAM_UA` 覆盖。

⚠ **识别不了占位图的真伪**：D3 记录的 4769B「无影像」带字图与 3224B 限流响应体
都是合法图片。这里按特征体积**拒绝入缓存**（下次重取）但仍原样返回，
不在这一层做像素判定。

## 配置（env）

`PORT`（8787）/ `QUAKE_HOST`（127.0.0.1，只监听回环，公网入口交给 nginx 反代）/
`QUAKE_USGS_BASE`（测试指向本地 stub）/ `QUAKE_DB`（`:memory:` 可用）/
`QUAKE_POLL_MS` / `QUAKE_DAILY_HOUR` / `QUAKE_DAILY_TZ` / `QUAKE_RETAIN_DAYS`。
全部有默认值，裸 `npm run start` 即可起。

瓦片反代相关：`TDT_TOKEN`（**未设则整层关闭**；缺省会回退读 `VITE_TDT_TOKEN`）/
`TILE_CACHE_DIR`（`server/data/tile-cache`，已 gitignore）/ `TILE_CACHE_TTL_MS`（5 天）/
`TILE_CACHE_MAX_ENTRIES`（2 万，超出按 mtime 淘汰）/ `TILE_UPSTREAM_CONCURRENCY`（8）/
`TILE_UPSTREAM_BASE`（测试指向本地 stub）/ `TILE_SUBDOMAINS`（`0,1,2,3`）/
`TILE_UPSTREAM_UA` / `TILE_UPSTREAM_REFERER`。

凭据从仓库根的 `.env.local` 读入（`src/envfile.ts`，不覆盖已显式导出的变量），
所以不需要 `TDT_TOKEN=xxx npm run start` 这种把密钥写进 shell 历史的用法。

