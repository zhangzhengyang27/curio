<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
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

async function onReady({ canvas, container, addUpdateCallback, resize }) {
  
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
  
      const gl = canvas.getContext("webgl");
  
      initShaders(gl, vsSource, fsSource);
  
      //设置attribute 变量
      const a_Position = gl.getAttribLocation(gl.program, "a_Position");
  
      const a_points = [{ x: 0, y: 0 }];
  
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      render();
  
      // 鼠标点击事件
      canvas.addEventListener("click", ({ clientX, clientY }) => {
        console.log(clientX, clientY);
        const { left, top, width, height } = canvas.getBoundingClientRect();
        const [cssX, cssY] = [clientX - left, clientY - top];
  
        //解决坐标原点位置的差异
        const [halfWidth, halfHeight] = [width / 2, height / 2];
        const [xBaseCenter, yBaseCenter] = [
          cssX - halfWidth,
          cssY - halfHeight,
        ];
        // 解决y 方向的差异
        const yBaseCenterTop = -yBaseCenter;
        //解决坐标基底的差异
        const [x, y] = [xBaseCenter / halfWidth, yBaseCenterTop / halfHeight];
  
        a_points.push({ x, y });
        render();
      });
  
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
