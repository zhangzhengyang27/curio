<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import Track from '@/examples/jsm-compat/webgl/kaikeba-webgl/06-颜色与纹理/jsm/Track.js'
import { imgPromise, initShaders, } from '@/examples/jsm-compat/webgl/kaikeba-webgl/06-颜色与纹理/jsm/Utils.js'
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
    uniform sampler2D u_Pattern;
    uniform sampler2D u_Gradient;
    uniform float u_Ratio;
    varying vec2 v_Pin;
    void main(){
      vec4 o=texture2D(u_Sampler,v_Pin);
      vec4 p=texture2D(u_Pattern,v_Pin);
      vec4 g=texture2D(u_Gradient,v_Pin);
      float f=clamp((g.r + u_Ratio), 0.0, 1.0);
      gl_FragColor=mix(o,p,f);
    }`

async function onReady({ canvas, container, addUpdateCallback, resize }: { canvas: HTMLCanvasElement; container: HTMLElement; addUpdateCallback: (fn: () => void) => void; resize: (w: number, h: number) => void }) {
  
      
      
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const gl = canvas.getContext("webgl")!!!;
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
      initShaders(gl, vsSource, fsSource);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
      //数据源
      const source = new Float32Array([
        -0.4, 0.8, 0, 1,
        -0.4, -0.8, 0, 0,
        0.4, 0.8, 1, 1,
        0.4, -0.8, 1, 0,
      ]);
  
      let n: number = 0
      let len = 5
      const obj = { ratio: 0 }
      let track: any = null
  
      const rect = new Poly({
        gl,
        source,
        type: 'TRIANGLE_STRIP',
        uniforms: {
          u_Ratio: {
            type: 'uniform1f',
            value: obj.ratio
          }
        },
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
  
  
  
      loadImg()
  
      function loadImg() {
        n++;
        const i1 = n % len
        const i2 = (n + 1) % len
        const i3 = Math.round(Math.random() * 4)
  
        const originImg = new Image()
        originImg.src = `/webgl/kaikeba-webgl/06-颜色与纹理/images/pattern${i1}.jpg`
  
        const pattern = new Image()
        pattern.src = `/webgl/kaikeba-webgl/06-颜色与纹理/images/pattern${i2}.jpg`
  
        const gradient = new Image()
        gradient.src = `/webgl/kaikeba-webgl/06-颜色与纹理/images/mask${i3}.jpg`
  
        Promise.all([
          imgPromise(originImg),
          imgPromise(pattern),
          imgPromise(gradient),
        ]).then(() => {
          changeImg(originImg, pattern, gradient)
          ani()
        })
      }
  
      function changeImg(...imgs: any[]) {
        obj.ratio = 0
  
        rect.maps = {
          u_Sampler: { image: imgs[0] },
          u_Pattern: { image: imgs[1] },
          u_Gradient: { image: imgs[2] },
        }
        rect.updateMaps()
        track = new Track(obj);
        track.start = new Date();
        track.timeLen = 2000;
        track.onEnd = loadImg
        track.keyMap = new Map([
          [
            "ratio",
            [
              [0, 0],
              [1000, 1]
            ],
          ],
        ]);
      }
  
  
      /* 动画 */
      function ani() {
        track.update(new Date())
        rect.uniforms.u_Ratio.value = obj.ratio;
        rect.updateUniform()
        render()
        requestAnimationFrame(ani)
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
