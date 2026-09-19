<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { loadGlMatrixModern } from '@/examples/utils/loadGlMatrix'
async function onReady({ canvas, container, addUpdateCallback, resize }: { canvas: HTMLCanvasElement; container: HTMLElement; addUpdateCallback: (fn: () => void) => void; resize: (w: number, h: number) => void }) {
  await loadGlMatrixModern("/webgl/study-webgl/libs/gl-matrix.js");
  let vertexstring = `
          attribute vec4 a_position;
          uniform mat4 u_formMatrix;
          uniform mat4 proj;
          attribute vec4 a_color;
          varying vec4 color;
          void main(void){
              gl_Position =   u_formMatrix * a_position;
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
  
          var webgl: any;          var angle = 60;
          var webglDiv: any;  
          function init() {
              initWebgl();
              initShader();
              initBuffer();
              draw();
              inittext(angle)
              
          }
  
          function inittext(angle: any) {
              if (!(inittext as any)._el) {
                (inittext as any)._el = document.createElement('div');
                (inittext as any)._el.style.cssText = 'position:absolute;top:10px;left:10px;color:#fff;font-size:14px;pointer-events:none;';
                container.appendChild((inittext as any)._el);
              }
              (inittext as any)._el.innerHTML = "视角为:" + angle
          }
  
          function initEvent() {
              document.onkeydown = handleKeyDown;
          }
  
          function handleKeyDown(event: any) {
  
              if (String.fromCharCode(event.keyCode) == 'W') {
                  angle += 1;
              } else if (String.fromCharCode(event.keyCode) == 'S') {
                  angle -= 1;
              }
  
              inittext(angle)
              initBuffer();
              draw();
  
          }
  
          function initWebgl() {
              webglDiv = canvas;
              webgl = webglDiv.getContext("webgl")!;
              webgl.viewport(0, 0, webglDiv.clientWidth, webglDiv.clientHeight);
  
          }
  
          function initShader() {
  
              let vsshader = webgl.createShader(webgl.VERTEX_SHADER)!;
              let fsshader = webgl.createShader(webgl.FRAGMENT_SHADER)!;
  
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
              (webgl as any).program = program
  
          }
  
          function initBuffer() {
              let ProjMatrix = glMatrix.mat4.create();
              glMatrix.mat4.identity(ProjMatrix);
              // //修改可视域范围 角度小，看到的物体大，角度大，看到的物体小。
              glMatrix.mat4.perspective(ProjMatrix, angle * Math.PI / 180, webglDiv.clientWidth / webglDiv.clientHeight, 1, 100);
  
  
              let arr = [
                  0.0, 70, -40, 1, 1, 0, 0, 1,
                  -50, -30, -40, 1, 1, 0, 0, 1, // 红色
                  50, -30, -40, 1, 1, 0, 0, 1,
  
                  50, 40, -20, 1, 1.0, 1.0, 0.4, 1,
                  -50, 40, -20, 1, 1.0, 1.0, 0.4, 1,
                  0.0, -60, -20, 1, 1.0, 1.0, 0.4, 1,// 黄色
  
                  0.0, 50, 0.0, 1, 0.4, 0.4, 1.0, 1,
                  -50, -50, 0.0, 1, 0.4, 0.4, 1.0, 1,
                  50, -50, 0.0, 1, 0.4, 0.4, 1.0, 1, // 蓝色
  
  
              ]
  
              let pointPosition = new Float32Array(arr);
              let aPsotion = webgl.getAttribLocation((webgl as any).program, "a_position");
              let triangleBuffer = webgl.createBuffer();
              webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer);
              webgl.bufferData(webgl.ARRAY_BUFFER, pointPosition, webgl.STATIC_DRAW);
              webgl.enableVertexAttribArray(aPsotion);
              webgl.vertexAttribPointer(aPsotion, 4, webgl.FLOAT, false, 8 * 4, 0);
              let aColor = webgl.getAttribLocation((webgl as any).program, "a_color");
              webgl.enableVertexAttribArray(aColor);
              webgl.vertexAttribPointer(aColor, 4, webgl.FLOAT, false, 8 * 4, 4 * 4);
  
              let uniformMatrix1 = webgl.getUniformLocation((webgl as any).program, "u_formMatrix");
              webgl.uniformMatrix4fv(uniformMatrix1, false, ProjMatrix)
          }
  
          function draw() {
              webgl.clearColor(0.0, 1.0, 0.0, 1.0);
              webgl.clear(webgl.COLOR_BUFFER_BIT);
              webgl.drawArrays(webgl.TRIANGLES, 0, 9);
          }
  
  if (typeof init === 'function') {
    init()
  }
}
</script>

