<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
async function onReady({ canvas, container, addUpdateCallback, resize }) {
  
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // 使用canvas 获取webgl 绘图上下文
      const gl = canvas.getContext("webgl");
      // 指定将要用来清空绘图区的颜色
      gl.clearColor(1, 1, 0, 1);
      // 使用之前指定的颜色，清空绘图区
      gl.clear(gl.COLOR_BUFFER_BIT);
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }
</style>
