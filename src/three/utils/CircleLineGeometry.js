import { BufferGeometry } from 'three'

/**
 * 圆形线段几何体（移植自 three-globe，MIT License）
 * 替代 THREE.RingGeometry 用于需要线段表示的圆环
 * 起点旋转 -90 度，使顶点从右侧 (1,0,0) 开始
 */
export class CircleLineGeometry extends BufferGeometry {
  /**
   * @param {number} [radius=1] 圆半径
   * @param {number} [segmentCount=32] 线段分段数
   */
  constructor(radius = 1, segmentCount = 32) {
    super()

    this.type = 'CircleLineGeometry'
    this.parameters = { radius, segmentCount }

    const points = []
    for (let i = 0; i <= segmentCount; i++) {
      const theta = (i / segmentCount - 0.25) * Math.PI * 2
      points.push({
        x: Math.cos(theta) * radius,
        y: Math.sin(theta) * radius,
        z: 0
      })
    }
    this.setFromPoints(points)
  }
}
