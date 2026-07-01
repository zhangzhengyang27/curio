<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {initShaders, getMousePosInWebgl} from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Utils.js'
import Poly from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Poly.js'
import Sky from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Sky.js'
const vertexShader = `attribute vec4 a_Position;
      void main(){
          gl_Position=a_Position;
          gl_PointSize=10.0;
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

async function onReady({ canvas, container, addUpdateCallback, resize }) {
  
      
      
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
  
      const gl = canvas.getContext("webgl")
  
      initShaders(gl, vsSource, fsSource);
  
      //声明颜色
      gl.clearColor(0, 0, 0, 1);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      //夜空
      const sky = new Sky(gl)
      //当前正在绘制的多边形
      let poly = null
  
      //取消右击提示
      canvas.oncontextmenu = function () {
          return false;
      }
      // 鼠标点击事件
      canvas.addEventListener("mousedown", (event) => {
          if (event.button === 2) {
              popVertice()
          } else {
              const {x, y} = getMousePosInWebgl(event, canvas)
              if (poly) {
                  poly.addVertice(x, y)
              } else {
                  crtPoly(x, y)
              }
          }
          render()
      });
      //鼠标移动
      canvas.addEventListener("mousemove", (event) => {
          if (poly) {
              const {x, y} = getMousePosInWebgl(event, canvas)
              poly.setVertice(poly.count - 1, x, y)
              render()
          }
      });
  
      //删除最后一个顶点
      function popVertice() {
          poly.popVertice()
          poly = null
      }
  
      //创建多边形
      function crtPoly(x, y) {
          poly = new Poly({
              vertices: [x, y, x, y],
              types: ['POINTS', 'LINE_STRIP'],
              circleDot: true
          })
          sky.add(poly)
      }
  
      // 渲染方法
      function render() {
          gl.clear(gl.COLOR_BUFFER_BIT)
          sky.draw()
      }
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }
</style>
