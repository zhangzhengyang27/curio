<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {initShaders} from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Utils.js'
import Poly from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Poly.js'
const vertexShader = `attribute vec4 a_Position;
      void main(){
          gl_Position=a_Position;
          gl_PointSize=20.0;
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
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      const poly = new Poly({
          gl,
          vertices: [0, 0.2]
      })
      poly.draw(['POINTS'])
  
      setTimeout(() => {
          poly.addVertice(-0.2, -0.1)
          gl.clear(gl.COLOR_BUFFER_BIT);
          poly.draw(['POINTS'])
      }, 1000)
  
      setTimeout(() => {
          gl.clear(gl.COLOR_BUFFER_BIT);
          poly.draw(['POINTS', 'LINE_STRIP'])
      }, 2000)
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }
</style>
