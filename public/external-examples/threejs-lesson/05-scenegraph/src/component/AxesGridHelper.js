import { AxesHelper, GridHelper } from 'three'

export default class AxesGridHelper {
  constructor(obj, size = 2) {
    const axes = new AxesHelper()
    axes.material.depthTest = false
    obj.add(axes)

    const grid = new GridHelper(size)
    grid.material.depthTest = false
    obj.add(grid)

    this.grid = grid
    this.axes = axes
    this._visible = true
    this.visible = this._visible
  }
  get visible() {
    return this._visible
  }
  set visible(v) {
    this._visible = v
    this.grid.visible = v
    this.axes.visible = v
  }
}
