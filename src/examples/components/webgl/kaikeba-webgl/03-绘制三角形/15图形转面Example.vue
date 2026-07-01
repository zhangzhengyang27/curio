<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {initShaders, ScaleLinear} from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Utils.js'
import Poly from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/Poly.js'
import ShapeGeo from '@/examples/jsm-compat/webgl/kaikeba-webgl/03-绘制三角形/jsm/ShapeGeo.js'
const vertexShader = `attribute vec4 a_Position;
      void main(){
          gl_Position=a_Position;
          gl_PointSize=10.0;
      }`

const fragmentShader = `void main(){
          gl_FragColor=vec4(1,1,0,1);
      }`

async function onReady({ canvas, container, addUpdateCallback, resize }) {
  
      
      
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
  
      const gl = canvas.getContext("webgl");
  
      initShaders(gl, vsSource, fsSource);
  
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      //路径G-逆时针
      const pathData = [
          0, 0,
          0, 600,
          600, 600,
          600, 200,
          200, 200,
          200, 400,
          300, 400,
          300, 300,
          500, 300,
          500, 500,
          100, 500,
          100, 100,
          600, 100,
          600, 0,
      ];
  
      //宽高比
      const ratio = canvas.width / canvas.height;
      //正方形高度
      const rectH = 1.0;
      //正方形宽度
      const rectW = rectH / ratio;
      //正方形宽高的一半
      const [halfRectW, halfRectH] = [rectW / 2, rectH / 2];
      //两个极点
      const minX = -halfRectW;
      const minY = -halfRectH;
      const maxX = halfRectW;
      const maxY = halfRectH;
      //正方形
      const rect = new Poly({
          gl,
          vertices: [
              minX, maxY,
              minX, minY,
              maxX, minY,
              maxX, maxY,
          ],
      });
      rect.draw();
  
  
      //建立比例尺
      const scaleX = ScaleLinear(
          0, minX,
          600, maxX
      );
      const scaleY = ScaleLinear(
          0, maxY,
          600, minY
      );
  
      //将路径G中的像素数据解析为webgl数据
      const glData = [];
      for (let i = 0; i < pathData.length; i += 2) {
          glData.push(scaleX(pathData[i]), scaleY(pathData[i + 1]));
      }
      const path = new Poly({
          gl,
          vertices: glData,
          types: ["POINTS", "LINE_LOOP"],
      });
      path.draw();
  
      const shapeGeo = new ShapeGeo(glData)
      const face = new Poly({
          gl,
          vertices: shapeGeo.vertices,
          types: ["TRIANGLES"],
      });
      face.draw();
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }
</style>
