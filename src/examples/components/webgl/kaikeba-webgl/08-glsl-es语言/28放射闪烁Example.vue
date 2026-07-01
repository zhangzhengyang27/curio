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
    uniform float u_Stamp;

    vec2 center=u_CanvasSize/2.0;
    float pi2=radians(360.0);

    float rand(vec2 fragCoord){
      vec2 a= vec2(0.1234,0.5678);
      float n= dot(fragCoord,a);
      return fract(sin(n)*10000.0);
    }
    

    void main(){
      vec2 p=gl_FragCoord.xy-center;
      float ang=atan(p.y,p.x);
      float x=ang*16.0;
      vec2 v=vec2(int(x),int(u_Stamp));

      float f = rand(v);
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
          },
          u_Stamp: {
            type: 'uniform1f',
            value: 0
          }
        }
      })
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      rect.draw()
  
      //上一次请求动画帧的时间戳
      let lastTime = 0
      //动画的时间间隔
      const timeLen = 100
      ;(function ani(stamp) {
        //lastTime=99
        //stamp=lastTime+16=115
        //115%100=15<99%100
        if (stamp % timeLen < lastTime % timeLen) {
          rect.uniforms.u_Stamp.value = stamp;
          rect.updateUniform();
          gl.clear(gl.COLOR_BUFFER_BIT);
          rect.draw()
        }
        lastTime = stamp
        requestAnimationFrame(ani)
      })()
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
