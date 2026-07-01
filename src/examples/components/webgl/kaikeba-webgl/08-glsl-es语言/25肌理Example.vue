<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { initShaders, parseColorStops } from '@/examples/jsm-compat/webgl/kaikeba-webgl/08-GlSl ES语言/jsm/Utils.js'
import Poly from '@/examples/jsm-compat/webgl/kaikeba-webgl/08-GlSl ES语言/jsm/Poly.js'
const vertexShader = `attribute vec4 a_Position;
    void main(){
      gl_Position=a_Position;
    }`

const fragmentShader = `precision mediump float;
    uniform vec2 u_CanvasSize;
    
    /*
    float rand(vec2 fragCoord){
      vec2 a= vec2(0.1234,0.5678);
      float n= dot(fragCoord,a);
      return fract(sin(n)*10000.0);
    }
    */

    /*
    float rand(vec2 fragCoord){
      vec2 a= vec2(0.1234,0.5678);
      float n= dot(fragCoord,a);
      return fract(sin(n)*10.0);
    }
    */

    /*
    float rand(vec2 fragCoord){
      vec2 a= vec2(0.1234,0.5678);
      float n= dot(fragCoord,a);
      return fract(tan(n)*10.0);
    }
    */

    /*
    float rand(vec2 fragCoord){
      vec2 a= vec2(0.1234,0.5678);
      float n= dot(fragCoord,a);
      return fract(tan(n));
    }
    */

    /*
    float rand(vec2 fragCoord){
      vec2 a= vec2(0.111,0.11);
      float n= dot(fragCoord,a);
      return fract(tan(n));
    }
    */

    /*
    float rand(vec2 fragCoord){
      vec2 a= vec2(0.111,0.111);
      float n= dot(fragCoord,a);
      return fract(tan(n));
    }
    */

    float rand(vec2 fragCoord){
      vec2 v=fragCoord-u_CanvasSize/2.0;
      return fract(
          atan(v.x,v.y)*500.0
      );
    }

    void main(){
      float f = rand(gl_FragCoord.xy);
      gl_FragColor = vec4(f, f, f, 1);
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
