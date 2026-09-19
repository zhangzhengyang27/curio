<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {initShaders} from '@/examples/jsm-compat/webgl/kaikeba-webgl/02-js与着色器间的数据传输/jsm/Utils.js'
const vertexShader = `attribute vec4 a_Position;
      void main(){
          //点位
          gl_Position=a_Position;
          //尺寸
          gl_PointSize=50.0;
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
  
      //设置attribute 变量
      const a_Position = gl.getAttribLocation((gl as any).program, "a_Position");
  
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      //修改attribute 变量
      gl.vertexAttrib2f(a_Position, -0.3, 0);
      //绘制顶点
      gl.drawArrays(gl.POINTS, 0, 1);
  
      //修改attribute 变量
      gl.vertexAttrib2f(a_Position, 0.3, 0);
      //绘制顶点
      gl.drawArrays(gl.POINTS, 0, 1);
  
      setTimeout(() => {
          //修改attribute 变量
          gl.vertexAttrib2f(a_Position, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          //绘制顶点
          gl.drawArrays(gl.POINTS, 0, 1);
      }, 1000);
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }
</style>
