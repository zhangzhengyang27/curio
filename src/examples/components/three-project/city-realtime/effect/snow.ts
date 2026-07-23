import * as THREE from 'three'
import { Points } from './points'

export class Snow {
  private points: Points

  constructor(scene: THREE.Scene) {
    this.points = new Points(scene, {
      size: 30,
      opacity: 0.8,
      range: 1000,
      count: 600,
      setAnimation(position) {
        position.x -= position.speedX || 0
        position.y -= position.speedY || 0
        position.z -= position.speedZ || 0

        if (position.y <= 0) {
          position.y = this.range / 2
        }
      },
      setPosition(position) {
        position.speedX = Math.random() - 0.5
        position.speedY = Math.random() + 4
        position.speedZ = Math.random() - 0.5
      },
      url: 'snow.png'
    })
  }

  animation() {
    this.points.animation()
  }

  dispose() {
    this.points.dispose()
  }
}
