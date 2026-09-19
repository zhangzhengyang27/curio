<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { initShaders } from '@/examples/jsm-compat/webgl/kaikeba-webgl/08-GlSl ES语言/jsm/Utils.js'
import Poly from '@/examples/jsm-compat/webgl/kaikeba-webgl/08-GlSl ES语言/jsm/Poly.js'
const vertexShader = `attribute vec4 a_Position;
    void main(){
      gl_Position=a_Position;
    }`

const fragmentShader = `precision mediump float;
    uniform vec2 u_CanvasSize;
    float halfW=u_CanvasSize.x/2.0;
    float halfH=u_CanvasSize.y/2.0;
    void main(){
      mat4 m=mat4(
        255,0,0,255,
        255,255,0,255,
        0,255,0,255,
        0,0,255,255
      );
      bool xb= gl_FragCoord.x<halfW;
      bool yb= gl_FragCoord.y<halfH;
      if(yb){
        if(xb){
          gl_FragColor=m[0]/255.0;
        }else{
          gl_FragColor=m[1]/255.0;
        }
      }else{
        if(xb){
          gl_FragColor=m[2]/255.0;
        }else{
          gl_FragColor=m[3]/255.0;
        }
      }
    }`

async function onReady({ canvas, container, addUpdateCallback, resize }: { canvas: HTMLCanvasElement; container: HTMLElement; addUpdateCallback: (fn: () => void) => void; resize: (w: number, h: number) => void }) {
  
      console.log(window.devicePixelRatio);
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      // 获取着色器文本
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
  
      //三维画笔
      const gl = canvas.getContext("webgl")!!;
  
      //初始化着色器
      initShaders(gl, vsSource, fsSource);
  
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
  
      const source = new Float32Array([
        -1, 1,
        -1, -1,
        1, 1,
        1, -1
      ]);
  
      const rect = new Poly({
        gl,
        source,
        type: 'TRIANGLE_STRIP',
        attributes: {
          a_Position: {
            size: 2,
            index: 0
          }
        },
        uniforms: {
          u_CanvasSize: {
            type: 'uniform2fv',
            value: [canvas.width, canvas.height]
          }
        }
      })
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      rect.draw()
  
      const [w, h] = [2, 2]
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          const px = canvas.width * (x + 0.5) / w
          const py = canvas.height * (y + 0.5) / h
          logPixel(px, py)
        }
      }
      function logPixel(x: number, y: number) {
        const pixel = new Uint8Array(4)
        gl.readPixels(
          x, y,
          1, 1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixel
        )
        console.log(pixel)
      }
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
