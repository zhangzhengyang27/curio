<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {initShaders} from '@/examples/jsm-compat/webgl/kaikeba-webgl/02-js与着色器间的数据传输/jsm/Utils.js'
const vertexShader = `attribute vec4 a_Position;
      attribute float a_PointSize;
      void main(){
          //点位
          gl_Position=a_Position;
          //尺寸
          gl_PointSize=a_PointSize;
      }`

const fragmentShader = `precision mediump float;
      uniform vec4 u_FragColor;
      void main(){
        float dist=distance(gl_PointCoord,vec2(0.5,0.5));
        if(dist<0.5){
          gl_FragColor=u_FragColor;
        }else{
          discard;
        }
      }`

async function onReady({ canvas, container, addUpdateCallback, resize }: { canvas: HTMLCanvasElement; container: HTMLElement; addUpdateCallback: (fn: () => void) => void; resize: (w: number, h: number) => void }) {
  
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
  
      const gl = canvas.getContext("webgl")!!;
      // 开启片元的颜色合成功能
      gl.enable(gl.BLEND);
      // 设置片元的合成方式
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
      //初始化着色器
      initShaders(gl, vsSource, fsSource);
  
      const a_Position = gl.getAttribLocation((gl as any).program, "a_Position");
      const a_PointSize = gl.getAttribLocation((gl as any).program, "a_PointSize");
      const u_FragColor = gl.getUniformLocation((gl as any).program, "u_FragColor");
  
      const stars: any[] = [];
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 0);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      render();
  
      // 鼠标点击事件
      canvas.addEventListener("click", ({clientX, clientY}) => {
          console.log(clientX, clientY);
          const {left, top, width, height} = canvas.getBoundingClientRect();
          const [cssX, cssY] = [clientX - left, clientY - top];
  
          //解决坐标原点位置的差异
          const [halfWidth, halfHeight] = [width / 2, height / 2];
          const [xBaseCenter, yBaseCenter] = [
              cssX - halfWidth,
              cssY - halfHeight,
          ];
          // 解决y 方向的差异
          const yBaseCenterTop = -yBaseCenter;
          //解决坐标基底的差异
          const [x, y] = [xBaseCenter / halfWidth, yBaseCenterTop / halfHeight];
  
          const s = Math.random() * 5 + 2;
          const a = Math.random();
          stars.push({x, y, s, a});
          render();
      });
  
      // 渲染方法
      function render() {
          gl.clear(gl.COLOR_BUFFER_BIT);
          stars.forEach(({x, y, s, a}) => {
              gl.vertexAttrib2f(a_Position, x, y);
              gl.vertexAttrib1f(a_PointSize, s);
              const arr = new Float32Array([0.87, 0.91, 1, a]);
              gl.uniform4fv(u_FragColor, arr);
              gl.drawArrays(gl.POINTS, 0, 1);
          });
      }
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }

        .webgl-example-canvas {
            background: url("/webgl/kaikeba-webgl/02-js与着色器间的数据传输/images/sky.jpg");
            background-size: cover;
            background-position: right bottom;
        }
</style>
