<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { initShaders, getMousePosInWebgl } from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Utils.js'
import Poly from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Poly.js'
const vertexShader = `attribute vec4 a_Position;
    void main(){
        gl_Position=a_Position;
        gl_PointSize=20.0;
    }`

const fragmentShader = `precision mediump float;
    uniform bool u_IsPOINTS;
    void main(){
      if(u_IsPOINTS){
        float dist=distance(gl_PointCoord,vec2(0.5,0.5));
        if(dist<0.5){
          gl_FragColor=vec4(1,1,0,1);
        }else{
          discard;
        }
      }else{
        gl_FragColor=vec4(1,1,0,1);
      }
    }`

async function onReady({ canvas, container, addUpdateCallback, resize }: { canvas: HTMLCanvasElement; container: HTMLElement; addUpdateCallback: (fn: () => void) => void; resize: (w: number, h: number) => void }) {
  
      
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
  
      const gl = canvas.getContext("webgl")!!;
  
      initShaders(gl, vsSource, fsSource);
  
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      const poly = new Poly({
        gl,
        circleDot: true,
        types: ['POINTS', 'LINE_STRIP']
      })
  
      canvas.addEventListener('mousedown', (event) => {
        const { x, y } = getMousePosInWebgl(event, canvas)
        poly.addVertice(x, y)
        gl.clear(gl.COLOR_BUFFER_BIT);
        poly.draw()
      })
}
</script>

<style scoped>
.webgl-example-scene {
      margin: 0;
      overflow: hidden;
    }
</style>
