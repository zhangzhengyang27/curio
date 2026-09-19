<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { initShaders } from '@/examples/jsm-compat/webgl/kaikeba-webgl/08-GlSl ES语言/jsm/Utils.js'
const vertexShader = `void main(){
      //点位
      gl_Position=vec4(0,0,0,1);
      //尺寸
      gl_PointSize=512.0;
    }`

const fragmentShader = `precision mediump float;
    vec4 v=vec4(1,2,3,4)+vec4(5,6,7,8);
    void main(){
      /*
      mat4 m=mat4(
        1,5,9,13,
        2,6,10,14,
        3,7,11,15,
        4,8,12,16
      );
      m+=1.0;
      m-=1.0;
      m*=2.0;
      m/=2.0;
      */
      mat4 m=mat4(
        2,16,8,8,
        4,8,8,8,
        8,4,8,8,
        16,8,8,8
      );
      mat4 n=mat4(
        1,4,1,2,
        2,4,2,1,
        4,4,1,2,
        8,4,2,1
      );

      /*
      m+=n;
      m-=n;
      m/=n;
      */
      m*=n;

      

      float dist=distance(gl_PointCoord,vec2(0.5,0.5));
      if(dist>=0.0&&dist<0.125){
        gl_FragColor=m[0]/255.0;
      }else if(dist>=0.125&&dist<0.25){
        gl_FragColor=m[1]/255.0;
      }else if(dist>=0.25&&dist<0.375){
        gl_FragColor=m[2]/255.0;
      }else if(dist>=0.375&&dist<0.5){
        gl_FragColor=m[3]/255.0;
      }else{
        discard;
      }
    }`

async function onReady({ canvas, container, addUpdateCallback, resize }: { canvas: HTMLCanvasElement; container: HTMLElement; addUpdateCallback: (fn: () => void) => void; resize: (w: number, h: number) => void }) {
  
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      // 获取着色器文本
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
  
      //三维画笔
      const gl = canvas.getContext("webgl")!!;
  
      //初始化着色器
      //功能：解析着色器文本，整合到程序对象里，关联webgl上下文对象，实现两种语言的相互通信
      initShaders(gl, vsSource, fsSource);
  
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      //绘制顶点
      gl.drawArrays(gl.POINTS, 0, 1);
  
      //圆环宽度
      const vw = 512 / 8;
      //遍历圆环
      for (let i = 0; i < 4; i++) {
        logPixel(vw * i + vw / 2)
      }
  
  
      function logPixel(offset = 0) {
        //像素容器
        const pixel = new Uint8Array(4)
        //抓取像素
        gl.readPixels(
          canvas.width / 2 + offset,
          canvas.height / 2,
          1, 1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixel
        )
  
        console.log(pixel);
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
