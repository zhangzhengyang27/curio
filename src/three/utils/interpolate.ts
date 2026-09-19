import { interpolateArray } from 'd3'
import { Vector3 } from 'three'

/**
 * 两组 Vector3 数组之间的平滑插值（移植自 three-globe，MIT License）
 * 用于路径/飞线从起点到终点的动画过渡
 * 自动将较短的数组填充（复用最后一个点），确保等长
 *
 * @returns 插值函数 k => Vector3[]
 *
 * @example
 * const interp = interpolateVectors([v1, v2], [v3, v4, v5])
 * const midPoints = interp(0.5)  // 中间状态的 Vector3 数组
 */
export function interpolateVectors(fromPnts: Vector3[], toPnts: Vector3[]): (k: number) => Vector3[] {
  const extendArr = (arr: number[][], length: number): number[][] => {
    const repeatItem = arr[arr.length - 1]
    return [...arr, ...new Array<number[]>(length - arr.length).fill(repeatItem)]
  }

  const arrLength = Math.max(fromPnts.length, toPnts.length)
  const toXYZ = (pnts: Vector3[]): number[][] => pnts.map(({ x, y, z }) => [x, y, z])

  const interpolator = interpolateArray(extendArr(toXYZ(fromPnts), arrLength), extendArr(toXYZ(toPnts), arrLength))

  return k =>
    k === 0
      ? fromPnts
      : k === 1
        ? toPnts
        : (interpolator(k) as number[][]).map(([x, y, z]) => new Vector3(x, y, z))
}
