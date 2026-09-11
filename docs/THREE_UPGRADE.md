# three.js 本地兼容层与升级指引

> 本文原先放在仓库根 `README.md`，导致仓库首页完全没有项目介绍。
> 现已迁到 `docs/`，根 `README.md` 恢复为项目说明。

## 这是什么

项目依赖的 npm `three` 稳定版为 `0.185.0`，但 Three.js 官方示例仓库（`three.js-dev`）已经推进到 `r186dev`，并新增了 `MeshBasicNodeMaterial`、`MeshPhongNodeMaterial`、`CanvasTarget` 等 WebGPU 相关 API。

为了兼容这些新示例，项目没有等待 npm 发布新版，而是采用了**本地 build 兼容方案**：

1. 将 `three.js-dev/build/` 下的最新 build 文件复制到 `src/examples/three-build-compat/`：
   - `three.core.js`
   - `three.module.js`
   - `three.webgpu.js`
   - `three.webgpu.nodes.js`
   - `three.tsl.js`

2. 在 `vite.config.js` 中注册 `threeCompatResolver` 插件，将以下模块解析到上述本地文件：
   - `three` → `src/examples/three-build-compat/three.module.js`
   - `three/webgpu` → `src/examples/three-build-compat/three.webgpu.js`
   - `three/tsl` → `src/examples/three-build-compat/three.tsl.js`

3. 在 `optimizeDeps.exclude` 中排除 `three`、`three/webgpu`、`three/tsl`，避免 Vite 预构建冲突。

4. 转换脚本 `scripts/legacy/convert-threejs-official-to-vue.js` 会把 WebGPU 示例中的 `import ... from 'three'` 重写成 `import ... from 'three/webgpu'`，因为当前 WebGPU build 和核心 build 是分开的。

## 当前基线

由 `node scripts/verify-three-compat.mjs` 校验，基线记录在
`src/examples/three-build-compat/compat-manifest.json`：

- 上游版本（`REVISION`）：`186dev`（**预发布**，不是 npm 稳定版）
- 文件与哈希：见 manifest

CI 会执行该校验：一旦兼容层文件被改动而基线未同步，构建直接失败，避免「示例静默白屏」这类无报错的漂移。

若有**有意升级**兼容层，请在验证相关示例后执行：

```bash
node scripts/verify-three-compat.mjs --update
```

## 风险与退出条件

这是一份脱离 npm 官方发布渠道、带预发布标记的构建产物，属于**临时技术债**，必须设定退出条件：

| 项目 | 说明 |
|---|---|
| Owner | 需要明确指定一名负责人（当前为空缺，见 `docs/ROADMAP.md`） |
| 触发条件 | npm `three` 发布包含上述 API 的稳定版（例如 `0.186.0` 或更高） |
| 检查节奏 | 每次 `three` 升级依赖时顺带评估一次 |
| 退出动作 | 按下方「切回 npm 包」步骤执行，并删除兼容层目录与相关插件 |

## 当 npm 最新稳定版升级后

1. **更新 `package.json`**：将 `three` 的依赖版本改为目标版本，例如：

   ```json
   "three": "^0.186.0"
   ```

2. **重新安装依赖**

   ```bash
   npm install --legacy-peer-deps
   ```

3. **移除 Vite 兼容插件**。编辑 `vite.config.js`：
   - 删除 `threeCompatResolver()` 插件；
   - 删除 `optimizeDeps.exclude` 中的 `three`、`three/webgpu`、`three/tsl`；
   - 如果还需要手动指定 `three/examples/jsm` 路径，保留对应 alias，否则一并删除。

   修改后大概如下：

   ```js
   export default defineConfig({
     plugins: [vue()],
     resolve: {
       alias: {
         '@': fileURLToPath(new URL('./src', import.meta.url)),
       }
     },
     optimizeDeps: {
       include: ['three-globe'],
       exclude: ['satellite.js'],
     }
   })
   ```

4. **清理本地兼容文件（可选）**

   ```bash
   rm -rf src/examples/three-build-compat
   ```

   同时删除兼容层守卫脚本与 npm 脚本 `verify:three-compat`
   （`package.json`、`.github/workflows/ci.yml`、`scripts/verify-three-compat.mjs`）。

5. **调整转换脚本（可选）**：如果未来 `three` 核心包已经直接导出 `MeshBasicNodeMaterial` 等节点材质，可以去掉 `scripts/legacy/convert-threejs-official-to-vue.js` 中针对 WebGPU 示例的 `from 'three'` → `from 'three/webgpu'` 重写逻辑。

6. **验证构建**

   ```bash
   rm -rf node_modules/.vite
   npm run build
   ```

7. **运行开发服务器抽查示例**

   ```bash
   npm run dev
   ```

   重点检查 WebGPU、WebXR、CSS3D、SVG 等类别的示例是否能正常渲染，控制台是否有 `IMPORT_IS_UNDEFINED` 或 `UNRESOLVED_IMPORT` 错误。

8. **回归**：执行 `npm run verify` 与 `npm run test:e2e`，确认闸门全绿。

## 注意事项

- 在切回 npm 包之前，请确保 `node_modules/three/build/` 和 `node_modules/three/examples/jsm/` 中的文件版本与官方示例仓库一致，否则可能出现 API 缺失或路径不兼容的问题。
- 如果项目中还使用了 `src/examples/jsm-compat/` 作为 `three/examples/jsm` 的本地替代，升级时也应同步更新或移除该目录。
