<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { initShaders, parseColorStops } from '@/examples/jsm-compat/webgl/kaikeba-webgl/08-GlSl ES语言/jsm/Utils.js'
import Poly from '@/examples/jsm-compat/webgl/kaikeba-webgl/08-GlSl ES语言/jsm/Poly.js'
const vertexShader = `attribute vec4 a_Position;
    attribute vec2 a_Pin;
    varying vec2 v_Pin;
    void main(){
      gl_Position=a_Position;
      v_Pin=a_Pin;
    }`

const fragmentShader = `precision mediump float;
    uniform vec2 u_CanvasSize;
    uniform sampler2D u_Sampler;
    varying vec2 v_Pin;
    vec2 center=u_CanvasSize/2.0;
    float diagLen=length(center);
    float pi2=radians(360.0);
    
    float getAngle(vec2 v){
      float ang=atan(v.y,v.x);
      if(ang<0.0){
          ang+=pi2;
      }
      return ang;
    }

    void main(){
      vec2 p=gl_FragCoord.xy-center;
      float ang=getAngle(p);
      float x=ang/pi2;
      float len=length(p);
      float y=len/diagLen;
      vec4 color=texture2D(u_Sampler,vec2(x,y));
      if(p.x>0.0&&abs(p.y)<1.5){
        color=texture2D(u_Sampler,vec2(0,y));
      }
      gl_FragColor=color;
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
        -1, 1, 0, 1,
        -1, -1, 0, 0,
        1, 1, 1, 1,
        1, -1, 1, 0
      ]);
  
      const rect = new Poly({
        gl,
        source,
        type: 'TRIANGLE_STRIP',
        attributes: {
          a_Position: {
            size: 2,
            index: 0
          },
          a_Pin: {
            size: 2,
            index: 2
          },
        },
        uniforms: {
          u_CanvasSize: {
            type: 'uniform2fv',
            value: [canvas.width, canvas.height]
          }
        }
      })
  
      const image = new Image()
      image.src = '/webgl/kaikeba-webgl/08-GlSl ES语言/images/room.jpg'
      image.onload = function () {
        rect.maps = {
          u_Sampler: { image },
        }
        rect.updateMaps()
        render()
      }
  
      //渲染
      function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        rect.draw()
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
