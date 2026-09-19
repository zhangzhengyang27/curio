/**
 * GUI 实例追踪与自动销毁
 *
 * 问题：示例中大量 `new GUI()` 创建 lil-gui 面板，但多数不保存引用、不在卸载时销毁。
 * ExampleHost 的 DOM 移除只是视觉兜底，不会清理 GUI 内部的 resize 监听器和定时器。
 *
 * 方案：提供 trackGUI() 注册实例，disposeAllGUI() 在宿主卸载时统一销毁。
 * 同时导出 patchGUIConstructor() 用于全局拦截 new GUI() 自动注册（可选）。
 */

const trackedInstances = new Set<any>()

/**
 * 手动注册一个 GUI 实例以便后续统一销毁
 * @param {import('lil-gui').GUI} gui
 * @returns {import('lil-gui').GUI} 原样返回，方便链式使用
 */
export function trackGUI(gui: any) {
  if (gui) trackedInstances.add(gui)
  return gui
}

/**
 * 销毁所有被追踪的 GUI 实例并清空注册表。
 * 在 ExampleHost / ExampleScene 卸载时调用。
 */
export function disposeAllGUI() {
  trackedInstances.forEach((gui) => {
    try {
      gui.destroy()
    } catch {
      // GUI 可能已被手动销毁或 DOM 已移除
      try {
        if (gui.domElement && gui.domElement.parentNode) {
          gui.domElement.parentNode.removeChild(gui.domElement)
        }
      } catch { /* ignore */ }
    }
  })
  trackedInstances.clear()
}

/**
 * 获取当前被追踪的 GUI 实例数量（调试用）
 */
export function getTrackedGUICount() {
  return trackedInstances.size
}
