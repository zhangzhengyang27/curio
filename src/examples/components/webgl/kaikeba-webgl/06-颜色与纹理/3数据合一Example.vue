<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {initShaders} from '@/examples/jsm-compat/webgl/kaikeba-webgl/06-颜色与纹理/jsm/Utils.js'
const vertexShader = `attribute vec4 a_Position;
    attribute vec4 a_Color;
    varying vec4 v_Color;
    void main(){
        //点位
        gl_Position=a_Position;
        //尺寸
        gl_PointSize=50.0;
        v_Color=a_Color;
    }`

const fragmentShader = `precision mediump float;
    varying vec4 v_Color;
    void main(){
        gl_FragColor=v_Color;
    }`

async function onReady({ canvas, container, addUpdateCallback, resize }) {
  
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
  
      const gl = canvas.getContext("webgl");
  
      initShaders(gl, vsSource, fsSource);
      gl.clearColor(0, 0, 0, 1);
  
      // 数据源
      const source = new Float32Array([
          0, 0.4, 0, 0, 0, 1, 1,
          -0.2, -0.1, 0, 0, 1, 0, 1,
          0.2, -0.1, 0, 1, 1, 0, 1,
      ]);
      // 元素字节数
      const elementBytes = source.BYTES_PER_ELEMENT
      // 系列尺寸
      const verticeSize = 3
      const colorSize = 4
      // 类目尺寸
      const categorySize = verticeSize + colorSize
      // 类目字节数
      const categoryBytes = categorySize * elementBytes
      // 系列字节索引位置
      const verticeByteIndex = 0;
      const colorByteIndex = verticeSize * elementBytes
      // 顶点总数
      const sourceSize = source.length / categorySize
  
  
      // 缓冲对象
      const sourceBuffer = gl.createBuffer();
      // 绑定缓冲对象
      gl.bindBuffer(gl.ARRAY_BUFFER, sourceBuffer);
      // 写入数据
      gl.bufferData(gl.ARRAY_BUFFER, source, gl.STATIC_DRAW)
  
      // 获取 attribute 变量
      const a_Position = gl.getAttribLocation(gl.program, 'a_Position')
      // 修改attribute 变量
      gl.vertexAttribPointer(
          a_Position,
          verticeSize,
          gl.FLOAT,
          false,
          categoryBytes,
          verticeByteIndex
      )
      // 赋能-批处理
      gl.enableVertexAttribArray(a_Position)
  
      // 获取attribute 变量
      const a_Color = gl.getAttribLocation(gl.program, 'a_Color')
      // 修改attribute 变量
      gl.vertexAttribPointer(
          a_Color,
          colorSize,
          gl.FLOAT,
          false,
          categoryBytes,
          colorByteIndex
      )
      // 赋能-批处理
      gl.enableVertexAttribArray(a_Color)
  
  
      // 刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      // 绘制顶点
      gl.drawArrays(gl.POINTS, 0, sourceSize);
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }
</style>
