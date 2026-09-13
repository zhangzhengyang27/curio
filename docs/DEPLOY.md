# 部署指引（静态托管）

> 状态：**方案文档，尚无线上环境**（2026-09）。
> 本项目构建产物是纯静态站点，任何「能服务静态文件 + SPA 回退」的环境均可部署。
> 部署动作依赖 P0「建立远端仓库」之后才可自动化（CI 发布），本文只覆盖产物形态、
> 托管硬性要求与发布前校验。

---

## 1. 产物形态（实测，2026-09）

`npm run build` = `vite build` + `scripts/copy-example-deps.js`，产出 `dist/`：

| 指标 | 数值 | 说明 |
|---|---|---|
| 总量 | **~1.4 GB / 14813 个文件** | 选托管方前先看这个量级 |
| `assets/` | 56 MB | 应用 + 示例分包，文件名带哈希；≥10 KB 文件附 `.gz`/`.br` 预压缩副本 |
| `public/` 拷贝 | ~1.2 GB | `external-examples`(426M) / `threejs-official`(415M) / `three-project`(381M) 等，**示例运行时资源与源码**，非构建产物、不可裁剪 |
| `node_modules/` | 81 MB | `copy-example-deps.js` 拷入的示例运行时依赖（cesium/three/gsap 等） |
| 首屏传输 | 539 KB | 真实用户只按需加载，见 `docs/PERF_BASELINE.md` |

**必须整目录上传 `dist/`**：顶层那些非 assets 目录缺了任何一块，表现都是
「部分示例白屏 / 资源 404」，且**构建不报错**。不要只上传 `assets/` + `index.html`。

---

## 2. 托管硬性要求（三条）

1. **SPA 回退**：路由是 `createWebHistory()`（history 模式），未知路径必须回退到
   `/index.html`，否则 `/examples/:source/...` 深链接刷新直接 404。
2. **整目录服务**：见上节。
3. **正确 MIME 与中文文件名**：封面存在中文文件名（`public/example-thumbs/`）。
   真实静态服务器与对象存储按 URL 编码 key 服务均正常
   （dev 下的特例见 `docs/KNOWN_PITFALLS.md` C4，生产无此问题）。

选型提示：

- **GitHub Pages 不合适**：官方建议仓库（含产物）< 1 GB，本项目产物 1.4 GB。
- **自有 nginx / 对象存储 + CDN 最直接**（产物量大、国内访问百度/天地图示例也在此线路）。
- Netlify / Cloudflare Pages 可用（Cloudflare 单站 2 万文件上限，14813 个满足），
  但每次全量上传 1.4 GB 偏重，适合试运行、不适合日常发布节奏。

---

## 3. nginx 参考配置

```nginx
server {
    listen 443 ssl;
    server_name your.domain;          # 证书配置略
    root /var/www/earth-app;          # dist/ 整目录
    index index.html;

    # 直接服务构建期生成的预压缩文件，省去动态压缩 CPU
    #（.gz 全平台可用；.gz/.br 仅覆盖 ≥10KB 的 assets，其余文件仍走动态 gzip）
    gzip_static on;
    # brotli_static on;               # 需 ngx_brotli 模块

    # 带哈希的构建产物：永久缓存
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # SPA 回退（history 路由深链接刷新的关键）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

`example-thumbs/`、`data/` 等 public 资源可按需加「较长但非 immutable」的缓存
（封面可被截图流水线重新生成，不宜 immutable）。

---

## 4. 凭据与构建环境

- `VITE_BMAP_AK` / `VITE_TDT_TOKEN` 是**构建期注入**（见 `KNOWN_PITFALLS.md` C9）：
  只写在构建机的 `.env.local`。**不带它们构建出的产物完全可用**——
  `/bmap` 与相关 Cesium 示例优雅降级（E2E 的 `CI: true` 模式已覆盖该形态并断言通过）。
- 这两个值本质是**前端可见的客户端凭据**（会出现在部署后的 `index.html` 里）。
  公网部署前必须在百度/天地图控制台配置**域名 / Referer 白名单**，
  并配合 ROADMAP P0「轮换已泄露的凭据」一起做。
- `npm run check:secrets` 只保证仓库内无明文；部署机的 `.env.local` 同样不入库。

---

## 5. 发布前校验

```bash
# 本机构建受批量删除保护限制（KNOWN_PITFALLS C8），输出到仓库外：
npx vite build --outDir /tmp/earth-build-verify --emptyOutDir true

# 用真实产物跑冒烟（与线上形态一致）：
E2E_TARGET=preview E2E_PREVIEW_OUT_DIR=/tmp/earth-build-verify npm run test:e2e
```

CI 全绿后再取 CI 构建产物（或以相同 commit 重新构建）发布。

---

## 6. 后续可选（本轮未做）

- CI 增加 tag 触发的发布 job（前置依赖 P0 远端仓库建立，届时再展开）。
- 首屏 16 张封面出更小的预览图（`docs/PERF_BASELINE.md` 剩余机会）。
