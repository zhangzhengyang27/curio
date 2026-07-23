<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {Color} from 'three'
async function onReady({ canvas, container, addUpdateCallback, resize }) {
  
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const gl = canvas.getContext("webgl");
      // 声明颜色 rgba
      gl.clearColor(1, 1, 0, 1);
      // 刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      const color = new Color("rgba(255,0,0,1)");
      //声明颜色 rgba
      gl.clearColor(color.r, color.g, color.b, 1);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      // 建立色相偏移动画
      ;(function ani() {
          color.offsetHSL(0.005, 0, 0);
          //声明颜色 rgba
          gl.clearColor(color.r, color.g, color.b, 1);
          //刷底色
          gl.clear(gl.COLOR_BUFFER_BIT);
          requestAnimationFrame(ani);
      })();
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }
</style>
