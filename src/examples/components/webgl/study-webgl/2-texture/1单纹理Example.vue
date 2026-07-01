<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { loadGlMatrixModern } from '@/examples/utils/loadGlMatrix.js'
async function onReady({ canvas, container, addUpdateCallback, resize }) {
  await loadGlMatrixModern('/webgl/study-webgl/libs/gl-matrix.js');
  // 定义 webgl 容器
          var webgl = null;
          // 定义 顶点数组
          var projMat4 = glMatrix.mat4.create();
          var uniformTexture = 0;
          var textureHandle;
  
          // 定义 顶点着色器 shader
          let vertexstring = `
          attribute vec4 a_position;
          uniform     mat4    proj;
          void main(void){
              gl_Position =proj *  a_position;
              gl_PointSize=64.0;
          }
          `;
  
          // 定义 片元着色器 shader 修改颜色
          let fragmentstring = `
          precision mediump float;
          uniform sampler2D texture;
          void main(void){
            vec4 color =texture2D(texture,gl_PointCoord);
            if(color.a < 0.1)
                  discard;
            gl_FragColor = color;
          }
          `;
  
          function init() {
              initWebgl();
              initShader();
              initBuffer();
              draw();
          }
  
          // 初始化webgl
          function initWebgl() {
              let webglDiv = canvas;
              // 通过容器获取上下文
              webgl = webglDiv.getContext("webgl");
              // 设置视口
              webgl.viewport(0, 0, webglDiv.clientWidth, webglDiv.clientHeight);
              // 设置投影矩阵
              glMatrix.mat4.ortho(projMat4, 0, webglDiv.clientWidth, webglDiv.clientHeight, 0, -1.0, 1.0)
          }
  
          // 初始化着色器，shader 供 gpu 使用的
          function initShader() {
              // 创建顶点着色器对象
              let vsshader = webgl.createShader(webgl.VERTEX_SHADER);
              // 创建片元着色器对象
              let fsshader = webgl.createShader(webgl.FRAGMENT_SHADER);
  
              // 引入顶点、片元着色器源代码
              webgl.shaderSource(vsshader, vertexstring);
              webgl.shaderSource(fsshader, fragmentstring);
  
              // 编译顶点、片元着色器
              webgl.compileShader(vsshader);
              webgl.compileShader(fsshader);
  
              // 检查编译是否成功
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
  
              // 创建程序对象
              let program = webgl.createProgram();
              // 附着顶点着色器和片元着色器到program
              webgl.attachShader(program, vsshader);
              webgl.attachShader(program, fsshader);
  
              // 链接程序对象
              webgl.linkProgram(program);
              // 使用program
              webgl.useProgram(program);
  
              // 将程序对象保存到 webgl 容器中
              webgl.program = program
          }
  
          // 初始化缓冲区
          function initBuffer() {
              let pointPosition = new Float32Array([100.0, 100.0, 0.0, 1.0, 100.0, 200.0, 0.0, 1.0, 200.0, 200.0, 0.0, 1.0]);
              let aPsotion = webgl.getAttribLocation(webgl.program, "a_position");
              let triangleBuffer = webgl.createBuffer();
              webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer);
              webgl.bufferData(webgl.ARRAY_BUFFER, pointPosition, webgl.STATIC_DRAW);
              webgl.enableVertexAttribArray(aPsotion);
              webgl.vertexAttribPointer(aPsotion, 4, webgl.FLOAT, false, 16, 0);
              let uniformProj = webgl.getUniformLocation(webgl.program, "proj");
              webgl.uniformMatrix4fv(uniformProj, false, projMat4);
  
              uniformTexture = webgl.getUniformLocation(webgl.program, "texture");
  
  
              webgl.enable(webgl.BLEND);
              webgl.blendFunc(webgl.SRC_ALPHA, webgl.ONE_MINUS_SRC_ALPHA);
  
              initTexture("/webgl/study-webgl/2-texture/images/point64.png");
  
          }
  
          function initTexture(imageFile) {
              // 创建纹理对象
              textureHandle = webgl.createTexture();
              textureHandle.image = new Image();
              textureHandle.image.src = imageFile;
              textureHandle.image.onload = function () {
                  handleLoadedTexture(textureHandle)
              }
  
          }
  
          // 绘制纹理
          function handleLoadedTexture(texture) {
              // 生成纹理
              webgl.bindTexture(webgl.TEXTURE_2D, texture);
              // 设置纹理参数
              webgl.texImage2D(webgl.TEXTURE_2D, 0, webgl.RGBA, webgl.RGBA, webgl.UNSIGNED_BYTE, texture.image);
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.NEAREST);
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.NEAREST);
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.REPEAT);
              webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.REPEAT);
              //因为异步原因所以要加在这里
              webgl.uniform1i(uniformTexture, 0);
              draw();
              // webgl.bindTexture(webgl.TEXTURE_2D, null);
          }
  
          // 绘制
          function draw() {
              // 清除颜色缓冲区
              webgl.clearColor(0.0, 0.0, 0.0, 1.0);
              // 清除深度缓冲区
              webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);
              webgl.enable(webgl.DEPTH_TEST);
              webgl.drawArrays(webgl.POINTS, 0, 3);
          }
  
  if (typeof init === 'function') {
    init()
  }
}
</script>

