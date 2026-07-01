import { interpolateArray } from 'd3-interpolate'
import { Vector3 } from 'three'

/**
 * 两组 Vector3 数组之间的平滑插值（移植自 three-globe，MIT License）
 * 用于路径/飞线从起点到终点的动画过渡
 * 自动将较短的数组填充（复用最后一个点），确保等长
 *
 * @param {THREE.Vector3[]} fromPnts 起始点数组
 * @param {THREE.Vector3[]} toPnts 目标点数组
 * @returns {function(number): THREE.Vector3[]} 插值函数 k => Vector3[]
 *
 * @example
 * const interp = interpolateVectors([v1, v2], [v3, v4, v5])
 * const midPoints = interp(0.5)  // 中间状态的 Vector3 数组
 */
export function interpolateVectors(fromPnts, toPnts) {
  const extendArr = (arr, length) => {
    const repeatItem = arr[arr.length - 1]
    return [...arr, ...Array(length - arr.length).fill(repeatItem)]
  }

  const arrLength = Math.max(fromPnts.length, toPnts.length)

  const interpolator = interpolateArray(
    ...([fromPnts, toPnts].map(
      pnts => pnts.map(({ x, y, z }) => [x, y, z])
    ).map(
      arr => extendArr(arr, arrLength)
    ))
  )

  return k =>
    k === 0
      ? fromPnts
      : k === 1
        ? toPnts
        : interpolator(k).map(([x, y, z]) => new Vector3(x, y, z))
}
