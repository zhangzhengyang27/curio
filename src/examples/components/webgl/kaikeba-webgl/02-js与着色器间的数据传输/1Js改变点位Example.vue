<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
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

async function onReady({ canvas, container, addUpdateCallback, resize }) {
  
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      // 获取着色器文本
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
  
      //三维画笔
      const gl = canvas.getContext("webgl");
  
      //初始化着色器
      initShaders(gl, vsSource, fsSource);
  
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      // 获取 attribute 变量
      const a_Position = gl.getAttribLocation(gl.program, "a_Position");
  
      //修改attribute 变量
      gl.vertexAttrib1f(a_Position, 0.1);
      // gl.vertexAttrib3f(a_Position, 0, 1, 0);
      // gl.vertexAttrib2f(a_Position, 0.5, 0.5);
  
      //绘制顶点
      gl.drawArrays(gl.POINTS, 0, 1);
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }
</style>
