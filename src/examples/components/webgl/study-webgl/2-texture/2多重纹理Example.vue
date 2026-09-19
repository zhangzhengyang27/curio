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
          //  通过 varying vec2 inUV; 顶点着色器与片元着色器传递数据
          let vertexstring = `
          attribute vec4 a_position;
          uniform   mat4    proj;
          attribute vec2 outUV;
          varying vec2 inUV;
          void main(void){
              gl_Position = proj *  a_position;
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
  
          // 初始化webgl
          function initWebgl() {
              let webglDiv = canvas;
              // 通过容器获取上下文
              webgl = webglDiv.getContext("webgl")!;
              // 设置视口
              webgl.viewport(0, 0, webglDiv.clientWidth, webglDiv.clientHeight);
              // 设置投影矩阵
              glMatrix.mat4.ortho(projMat4, 0, webglDiv.clientWidth, webglDiv.clientHeight, 0, -1.0, 1.0)
          }
  
          // 初始化着色器，shader 供 gpu 使用的
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
  
          // 初始化缓冲区
          function initBuffer() {
              // webgl 坐标系 第四、第五是 uv 坐标系
              let arr = [
                  0, 0, 0, 1, 0, 0,
                  0, 500, 0, 1, 0, 1,
                  500, 0, 0, 1, 1, 0,
  
                  500, 0, 0, 1, 1, 0,
                  0, 500, 0, 1, 0, 1,
                  500, 500, 0, 1, 1, 1,
              ]
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
  
              // 将 webgl 数据转换为 纹理可以识别的对象
              uniformTexture = webgl.getUniformLocation((webgl as any).program, "texture");
              uniformTexture1 = webgl.getUniformLocation((webgl as any).program, "texture1");
  
              texture1 = initTexture("/webgl/study-webgl/2-texture/images/fog.png");
              texture0 = initTexture("/webgl/study-webgl/2-texture/images/山水.png");
              // webgl.bindTexture(webgl.TEXTURE_2D, texture0);
              // webgl.bindTexture(webgl.TEXTURE_2D, texture1);
  
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
  
          // 绘制纹理
          function handleLoadedTexture(texture: any, _num?: any) {
              // 生成纹理
              webgl.bindTexture(webgl.TEXTURE_2D, texture);
              // 设置纹理参数
              webgl.texImage2D(webgl.TEXTURE_2D, 0, webgl.RGBA, webgl.RGBA, webgl.UNSIGNED_BYTE, texture.image);
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.NEAREST);
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.NEAREST);
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.REPEAT);
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.REPEAT);
              // 因为异步原因所以要加在这里
              webgl.uniform1i(uniformTexture, 0);
          }
  
          // 绘制
          function draw() {
              // 清除颜色缓冲区
              webgl.clearColor(0.0, 0.0, 0.0, 1.0);
              // 清除深度缓冲区
              webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);
              webgl.enable(webgl.DEPTH_TEST);
              // 纹理变动
              uniformAnim = webgl.getUniformLocation((webgl as any).program, "anim");
              // 设置变量
              count = count + 0.01;
              // 传递变量
              webgl.uniform1f(uniformAnim, count);
              // 绘制
              webgl.activeTexture(webgl.TEXTURE0);
              // 绑定纹理
              webgl.bindTexture(webgl.TEXTURE_2D, texture0);
              // 传递纹理
              webgl.uniform1i(uniformTexture, 0);
  
              webgl.activeTexture(webgl.TEXTURE1);
              webgl.bindTexture(webgl.TEXTURE_2D, texture1);
              webgl.uniform1i(uniformTexture1, 1);
  
              webgl.drawArrays(webgl.TRIANGLES, 0, 6);
          }
  
          
  
  if (typeof init === 'function') {
    init()
  }
}
</script>

