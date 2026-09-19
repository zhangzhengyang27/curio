<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { initShaders } from '@/examples/jsm-compat/webgl/kaikeba-webgl/02-js与着色器间的数据传输/jsm/Utils.js'
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
  
      // 存储顶点数据的数组
      const a_points = [
        { x: -0.3, y: 0 },
        { x: 0.3, y: 0 },
      ];
  
      render();
  
      setTimeout(() => {
        a_points.push({ x: 0, y: 0 });
        render();
      }, 1000);
  
      // 渲染方法
      function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        a_points.forEach(({ x, y }) => {
          gl.vertexAttrib2f(a_Position, x, y);
          gl.drawArrays(gl.POINTS, 0, 1);
        });
      }
}
</script>

<style scoped>
.webgl-example-scene {
      margin: 0;
      overflow: hidden;
    }
</style>
