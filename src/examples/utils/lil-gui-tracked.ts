/**
 * lil-gui 自动追踪包装层
 *
 * 通过 Vite resolve.alias 将 'lil-gui' 重定向到此模块，
 * 所有 `new GUI()` 创建的实例会被自动注册到 guiTracker，
 * 在 ExampleHost 卸载时统一调用 destroy() 正确清理。
 *
 * 注意：这里必须通过 `lil-gui/original-internal` 这个内部标识符引入原始实现，
 * 而不是直接写 `../../../node_modules/lil-gui/dist/lil-gui.esm.js`。
 * 后者硬编码了 node_modules 的物理布局（pnpm 的符号链接布局、包内 dist 目录改名、
 * 包管理器 store 位置变化都会导致构建失败）。真实入口路径由 vite.config.js
 * 在配置加载时通过 Node 的 `import.meta.resolve('lil-gui')` 解析后注入别名。
 */
import { GUI as OriginalGUI } from 'lil-gui/original-internal'
import { trackGUI } from './guiTracker'

export class GUI extends OriginalGUI {
  constructor(options?: Record<string, any>) {
    super(options)
    trackGUI(this)
  }
}

export default GUI
