<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { initShaders, getMousePosInWebgl, ScaleLinear } from '@/examples/jsm-compat/webgl/kaikeba-webgl/05-复合变换/jsm/Utils.js'
import { Matrix4, Vector3, Quaternion, Plane, Ray } from 'three'
import Poly from '@/examples/jsm-compat/webgl/kaikeba-webgl/05-复合变换/jsm/Poly.js'
const vertexShader = `attribute vec4 a_Position;
    uniform mat4 u_ViewMatrix;
    void main(){
      gl_Position = u_ViewMatrix*a_Position;
      gl_PointSize=3.0;
    }`

const fragmentShader = `void main(){
      gl_FragColor=vec4(1.0,1.0,1.0,1.0);
    }`

async function onReady({ canvas, container, addUpdateCallback, resize }: { canvas: HTMLCanvasElement; container: HTMLElement; addUpdateCallback: (fn: () => void) => void; resize: (w: number, h: number) => void }) {
  
      
      
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const gl = canvas.getContext("webgl")!!!;
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
      initShaders(gl, vsSource, fsSource);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  
      /* 视图矩阵 */
      const viewMatrix = new Matrix4().lookAt(
        new Vector3(0.2, 0.3, 1),
        new Vector3(),
        new Vector3(0, 1, 0)
      )
  
      /* x,z 方向的空间坐标极值 */
      const [minPosX, maxPosX, minPosZ, maxPosZ] = [
        -0.7, 0.8, -1, 1
      ]
      /* 波浪对象 */
      const wave = new Poly({
        gl,
        vertices: crtVertices(),
        uniforms: {
          u_ViewMatrix: {
            type: 'uniformMatrix4fv',
            value: viewMatrix.elements
          },
        }
      })
  
      /* 渲染 */
      gl.clear(gl.COLOR_BUFFER_BIT)
      wave.draw()
  
      /* 建立顶点集合 */
      function crtVertices(offset = 0) {
        const vertices: any[] = []
        for (let z = minPosZ; z < maxPosZ; z += 0.04) {
          for (let x = minPosX; x < maxPosX; x += 0.03) {
            vertices.push(x, 0, z)
          }
        }
        return vertices
      }
}
</script>

<style scoped>
.webgl-example-scene {
      margin: 0;
      overflow: hidden
    }
</style>
