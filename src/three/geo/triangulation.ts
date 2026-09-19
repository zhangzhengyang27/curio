import Delaunator from './delaunator.js'
import { pointInPolygon } from './gridPoints'

/**
 * Delaunay 三角剖分
 * @param pointsArr - 点集(包含多边形边界+内部填充点)
 * @param polygon - 多边形轮廓
 * @returns 三角形索引数组
 */
export function delaunay(pointsArr: number[][], polygon: number[][]): number[] {
  const indexArr = Delaunator.from(pointsArr).triangles
  const usefulIndexArr: number[] = []

  for (let i = 0; i < indexArr.length; i += 3) {
    const p1 = pointsArr[indexArr[i]]
    const p2 = pointsArr[indexArr[i + 1]]
    const p3 = pointsArr[indexArr[i + 2]]
    // 三角形重心
    const centroid = [
      (p1[0] + p2[0] + p3[0]) / 3,
      (p1[1] + p2[1] + p3[1]) / 3
    ]
    if (pointInPolygon(centroid, polygon)) {
      // 反转索引顺序确保法线方向正确
      usefulIndexArr.push(indexArr[i + 2], indexArr[i + 1], indexArr[i])
    }
  }
  return usefulIndexArr
}
