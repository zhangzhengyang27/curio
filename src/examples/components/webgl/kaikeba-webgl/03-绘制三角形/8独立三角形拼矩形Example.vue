<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {initShaders} from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Utils.js'
const vertexShader = `attribute vec4 a_Position;
      void main(){
          //点位
          gl_Position=a_Position;
          //尺寸
          //gl_PointSize=50.0;
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
  
      //如何向attribute 变量中写入多点，并绘制多点
      //顶点数据
      const vertices = new Float32Array([
          -0.2, 0.2,
          -0.2, -0.2,
          0.2, 0.2,
  
          0.2, 0.2,
          -0.2, -0.2,
          0.2, -0.2
  
      ]);
      //缓冲对象
      const vertexBuffer = gl.createBuffer();
      //绑定缓冲对象
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      //写入数据
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
      //获取attribute 变量
      const a_Position = gl.getAttribLocation(gl.program, 'a_Position')
      //修改attribute 变量
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0)
      //赋能-批处理
      gl.enableVertexAttribArray(a_Position)
  
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      //绘制顶点
      gl.drawArrays(gl.TRIANGLES, 0, 6);
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }

        .webgl-example-canvas {
            background-color: antiquewhite;
        }
</style>
