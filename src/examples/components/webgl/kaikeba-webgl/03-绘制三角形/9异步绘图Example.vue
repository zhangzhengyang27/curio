<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {initShaders} from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Utils.js'
const vertexShader = `attribute vec4 a_Position;
      void main(){
          gl_Position=a_Position;
          gl_PointSize=20.0;
      }`

const fragmentShader = `void main(){
          gl_FragColor=vec4(1,1,0,1);
      }`

async function onReady({ canvas, container, addUpdateCallback, resize }: { canvas: HTMLCanvasElement; container: HTMLElement; addUpdateCallback: (fn: () => void) => void; resize: (w: number, h: number) => void }) {
  
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
  
      const gl = canvas.getContext("webgl")!!;
  
      initShaders(gl, vsSource, fsSource);
  
      // 顶点数据
      let vertices = [0, 0.2]
      // 缓冲对象
      const vertexBuffer = gl.createBuffer();
      // 绑定缓冲对象
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      // 写入数据
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
      // 获取attribute 变量
      const a_Position = gl.getAttribLocation((gl as any).program, 'a_Position')
      // 修改attribute 变量
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0)
      // 赋能-批处理
      gl.enableVertexAttribArray(a_Position)
  
      // 声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
      // 刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
      // 绘制顶点
      gl.drawArrays(gl.POINTS, 0, 1);
  
      setTimeout(() => {
          vertices.push(-0.2, -0.1)
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.POINTS, 0, 2);
      }, 1000)
  
      setTimeout(() => {
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.POINTS, 0, 2);
          gl.drawArrays(gl.LINE_STRIP, 0, 2);
      }, 2000)
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }
</style>
