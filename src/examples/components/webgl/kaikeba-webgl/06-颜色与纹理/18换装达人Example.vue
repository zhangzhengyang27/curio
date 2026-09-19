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
    uniform sampler2D u_Pattern1;
    uniform sampler2D u_Pattern2;
    uniform sampler2D u_Mask;
    uniform float u_Ratio;
    varying vec2 v_Pin;
    void main(){
      vec4 o=texture2D(u_Sampler,v_Pin);
      vec4 p1=texture2D(u_Pattern1,v_Pin);
      vec4 p2=texture2D(u_Pattern2,v_Pin);
      vec4 m=texture2D(u_Mask,v_Pin);
      vec4 p3=vec4(1,1,1,1);
      if(m.x>0.5){
        p3=mix(p1,p2,u_Ratio);
      }
      gl_FragColor=p3*o;
    }`

async function onReady({ canvas, container, addUpdateCallback, resize }: { canvas: HTMLCanvasElement; container: HTMLElement; addUpdateCallback: (fn: () => void) => void; resize: (w: number, h: number) => void }) {
  
      
      
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const gl = canvas.getContext("webgl")!!!;
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
      initShaders(gl, vsSource, fsSource);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
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
  
      const originImg = new Image()
      originImg.src = `/webgl/kaikeba-webgl/06-颜色与纹理/images/dress.jpg`
  
      const mask = new Image()
      mask.src = '/webgl/kaikeba-webgl/06-颜色与纹理/images/mask-dress.jpg'
  
      Promise.all([
        imgPromise(originImg),
        imgPromise(mask),
      ]).then(() => {
        rect.maps = {
          u_Sampler: { image: originImg },
          u_Mask: { image: mask },
        }
        loadImg()
      })
  
  
      function loadImg() {
        n++;
        const i1 = n % len
        const i2 = (n + 1) % len
  
        const pattern1 = new Image()
        pattern1.src = `/webgl/kaikeba-webgl/06-颜色与纹理/images/pattern${i1}.jpg`
  
        const pattern2 = new Image()
        pattern2.src = `/webgl/kaikeba-webgl/06-颜色与纹理/images/pattern${i2}.jpg`
  
        Promise.all([
          imgPromise(pattern1),
          imgPromise(pattern2),
        ]).then(() => {
          changeImg(pattern1, pattern2)
          ani()
        })
      }
  
      function changeImg(...imgs: any[]) {
        obj.ratio = 0
        rect.maps.u_Pattern1 = { image: imgs[0] }
        rect.maps.u_Pattern2 = { image: imgs[1] }
        rect.updateMaps()
        track = new Track(obj);
        track.start = new Date();
        track.timeLen = 1500;
        track.onEnd = loadImg
        track.keyMap = new Map([
          [
            "ratio",
            [
              [0, 0],
              [700, 1]
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

    canvas {
      background-color: antiquewhite;
    }
</style>
