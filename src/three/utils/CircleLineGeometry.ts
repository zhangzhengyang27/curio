import { BufferGeometry, Vector3 } from 'three'

/**
 * 圆形线段几何体（移植自 three-globe，MIT License）
 * 替代 THREE.RingGeometry 用于需要线段表示的圆环
 * 起点旋转 -90 度，使顶点从右侧 (1,0,0) 开始
 */
export class CircleLineGeometry extends BufferGeometry {
  /**
   * @param radius 圆半径
   * @param segmentCount 线段分段数
   */
  constructor(radius = 1, segmentCount = 32) {
    super()

    // three 0.185 将 type 声明为只读，子类定制类型名需绕过
    ;(this as unknown as { type: string }).type = 'CircleLineGeometry'
    ;(this as unknown as { parameters: { radius: number; segmentCount: number } }).parameters = { radius, segmentCount }

    const points: Vector3[] = []
    for (let i = 0; i <= segmentCount; i++) {
      const theta = (i / segmentCount - 0.25) * Math.PI * 2
      points.push(new Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0))
    }
    this.setFromPoints(points)
  }
}
