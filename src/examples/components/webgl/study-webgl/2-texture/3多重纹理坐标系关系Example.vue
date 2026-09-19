<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { loadGlMatrixModern } from '@/examples/utils/loadGlMatrix'
async function onReady({ canvas, container, addUpdateCallback, resize }: { canvas: HTMLCanvasElement; container: HTMLElement; addUpdateCallback: (fn: () => void) => void; resize: (w: number, h: number) => void }) {
  await loadGlMatrixModern('/webgl/study-webgl/libs/gl-matrix.js');
  // 定义 webgl 容器
          var webgl: any = null;
          // 定义 顶点数组
          var projMat4 = glMatrix.mat4.create();
          var uniformTexture = 0;
          var uniformTexture1 = 0;
          var uniformAnim = 0;
          var count = 0;
          var texture0: WebGLTexture;          var texture1: WebGLTexture;  
          let vertexstring = `
          attribute vec4 a_position;
          uniform   mat4    proj;
          attribute vec2 outUV;
          varying vec2 inUV;
          void main(void){
              gl_Position =  a_position;
              inUV = outUV;
          }
          `;
          let fragmentstring = `
          precision mediump float;
          uniform sampler2D texture;
          uniform sampler2D texture1;
          uniform float anim;
          varying vec2 inUV;
          void main(void){
            vec4 color1 =texture2D(texture,inUV);
            vec4 color2 =texture2D(texture1, vec2(inUV.x + anim, inUV.y));
  
            gl_FragColor = color1 + color2 ;
          }
          `;
  
          function webglStart() {
              init();
              tick();
          }
  
          function tick() {
              requestAnimationFrame(tick)
              draw();
          };
  
          function init() {
              initWebgl();
              initShader();
              initBuffer();
  
          }
  
          function initWebgl() {
              let webglDiv = canvas;
              webgl = webglDiv.getContext("webgl")!;
              webgl.viewport(0, 0, webglDiv.clientWidth, webglDiv.clientHeight);
              glMatrix.mat4.ortho(projMat4, 0, webglDiv.clientWidth, webglDiv.clientHeight, 0, -1.0, 1.0)
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
              // webgl 坐标绘制正方形
              let arr = [
                  -0.5, -0.5, 0, 1, 0, 0,
                  -0.5, 0.5, 0, 1, 0, -1,
                  0.5, 0.5, 0, 1, 1, -1,
                  0.5, -0.5, 0, 1, 1, 0,
              ]
              let index = [
                  0, 1, 2,
                  2, 0, 3
              ];
              let pointPosition = new Float32Array(arr);
              let aPsotion = webgl.getAttribLocation((webgl as any).program, "a_position");
              let triangleBuffer = webgl.createBuffer();
              webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer);
              webgl.bufferData(webgl.ARRAY_BUFFER, pointPosition, webgl.STATIC_DRAW);
              webgl.enableVertexAttribArray(aPsotion);
              webgl.vertexAttribPointer(aPsotion, 4, webgl.FLOAT, false, 6 * 4, 0);
  
              let uniformProj = webgl.getUniformLocation((webgl as any).program, "proj");
              webgl.uniformMatrix4fv(uniformProj, false, projMat4);
  
              let attribOutUV = webgl.getAttribLocation((webgl as any).program, "outUV");
              webgl.enableVertexAttribArray(attribOutUV);
              webgl.vertexAttribPointer(attribOutUV, 2, webgl.FLOAT, false, 6 * 4, 4 * 4);
  
              let indexarr = new Uint8Array(index)
              let indexBuffer = webgl.createBuffer();
              webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, indexBuffer);
              webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, indexarr, webgl.STATIC_DRAW);
  
  
              uniformTexture = webgl.getUniformLocation((webgl as any).program, "texture");
              uniformTexture1 = webgl.getUniformLocation((webgl as any).program, "texture1");
  
              texture1 = initTexture("/webgl/study-webgl/2-texture/images/fog.png");
              texture0 = initTexture("/webgl/study-webgl/2-texture/images/山水.png");
          }
  
          function handleLoadedTexture(texture: any, _num?: any) {
  
              webgl.bindTexture(webgl.TEXTURE_2D, texture);
              // 转换坐标系
              // webgl.pixelStorei(webgl.UNPACK_FLIP_Y_WEBGL, 666);
  
              webgl.texImage2D(webgl.TEXTURE_2D, 0, webgl.RGBA, webgl.RGBA, webgl.UNSIGNED_BYTE, texture.image);
  
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.LINEAR);
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.LINEAR);
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.REPEAT);
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.REPEAT);
  
              // webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.CLAMP_TO_EDGE);
              // webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.CLAMP_TO_EDGE);
  
          }
  
          function initTexture(imageFile: any, num?: any) {
              let textureHandle = webgl.createTexture()!;
              textureHandle.image = new Image();
              textureHandle.image.src = imageFile;
              textureHandle.image.onload = function () {
                  handleLoadedTexture(textureHandle, num)
              }
              return textureHandle;
          }
  
          function draw() {
              // 清除颜色缓冲区
              webgl.clearColor(0.0, 0.0, 0.0, 1.0);
              webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);
              webgl.enable(webgl.DEPTH_TEST);
  
  
              //纹理变动
              uniformAnim = webgl.getUniformLocation((webgl as any).program, "anim");
              count = count + 0.01;
              webgl.uniform1f(uniformAnim, count);
              webgl.activeTexture(webgl.TEXTURE0);
              webgl.bindTexture(webgl.TEXTURE_2D, texture0);
              webgl.uniform1i(uniformTexture, 0);
  
              webgl.activeTexture(webgl.TEXTURE1);
              webgl.bindTexture(webgl.TEXTURE_2D, texture1);
              webgl.uniform1i(uniformTexture1, 1);
  
  
              webgl.drawElements(webgl.TRIANGLES, 6, webgl.UNSIGNED_BYTE, 0);
          }
  
          
  
  if (typeof init === 'function') {
    init()
  }
}
</script>

