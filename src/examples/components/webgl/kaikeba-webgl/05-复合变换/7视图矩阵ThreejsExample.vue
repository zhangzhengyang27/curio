<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {initShaders} from '@/examples/jsm-compat/webgl/kaikeba-webgl/05-复合变换/jsm/Utils.js'
import {Matrix4, Vector3, Quaternion} from 'three'
const vertexShader = `attribute vec4 a_Position;
    uniform mat4 u_ViewMatrix;
    void main(){
      gl_Position = u_ViewMatrix*a_Position;
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
  
  
      const verticeLib = [
          1.0, 1.0, 1.0,
          -1.0, 1.0, 1.0,
          -1.0, -1.0, 1.0,
          1.0, -1.0, 1.0,
          1.0, -1.0, -1.0,
          1.0, 1.0, -1.0,
          -1.0, 1.0, -1.0,
          -1.0, -1.0, -1.0,
      ];
  
      const indices = [
          0, 1,
          1, 2,
          2, 3,
          3, 0,
  
          0, 5,
          1, 6,
          2, 7,
          3, 4,
  
          4, 5,
          5, 6,
          6, 7,
          7, 4
      ];
  
      const arr: any[] = [];
      indices.forEach(n => {
          const i = n * 3
          arr.push(
              verticeLib[i] / 5,
              verticeLib[i + 1] / 5,
              verticeLib[i + 2] / 5,
          )
      })
      const vertices = new Float32Array(arr)
  
      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      const a_Position = gl.getAttribLocation((gl as any).program, 'a_Position');
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
  
      const u_ViewMatrix = gl.getUniformLocation((gl as any).program, 'u_ViewMatrix')
      const matrix = new Matrix4().lookAt(
          new Vector3(0.2, 0.2, 1),
          new Vector3(0, 0, 0),
          new Vector3(0, 1, 0)
      )
      gl.uniformMatrix4fv(u_ViewMatrix, false, matrix.elements)
  
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.LINES, 0, indices.length);
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden
        }
</style>
