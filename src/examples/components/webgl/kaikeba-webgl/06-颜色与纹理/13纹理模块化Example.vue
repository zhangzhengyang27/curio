<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { initShaders, } from '@/examples/jsm-compat/webgl/kaikeba-webgl/06-颜色与纹理/jsm/Utils.js'
import Poly from '@/examples/jsm-compat/webgl/kaikeba-webgl/06-颜色与纹理/jsm/Poly.js'
const vertexShader = `attribute vec4 a_Position;
    attribute vec2 a_Pin;
    varying vec2 v_Pin;
    void main(){
      gl_Position = a_Position;
      v_Pin=a_Pin;
    }`

const fragmentShader = `precision mediump float;
    uniform sampler2D u_Sampler;
    varying vec2 v_Pin;
    void main(){
      gl_FragColor=texture2D(u_Sampler,v_Pin);
    }`

async function onReady({ canvas, container, addUpdateCallback, resize }) {
  
      
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const gl = canvas.getContext('webgl');
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
      initShaders(gl, vsSource, fsSource);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
      console.log(gl.LINEAR);
      console.log(gl.NEAREST);
      console.log(gl.NEAREST_MIPMAP_NEAREST);
      console.log(gl.NEAREST_MIPMAP_LINEAR);
      console.log(gl.LINEAR_MIPMAP_NEAREST);
      console.log(gl.LINEAR_MIPMAP_LINEAR);
  
      //数据源
      const source = new Float32Array([
        -0.5, 0.5, 0, 1,
        -0.5, -0.5, 0, 0.0,
        0.5, 0.5, 1.0, 1,
        0.5, -0.5, 1.0, 0.0,
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
        }
      })
  
      const image = new Image()
      image.src = '/webgl/kaikeba-webgl/06-颜色与纹理/images/erha.jpg'
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
      overflow: hidden
    }
</style>
