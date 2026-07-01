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
          var count = 0;
  
          function webglStart() {
              init();
              tick();
          }
  
          function tick() {
              window.setTimeout(tick, 1000);
  
              initBuffer1();
              initBuffer2();
              initBuffer3();
              count = count + 1;
          };
  
          function init() {
              initWebgl();
              initShader();
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
  
          function initBuffer1() {
  
              let modelView = mat4.create();
              mat4.identity(modelView);
              mat4.scale(modelView, [1, 1, 1]);
              //一分钟 转0.5度
              // (Math.PI/180) (0.5/60)  *count
              let angle = -Math.PI / 1800 * count * 5 / 60;
              mat4.rotate(modelView, angle, [0, 0, 1])
  
              let arr = [
                  0, 0, 0, 1,
                  0, 0.05, 0, 1,
                  0.3, 0, 0, 1,
  
                  0.3, 0, 0, 1,
                  0, 0.05, 0, 1,
                  0.3, 0.05, 0, 1
  
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
  
              webgl.clearColor(0.0, 1.0, 0.0, 1.0);
              webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);
              webgl.enable(webgl.DEPTH_TEST);
  
              webgl.drawArrays(webgl.TRIANGLES, 0, 6);
  
          }
  
          function initBuffer2() {
              let modelView1 = mat4.create();
              mat4.identity(modelView1);
              mat4.scale(modelView1, [1, 1, 1]);
              let angle = -Math.PI / 1800 * count;
              mat4.rotate(modelView1, angle, [0, 0, 1])
              let arr = [
                  0, 0, 0, 1,
                  0, 0.05, 0, 1,
                  0.4, 0, 0, 1,
  
                  0.4, 0, 0, 1,
                  0, 0.05, 0, 1,
                  0.4, 0.05, 0, 1
  
              ]
              let pointPosition = new Float32Array(arr);
              let aPsotion = webgl.getAttribLocation(webgl.program, "a_position");
              let triangleBuffer = webgl.createBuffer();
              webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer);
              webgl.bufferData(webgl.ARRAY_BUFFER, pointPosition, webgl.STATIC_DRAW);
              webgl.enableVertexAttribArray(aPsotion);
              webgl.vertexAttribPointer(aPsotion, 4, webgl.FLOAT, false, 4 * 4, 0);
  
  
              let uniformMatrix = webgl.getUniformLocation(webgl.program, "u_formMatrix");
              webgl.uniformMatrix4fv(uniformMatrix, false, modelView1)
  
              webgl.drawArrays(webgl.TRIANGLES, 0, 6);
  
          }
  
          function initBuffer3() {
              let modelView1 = mat4.create();
              mat4.identity(modelView1);
              mat4.scale(modelView1, [1, 1, 1]);
              let angle = -Math.PI / 30 * count;
  
              mat4.rotate(modelView1, angle, [0, 0, 1])
              let arr = [
                  0, 0, 0, 1,
                  0, 0.05, 0, 1,
                  0.8, 0, 0, 1,
  
                  0.8, 0, 0, 1,
                  0, 0.05, 0, 1,
                  0.8, 0.05, 0, 1
  
              ]
              let pointPosition = new Float32Array(arr);
              let aPsotion = webgl.getAttribLocation(webgl.program, "a_position");
              let triangleBuffer = webgl.createBuffer();
              webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer);
              webgl.bufferData(webgl.ARRAY_BUFFER, pointPosition, webgl.STATIC_DRAW);
              webgl.enableVertexAttribArray(aPsotion);
              webgl.vertexAttribPointer(aPsotion, 4, webgl.FLOAT, false, 4 * 4, 0);
  
  
              let uniformMatrix = webgl.getUniformLocation(webgl.program, "u_formMatrix");
              webgl.uniformMatrix4fv(uniformMatrix, false, modelView1)
  
              webgl.drawArrays(webgl.TRIANGLES, 0, 6);
  
          }
  
          function draw() {
  
  
              // //纹理变动
              // uniformAnim = webgl.getUniformLocation(webgl.program, "anim");
  
              // webgl.uniform1f(uniformAnim, count);
  
  
              // webgl.drawArrays(webgl.TRIANGLES, 0, 6);
          }
  
          window.requestAnimFrame = (function () {
              return window.requestAnimationFrame ||
                  window.webkitRequestAnimationFrame ||
                  window.mozRequestAnimationFrame ||
                  window.oRequestAnimationFrame ||
                  window.msRequestAnimationFrame ||
                  function (callback, element) {
  
                  };
          })();
  
  if (typeof init === 'function') {
    init()
  }
}
</script>

