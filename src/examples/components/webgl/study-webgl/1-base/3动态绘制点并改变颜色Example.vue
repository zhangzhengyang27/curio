<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { loadGlMatrixLegacy } from '@/examples/utils/loadGlMatrix.js'
async function onReady({ canvas, container, addUpdateCallback, resize }) {
  await loadGlMatrixLegacy("/webgl/study-webgl/libs/glMatrix-0.9.6.min.js");
  // 定义 webgl 容器
          var webgl = null;
          // 定义 顶点数组
          var projMat4 = mat4.create();
  
          // 定义 顶点着色器 shader
          let vertexstring = `
          attribute vec3 a_position;
          uniform     mat4    proj;
          attribute vec3 a_color;
          varying vec3 inColor;
          void main(void){
              gl_Position = vec4(a_position,1.0)  ;
              gl_PointSize=60.0;
              inColor = a_color;
          }
          `;
          // 定义 片元着色器 shader 修改颜色
          let fragmentstring = `
         //  精度
         precision mediump float;
         varying vec3 inColor;
          void main(void){
            gl_FragColor = vec4(inColor,1.0);
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
              mat4.ortho(0, webglDiv.clientWidth, webglDiv.clientHeight, 0, -1.0, 1.0, projMat4)
          }
  
          // 初始化着色器，shader 供 gpu 使用的
          function initShader() {
              // 定义 shader 容器对象 (顶点、片元)
              let vsshader = webgl.createShader(webgl.VERTEX_SHADER);
              let fsshader = webgl.createShader(webgl.FRAGMENT_SHADER);
  
              // 将 shader 代码注入到容器中
              webgl.shaderSource(vsshader, vertexstring);
              webgl.shaderSource(fsshader, fragmentstring);
  
              // 编译 shader
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
              // 将 shader 注入到程序对象中
              webgl.attachShader(program, vsshader);
              webgl.attachShader(program, fsshader);
  
              // 链接程序对象
              webgl.linkProgram(program);
              // 检查链接是否成功
              webgl.useProgram(program);
  
              // 将程序对象保存到 webgl 容器中
              webgl.program = program
          }
  
          var points = [];
          var colors = [];
  
          // 初始化缓冲区
          function initBuffer() {
              // 创建缓冲区对象 获取 a_position 的位置
              let aPsotion = webgl.getAttribLocation(webgl.program, "a_position");
              let aColor = webgl.getAttribLocation(webgl.program, "a_color");
  
              document.addEventListener("mousedown", function (e) {
                  let x = e.clientX;
                  let y = e.clientY;
                  // 获取 canvas 的位置
                  // getBoundingClientRect() 返回一个 DOMRect 对象，提供有关元素大小及其相对于 视区 的位置的信息。
  
                  // 坐标转换 ，将直角坐标转换为 webgl 坐标
                  let rect = e.target.getBoundingClientRect();
                  let pointx = ((x - rect.left) - 512) / 512;
                  let pointy = (350 - (y - rect.top)) / 350;
                  points.push(pointx);
                  points.push(pointy);
                  points.push(0);
                  // 判断点的位置
                  if (pointx > 0 && pointy > 0) {
                      colors.push(1.0);
                      colors.push(0.0);
                      colors.push(0.0);
                  } else if (pointx < 0 && pointy > 0) {
                      colors.push(0.0);
                      colors.push(1.0);
                      colors.push(0.0);
                  } else if (pointx < 0 && pointy < 0) {
                      colors.push(0.0);
                      colors.push(0.0);
                      colors.push(1.0);
                  } else {
                      colors.push(0.0);
                      colors.push(1.0);
                      colors.push(1.0);
                  }
  
                  // 绑定位置
                  let pointPosition = new Float32Array(points);
                  // 创建缓冲区对象
                  let pointBuffer = webgl.createBuffer();
                  // 绑定缓冲区对象
                  webgl.bindBuffer(webgl.ARRAY_BUFFER, pointBuffer);
                  webgl.bufferData(webgl.ARRAY_BUFFER, pointPosition, webgl.STATIC_DRAW);
                  // 开启缓冲区对象
                  webgl.enableVertexAttribArray(aPsotion);
                  // 将缓冲区对象传入到着色器中
                  webgl.vertexAttribPointer(aPsotion, 3, webgl.FLOAT, false, 0, 0);
  
                  // 绑定颜色
                  let pointColor = new Float32Array(colors);
                  let pointColorBuffer = webgl.createBuffer();
                  webgl.bindBuffer(webgl.ARRAY_BUFFER, pointColorBuffer);
                  webgl.bufferData(webgl.ARRAY_BUFFER, pointColor, webgl.STATIC_DRAW);
                  webgl.enableVertexAttribArray(aColor);
                  webgl.vertexAttribPointer(aColor, 3, webgl.FLOAT, false, 0, 0);
  
  
                  // 清除颜色缓冲区
                  webgl.clearColor(0.0, 0.0, 0.0, 1.0);
                  // 清除深度缓冲区
                  webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);
                  // 绘制点 从第一个点开始绘制、绘制点的个数
                  webgl.drawArrays(webgl.POINTS, 0, points.length / 3);
              })
  
              // 获取投影矩阵的位置
              let uniformProj = webgl.getUniformLocation(webgl.program, "proj");
              // 将投影矩阵传入到着色器中  false 是否转秩
              webgl.uniformMatrix4fv(uniformProj, false, projMat4);
          }
  
          // 绘制
          function draw() {
              // 清除颜色缓冲区
              webgl.clearColor(0.0, 0.0, 0.0, 1.0);
              // 清除深度缓冲区
              webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);
              // 绘制点 0 从第一个点开始绘制 1 绘制一个点
              // webgl.drawArrays(webgl.POINTS, 0, 1);
          }
  
  if (typeof init === 'function') {
    init()
  }
}
</script>

