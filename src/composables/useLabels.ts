import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

/**
 * CSS2D 标签管理
 * 负责创建/复用 CSS2DRenderer，并提供 HTML 标记辅助方法
 */
export function useLabels() {
  // 创建标签元素（保留的旧接口，用于鼠标悬停主标签）
  const trackedLabels = new Set<CSS2DObject>()

  function createLabelEl(text = ''): { label: CSS2DObject; div: HTMLDivElement } {
    const div = document.createElement('div')
    div.style.visibility = 'hidden'
    div.innerHTML = text
    div.style.padding = '4px 10px'
    div.style.color = '#fff'
    div.style.fontSize = '16px'
    div.style.position = 'absolute'
    div.style.backgroundColor = 'rgba(25,25,25,0.5)'
    div.style.borderRadius = '5px'
    div.style.pointerEvents = 'none'

    const label = new CSS2DObject(div)
    trackedLabels.add(label)
    return { label, div }
  }

  // 创建渲染器
  const labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(window.innerWidth, window.innerHeight)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '-16px'
  labelRenderer.domElement.style.left = '0px'
  labelRenderer.domElement.style.pointerEvents = 'none'

  function showLabel(labelObj: CSS2DObject, position: { x: number; y: number; z: number }, text?: string): void {
    labelObj.position.copy(position)
    if (text !== undefined) {
      labelObj.element.innerHTML = text
    }
    labelObj.element.style.visibility = 'visible'
  }

  function hideLabel(labelObj: CSS2DObject): void {
    labelObj.element.style.visibility = 'hidden'
  }

  /**
   * 尺寸必须与画布容器一致：CSS2DRenderer 用自己的宽高做 NDC→像素换算，
   * 按 window 尺寸构建会让标签投影点与实际命中点错开。
   */
  function resize(width?: number, height?: number): void {
    labelRenderer.setSize(width || window.innerWidth, height || window.innerHeight)
  }

  function dispose(): void {
    trackedLabels.forEach(label => {
      if (label.parent) label.parent.remove(label)
      if (label.element && label.element.parentNode) {
        label.element.parentNode.removeChild(label.element)
      }
    })
    trackedLabels.clear()
    labelRenderer.domElement.remove()
  }

  return {
    labelRenderer,
    createLabelEl,
    showLabel,
    hideLabel,
    dispose,
    resize
  }
}
