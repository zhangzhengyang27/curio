<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { loadGlMatrixModern } from '@/examples/utils/loadGlMatrix.js'
async function onReady({ canvas, container, addUpdateCallback, resize }) {
  await loadGlMatrixModern("/webgl/study-webgl/libs/gl-matrix.js");
  let vertexstring = `
          attribute vec4 a_position;
          uniform mat4 u_formMatrix;
          uniform mat4 proj;
          attribute vec4 a_color;
          varying vec4 color;
          void main(void){
              gl_Position =  u_formMatrix * a_position;
              color = a_color;
          }
          `;
          let fragmentstring = `
          precision mediump float;
          varying vec4 color;
          void main(void){
            gl_FragColor =color;
          }
          `;
  
          var webgl;
          var uniformAnim = 0;
          var count = 0;
  
          function webglStart() {
              init();
          }
  
          function init() {
              initWebgl();
              initShader();
              initBuffer();
              draw();
              }
  
          function initWebgl() {
              let webglDiv = canvas;
              webgl = webglDiv.getContext("webgl");
              webgl.viewport(0, 0, webglDiv.clientWidth, webglDiv.clientHeight);
  
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
              let ModelMatrix = glMatrix.mat4.create();
              glMatrix.mat4.identity(ModelMatrix);
              let angle = Math.PI / 180 * 30;
              glMatrix.mat4.rotate(ModelMatrix, ModelMatrix, angle, [0, 0, 1])
  
              // 视图矩阵
              let ViewMatrix = glMatrix.mat4.create();
              glMatrix.mat4.identity(ViewMatrix);
              // 模型矩阵
              ViewMatrix = glMatrix.mat4.lookAt(ViewMatrix, [0, 0, 0.3], [0, 0, 0], [0, 1, 0]);
              let mvMatrix = glMatrix.mat4.create();
              glMatrix.mat4.multiply(mvMatrix, ViewMatrix, ModelMatrix)
  
              let arr = [
                  0.0, 0.5, -0.4, 1, 0.4, 1.0, 0.4, 1,
                  -0.5, -0.5, -0.4, 1, 0.4, 1.0, 0.4, 1,
                  0.5, -0.5, -0.4, 1, 0.4, 1.0, 0.4, 1,
  
                  0.5, 0.4, -0.2, 1, 1.0, 1.0, 0.4, 1,
                  -0.5, 0.4, -0.2, 1, 1.0, 1.0, 0.4, 1,
                  0.0, -0.6, -0.2, 1, 1.0, 1.0, 0.4, 1,
  
                  0.0, 0.5, 0.0, 1, 0.4, 0.4, 1.0, 1,
                  -0.5, -0.5, 0.0, 1, 0.4, 0.4, 1.0, 1,
                  0.5, -0.5, 0.0, 1, 0.4, 0.4, 1.0, 1,
              ]
  
              let pointPosition = new Float32Array(arr);
              let aPsotion = webgl.getAttribLocation(webgl.program, "a_position");
              let triangleBuffer = webgl.createBuffer();
              webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer);
              webgl.bufferData(webgl.ARRAY_BUFFER, pointPosition, webgl.STATIC_DRAW);
              webgl.enableVertexAttribArray(aPsotion);
              webgl.vertexAttribPointer(aPsotion, 4, webgl.FLOAT, false, 8 * 4, 0);
              let aColor = webgl.getAttribLocation(webgl.program, "a_color");
              webgl.enableVertexAttribArray(aColor);
              webgl.vertexAttribPointer(aColor, 4, webgl.FLOAT, false, 8 * 4, 4 * 4);
  
  
              let uniformMatrix1 = webgl.getUniformLocation(webgl.program, "u_formMatrix");
              webgl.uniformMatrix4fv(uniformMatrix1, false, mvMatrix)
          }
  
          function draw() {
              webgl.clearColor(0.0, 1.0, 0.0, 1.0);
              webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);
              // webgl.enable(webgl.DEPTH_TEST);
              //纹理变动
              uniformAnim = webgl.getUniformLocation(webgl.program, "anim");
              count = count + 0.01;
              webgl.uniform1f(uniformAnim, count);
              webgl.drawArrays(webgl.TRIANGLES, 0, 9);
          }
  
  if (typeof init === 'function') {
    init()
  }
}
</script>

