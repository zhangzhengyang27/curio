/**
 * mapbox/delaunator 的最小类型声明。
 *
 * 该库以 vendored 副本形式存在于 src/three/geo/delaunator.js
 * （见 docs/TS_MIGRATION.md §1.2「外部代码不迁移」），只声明本仓实际用到的 API。
 */
export default class Delaunator {
  /** 三角形顶点索引扁平数组（每 3 个一组） */
  triangles: Uint32Array
  halfedges: Int32Array
  hull: Uint32Array
  coords: Float64Array

  constructor(coords: ArrayLike<number>)

  static from(
    points: ArrayLike<ArrayLike<number>>,
    getX?: (point: ArrayLike<number>) => number,
    getY?: (point: ArrayLike<number>) => number
  ): Delaunator
}
