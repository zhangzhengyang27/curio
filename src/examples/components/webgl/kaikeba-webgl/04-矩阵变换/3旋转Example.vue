<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import {initShaders} from '@/examples/jsm-compat/webgl/kaikeba-webgl/04-矩阵变换/jsm/Utils.js'
const vertexShader = `attribute vec4 a_Position;
    float angle=radians(30.0);
    float sinB=sin(angle);
    float cosB=cos(angle);
    void main(){
        //gl_Position = a_Position;
        gl_Position.x=a_Position.x*cosB-a_Position.y*sinB;
        gl_Position.y=a_Position.y*cosB+a_Position.x*sinB;
        gl_Position.z=a_Position.z;
        gl_Position.w=1.0;
    }`

const fragmentShader = `void main(){
        gl_FragColor=vec4(1.0,1.0,0.0,1.0);
    }`

async function onReady({ canvas, container, addUpdateCallback, resize }) {
  
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const gl = canvas.getContext('webgl');
  
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
      initShaders(gl, vsSource, fsSource);
  
  
      const vertices = new Float32Array([
          0.0, 0.1,
          -0.1, -0.1,
          0.1, -0.1
      ])
  
      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
  
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
  
      gl.drawArrays(gl.TRIANGLES, 0, 3);
}
</script>

<style scoped>
.webgl-example-scene {
            margin: 0;
            overflow: hidden
        }
</style>
