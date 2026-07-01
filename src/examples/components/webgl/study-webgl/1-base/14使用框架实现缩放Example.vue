<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { loadGlMatrixLegacy } from '@/examples/utils/loadGlMatrix.js'
async function onReady({ canvas, container, addUpdateCallback, resize }) {
  await loadGlMatrixLegacy("/webgl/study-webgl/libs/glMatrix-0.9.6.min.js");
  let vertexstring = `
          attribute vec4 a_position;
          uniform mat4 u_formMatrix;
          void main(void){
              gl_Position =u_formMatrix * a_position;
          }
          `;
          let fragmentstring = `
          precision mediump float;
          void main(void){
            gl_FragColor =vec4(1.0,1.0,0.0,1.0);
          }
          `;
          var projMat4 = mat4.create();
          var webgl;
          var uniformAnim = 0;
          var count = 0;
  
          function webglStart() {
              init();
              tick();
          }
  
          function tick() {
              requestAnimFrame(tick)
              draw();
          };
  
          function init() {
              initWebgl();
              initShader();
              initBuffer();
  
          }
  
          function initWebgl() {
              let webglDiv = canvas;
              webgl = webglDiv.getContext("webgl");
              webgl.viewport(0, 0, webglDiv.clientWidth, webglDiv.clientHeight);
              //mat4.ortho(0, webglDiv.clientWidth, webglDiv.clientHeight, 0, -1.0, 1.0, projMat4)
          }
  
          function initShader() {
  
              let vsshader = webgl.createShader(webgl.VERTEX_SHADER);
              let fsshader = webgl.createShader(webgl.FRAGMENT_SHADER);
  
              webgl.shaderSource(vsshader, vertexstring);
              webgl.shaderSource(fsshader, fragmentstring);
  
              webgl.compileShader(vsshader);
              webgl.compileShader(fsshader);
              if (!webgl.getShaderParameter(vsshader, webgl.COMPILE_STATUS)) {
                  const err = webgl.getShaderInfoLog(vsshader);
                  alert(err);
                  return;
              }
              if (!webgl.getShaderParameter(fsshader, webgl.COMPILE_STATUS)) {
                  const err = webgl.getShaderInfoLog(fsshader);
                  alert(err);
                  return;
              }
              let program = webgl.createProgram();
              webgl.attachShader(program, vsshader);
              webgl.attachShader(program, fsshader)
  
              webgl.linkProgram(program);
              webgl.useProgram(program);
  
              webgl.program = program
          }
  
          function initBuffer() {
  
              let modelView = mat4.create();
              mat4.identity(modelView);
              mat4.scale(modelView, [1, 8, 1]);
              let arr = [
                  0, 0, 0, 1,
                  0, 0.05, 0, 1,
                  0.5, 0, 0, 1,
  
                  0.5, 0, 0, 1,
                  0, 0.05, 0, 1,
                  0.5, 0.05, 0, 1
  
              ]
              let pointPosition = new Float32Array(arr);
              let aPsotion = webgl.getAttribLocation(webgl.program, "a_position");
              let triangleBuffer = webgl.createBuffer();
              webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer);
              webgl.bufferData(webgl.ARRAY_BUFFER, pointPosition, webgl.STATIC_DRAW);
              webgl.enableVertexAttribArray(aPsotion);
              webgl.vertexAttribPointer(aPsotion, 4, webgl.FLOAT, false, 4 * 4, 0);
  
  
              let uniformMatrix = webgl.getUniformLocation(webgl.program, "u_formMatrix");
              webgl.uniformMatrix4fv(uniformMatrix, false, modelView)
  
  
          }
  
          function draw() {
              webgl.clearColor(0.0, 1.0, 0.0, 1.0);
              webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);
              webgl.enable(webgl.DEPTH_TEST);
  
  
              //纹理变动
              uniformAnim = webgl.getUniformLocation(webgl.program, "anim");
              count = count + 0.01;
              webgl.uniform1f(uniformAnim, count);
  
  
              webgl.drawArrays(webgl.TRIANGLES, 0, 6);
          }
  
          window.requestAnimFrame = (function () {
              return window.requestAnimationFrame ||
                  window.mozRequestAnimationFrame ||
                  window.oRequestAnimationFrame ||
                  window.msRequestAnimationFrame ||
                  function (callback, element) {
                      window.setTimeout(callback, 1000 / 60);
                  };
          })();
  
  if (typeof init === 'function') {
    init()
  }
}
</script>

