<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { initShaders } from '@/examples/jsm-compat/webgl/kaikeba-webgl/08-GlSl ES语言/jsm/Utils.js'
const vertexShader = `void main(){
      //点位
      gl_Position=vec4(0,0,0,1);
      //尺寸
      gl_PointSize=512.0;
    }`

const fragmentShader = `precision mediump float;
    //vec4 v=vec4(1,2,3,4)+vec4(5,6,7,8);
    void main(){
      /*
      vec4 v=vec4(1,2,3,4);
      v+=2.0;
      v-=2.0;
      v*=2.0;
      v/=2.0;
      */

      /*
      vec4 v=vec4(2,4,6,8);
      vec4 p=vec4(1,2,3,4);
      v+=p;
      v-=p;
      v*=p;
      v/=p;
      */

      /*
      vec4 p1=vec4(1,0,0,0);
      vec4 p2=vec4(5,0,0,0);
      //float d=distance(p1,p2);
      float d=dot(p1,p2);

      vec4 v=vec4(d,0,0,0);
      */

      mat4 m=mat4(
          1,5,9,13,
          2,6,10,14,
          3,7,11,15,
          4,8,12,16
      );
      vec4 p=vec4(1,2,3,4);
      //vec4 v=m*p;
      vec4 v=p*m;

      gl_FragColor=v/255.0;
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
      //功能：解析着色器文本，整合到程序对象里，关联webgl上下文对象，实现两种语言的相互通信
      initShaders(gl, vsSource, fsSource);
  
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      //绘制顶点
      gl.drawArrays(gl.POINTS, 0, 1);
  
      //像素容器
      const pixel = new Uint8Array(4)
      //抓取像素
      gl.readPixels(
        canvas.width / 2, canvas.height / 2,
        1, 1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixel
      )
  
      console.log(pixel);
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
