import * as THREE from 'three'
import { Points } from './points'

export class Rain {
  private points: Points

  constructor(scene: THREE.Scene) {
    this.points = new Points(scene, {
      size: 10,
      opacity: 0.4,
      range: 1000,
      count: 800,
      setAnimation(position) {
        position.y -= position.speedY || 0

        if (position.y <= 0) {
          position.y = this.range / 2
        }
      },
      setPosition(position) {
        position.speedY = 20
      },
      url: 'rain.png'
    })
  }

  animation() {
    this.points.animation()
  }

  dispose() {
    this.points.dispose()
  }
}
