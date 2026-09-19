/**
 * 球面核密度估计（KDE）计算引擎
 * 移植自 three-globe (MIT License)
 *
 * 在球面上计算高斯核密度估计，输出密度值数组
 * - CPU 实现：Haversine 距离 + 高斯核
 * - 优化：带宽外提前终止 + 权重支持
 */

const PI = Math.PI
const SQRT_2PI = Math.sqrt(2 * PI)

/** KDE 输入点：{ lat, lon, weight? } */
export interface GeoKdePoint {
  lat: number
  lon: number
  weight?: number
}

/**
 * 度转弧度
 */
function toRad(deg: number): number {
  return (deg * PI) / 180
}

/**
 * Haversine 球面距离（角度制入参，返回弧度）
 * （保留旧接口；computeGeoKde 内部使用弧度制优化版）
 */
function _haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const dPhi = toRad(lat2 - lat1)
  const dLambda = toRad(lon2 - lon1)

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(dLambda / 2) * Math.sin(dLambda / 2)

  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
void _haversineDistance

/**
 * 高斯核函数
 * @param x - 输入值
 * @param bandwidth - 带宽 σ
 */
function gaussianKernel(x: number, bandwidth: number): number {
  return Math.exp(-0.5 * (x / bandwidth) * (x / bandwidth)) / (bandwidth * SQRT_2PI)
}

/**
 * 在球面目标坐标上计算核密度估计
 *
 * @param dataPoints - 散点数据
 * @param targetCoords - 目标坐标（通常来自球面几何体顶点）
 * @param bandwidth - 核带宽（度），默认 2
 * @returns 各目标坐标的密度值
 */
export function computeGeoKde(
  dataPoints: GeoKdePoint[] | null | undefined,
  targetCoords: GeoKdePoint[] | null | undefined,
  bandwidth = 2
): Float32Array {
  if (!dataPoints || !dataPoints.length || !targetCoords || !targetCoords.length) {
    return new Float32Array(targetCoords ? targetCoords.length : 0)
  }

  const N = targetCoords.length
  const densities = new Float32Array(N)

  // 预先计算带宽弧度
  const bwRad = toRad(bandwidth)

  // 预先计算核归一化因子
  const kernelNorm = 1 / (bwRad * SQRT_2PI)

  // 优化：将数据点转换为弧度制并缓存
  const pts = dataPoints.map(p => ({
    latRad: toRad(p.lat),
    lonRad: toRad(p.lon),
    weight: p.weight ?? 1
  }))

  for (let i = 0; i < N; i++) {
    const t = targetCoords[i]
    const tLatRad = toRad(t.lat)
    const tLonRad = toRad(t.lon)

    let sum = 0

    for (let j = 0; j < pts.length; j++) {
      const p = pts[j]
      const d = haversineDistanceRad(tLatRad, tLonRad, p.latRad, p.lonRad)

      // 提前终止：距离超过 4 倍带宽时贡献可忽略
      if (d > bwRad * 4) continue

      const kernel = gaussianKernel(d, bwRad) * kernelNorm
      sum += kernel * p.weight
    }

    densities[i] = sum
  }

  return densities
}

/**
 * 基于弧度制坐标计算 Haversine 距离（优化版，避免重复转换）
 */
function haversineDistanceRad(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dPhi = lat2 - lat1
  const dLambda = lon2 - lon1

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLambda / 2) * Math.sin(dLambda / 2)

  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
