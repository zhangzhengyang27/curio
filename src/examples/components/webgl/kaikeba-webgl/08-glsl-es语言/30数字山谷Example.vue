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

    float angOffset1=u_Stamp*0.00015;
    float cosAng1=cos(angOffset1);
    float sinAng1=sin(angOffset1);
    mat2 modelMatrix1=mat2(
        cosAng1,sinAng1,
        -sinAng1,cosAng1
    );  

    float angOffset2=u_Stamp*0.0004;
    float cosAng2=cos(angOffset2);
    float sinAng2=sin(angOffset2);
    mat2 modelMatrix2=mat2(
        cosAng2,sinAng1,
        -sinAng2,cosAng2
    );
    
    float rand(vec2 fragCoord){
      vec2 a= vec2(0.1234,0.5678);
      float n= dot(fragCoord,a);
      return fract(sin(n)*10000.0);
    }
    
    float getBright(vec2 pole){
      pole=center+modelMatrix2*(pole-center);
      vec2 p=gl_FragCoord.xy-pole;
      p=modelMatrix1*p;
      float ang=atan(p.y,p.x);
      float x=ang*16.0;
      vec2 v=vec2(int(x),0);
      return rand(v);
    }

    void main(){
      vec2 min=u_CanvasSize*0.25;
      vec2 max=u_CanvasSize*0.75;
      float bright1 = getBright(min);
      float bright2 = getBright(max);
      float bright3 = getBright(vec2(min.x,max.y));
      float bright4 = getBright(vec2(max.x,min.y));

      float f=0.0;
      float sum=bright1+bright2+bright3+bright4;
      if(sum>2.0){
        f=bright1*bright2*bright3*bright4*4.0;
      }else{
        f=sum/2.0;
      }

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
  
      ;(function ani(stamp) {
        rect.uniforms.u_Stamp.value = stamp;
        rect.updateUniform();
        gl.clear(gl.COLOR_BUFFER_BIT);
        rect.draw()
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
