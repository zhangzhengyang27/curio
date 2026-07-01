<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
async function onReady({ canvas, container, addUpdateCallback, resize }) {
  
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const gl = canvas.getContext("webgl");
  
      //css颜色
      const rgbaCss = "rgba(255,100,0,1)";
      //正则
      const reg = RegExp(/\((.*)\)/);
      //捕捉数据
      const rgbaStr = reg.exec(rgbaCss)[1];
      // 255,100,0,1
      console.log(rgbaStr);
      //加工数据
      const rgba = rgbaStr.split(",").map((n) => parseInt(n));
      // [255, 100, 0, 1]
      console.log(rgba);
  
      const r = rgba[0] / 255;
      const g = rgba[1] / 255;
      const b = rgba[2] / 255;
      const a = rgba[3];
      //声明颜色 rgba
      gl.clearColor(r, g, b, a);
      //刷底色
      gl.clear(gl.COLOR_BUFFER_BIT);
  
  if (typeof init === 'function') {
    init()
  }
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden;
        }
</style>
