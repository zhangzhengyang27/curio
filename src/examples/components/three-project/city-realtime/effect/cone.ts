import * as THREE from 'three'
import { color } from '../config'

export class Cone {
  constructor(scene: THREE.Scene, top: { value: number }, height: { value: number }) {
    this.createCone(scene, top, height, {
      color: color.cone,
      height: 60,
      opacity: 0.6,
      position: { x: 0, y: 50, z: 0 }
    })
  }

  private createCone(
    scene: THREE.Scene,
    top: { value: number },
    height: { value: number },
    options: {
      color: string
      height: number
      opacity: number
      position: { x: number; y: number; z: number }
    }
  ) {
    const geometry = new THREE.ConeGeometry(15, 30, 4)

    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_color: { value: new THREE.Color(options.color) },
        u_height: height,
        u_top: top
      },
      vertexShader: `
        uniform float u_top;
        uniform float u_height;

        void main() {
          float f_angle = u_height / 10.0;
          float new_x = position.x * cos(f_angle) - position.z * sin(f_angle);
          float new_y = position.y;
          float new_z = position.z * cos(f_angle) + position.x * sin(f_angle);
          vec4 v_position = vec4(new_x, new_y + u_top, new_z, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * v_position;
        }
      `,
      fragmentShader: `
        uniform vec3 u_color;
        void main() {
          gl_FragColor = vec4(u_color, 0.6);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(options.position.x, options.position.y, options.position.z)
    mesh.rotateZ(Math.PI)
    scene.add(mesh)
  }
}
