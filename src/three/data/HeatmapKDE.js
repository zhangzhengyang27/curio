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

/**
 * 度转弧度
 */
function toRad(deg) {
  return (deg * PI) / 180
}

/**
 * Haversine 球面距离（弧度制，返回弧度）
 * @param {number} lat1 - 纬度（度）
 * @param {number} lon1 - 经度（度）
 * @param {number} lat2 - 纬度（度）
 * @param {number} lon2 - 经度（度）
 * @returns {number} 弧度距离
 */
function _haversineDistance(lat1, lon1, lat2, lon2) {
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

/**
 * 高斯核函数
 * @param {number} x - 输入值
 * @param {number} bandwidth - 带宽 σ
 * @returns {number}
 */
function gaussianKernel(x, bandwidth) {
  return Math.exp(-0.5 * (x / bandwidth) * (x / bandwidth)) / (bandwidth * SQRT_2PI)
}

/**
 * 在球面目标坐标上计算核密度估计
 *
 * @param {Array} dataPoints - [{ lat, lon, weight? }] 散点数据
 * @param {Array} targetCoords - [{ lat, lon }] 目标坐标（通常来自球面几何体顶点）
 * @param {number} bandwidth - 核带宽（度），默认 2
 * @returns {Float32Array} 各目标坐标的密度值
 */
export function computeGeoKde(dataPoints, targetCoords, bandwidth = 2) {
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
function haversineDistanceRad(lat1, lon1, lat2, lon2) {
  const dPhi = lat2 - lat1
  const dLambda = lon2 - lon1

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLambda / 2) * Math.sin(dLambda / 2)

  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
