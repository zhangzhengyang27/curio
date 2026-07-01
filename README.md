# Three.js 版本升级说明

## 当前状态

当前项目依赖的 npm `three` 稳定版为 `0.185.0`，但 Three.js 官方示例仓库（`three.js-dev`）已经推进到 `r186dev`，并新增了 `MeshBasicNodeMaterial`、`MeshPhongNodeMaterial`、`CanvasTarget` 等 WebGPU 相关 API。

为了兼容这些新示例，项目没有等待 npm 发布新版，而是采用了本地 build 兼容方案：

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

4. 转换脚本 `scripts/convert-threejs-official-to-vue.js` 会把 WebGPU 示例中的 `import ... from 'three'` 重写成 `import ... from 'three/webgpu'`，因为当前 WebGPU build 和核心 build 是分开的。

## 当 npm 最新稳定版升级后

一旦 npm 上的 `three` 发布了包含上述 API 的稳定版（例如 `0.186.0` 或更高），建议按以下步骤切回 npm 包：

1. **更新 `package.json`**
   将 `three` 的依赖版本改为目标版本，例如：
   ```json
   "three": "^0.186.0"
   ```

2. **重新安装依赖**
   ```bash
   npm install
   ```

3. **移除 Vite 兼容插件**
   编辑 `vite.config.js`：
   - 删除 `threeCompatResolver()` 插件；
   - 删除 `optimizeDeps.exclude` 中的 `three`、`three/webgpu`、`three/tsl`；
   - 如果不需要再手动指定 `three/examples/jsm` 路径，也可以删除对应的 alias。

   修改后大概如下：
   ```js
   export default defineConfig({
     plugins: [vue()],
     resolve: {
       alias: {
         '@': fileURLToPath(new URL('./src', import.meta.url)),
         // 'three/examples/jsm': fileURLToPath(new URL('./src/examples/jsm-compat', import.meta.url))
       }
     },
     // ...
     optimizeDeps: {
       include: ['three-globe'],
       exclude: ['satellite.js'],
     }
   })
   ```

4. **清理本地兼容文件（可选）**
   如果确认 npm 版本已完全覆盖需求，可以删除：
   ```bash
   rm -rf src/examples/three-build-compat
   ```

5. **调整转换脚本（可选）**
   如果未来 `three` 核心包已经直接导出 `MeshBasicNodeMaterial` 等节点材质，可以去掉 `scripts/convert-threejs-official-to-vue.js` 中针对 WebGPU 示例的 `from 'three'` → `from 'three/webgpu'` 重写逻辑。

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

## 注意事项

- 在切回 npm 包之前，请确保 `node_modules/three/build/` 和 `node_modules/three/examples/jsm/` 中的文件版本与官方示例仓库一致，否则可能出现 API 缺失或路径不兼容的问题。
- 如果项目中还使用了 `src/examples/jsm-compat/` 作为 `three/examples/jsm` 的本地替代，升级时也应同步更新或移除该目录。
