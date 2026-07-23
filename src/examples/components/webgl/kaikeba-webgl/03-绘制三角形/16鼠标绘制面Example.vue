<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {initShaders, getMousePosInWebgl} from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Utils.js'
import Poly from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Poly.js'
import ShapeGeo from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/ShapeGeo.js'
const vertexShader = `attribute vec4 a_Position;
      void main(){
          gl_Position=a_Position;
          gl_PointSize=5.0;
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
  
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      const poly = new Poly({
          gl,
          types: ['POINTS', 'LINE_STRIP']
      })
  
      const shapeGeo = new ShapeGeo()
      const face = new Poly({
          gl,
          types: ['TRIANGLES', 'POINTS'],
      });
  
      const arr = []
      canvas.addEventListener('mousedown', (event) => {
          const {x, y} = getMousePosInWebgl(event, canvas)
          arr.push(x, y)
  
  
          face.vertices = new ShapeGeo(arr).vertices
          face.updateBuffer()
          gl.clear(gl.COLOR_BUFFER_BIT);
          face.draw()
      })
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }
</style>
