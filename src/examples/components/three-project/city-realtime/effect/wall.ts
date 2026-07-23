import * as THREE from 'three'
import { color } from '../config'
import { Cylinder } from './cylinder'

export class Wall {
  constructor(scene: THREE.Scene, time: { value: number }) {
    const config = {
      radius: 50,
      height: 50,
      open: true,
      color: color.wall,
      opacity: 0.6,
      position: { x: 0, y: 0, z: 0 },
      speed: 1.0
    }

    new Cylinder(scene, time).createCylinder(config)
  }
}
