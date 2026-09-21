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

CORS 全开（开发期前端在 5173、后端在 8787；生产由 nginx 反代 `/api` 同源化，
见 `docs/DEPLOY.md`）。

## 配置（env）

`PORT`（8787）/ `QUAKE_HOST`（127.0.0.1，只监听回环，公网入口交给 nginx 反代）/
`QUAKE_USGS_BASE`（测试指向本地 stub）/ `QUAKE_DB`（`:memory:` 可用）/
`QUAKE_POLL_MS` / `QUAKE_DAILY_HOUR` / `QUAKE_DAILY_TZ` / `QUAKE_RETAIN_DAYS`。
全部有默认值，裸 `npm run start` 即可起。
