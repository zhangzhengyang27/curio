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
          var vertexstring = `
          uniform mat4 proj;
          attribute vec3 a_position;
          uniform float angle;
          void main(){
              gl_Position =vec4(a_position.x*cos(angle)-a_position.y*sin(angle),a_position.x*sin(angle)+a_position.y*cos(angle),0,1.0);
          }
          `;
  
          // 定义 片元着色器 shader 修改颜色
          var fragmentstring = `
          precision mediump float;
          void main(){
              gl_FragColor=vec4(0.0,0.0,1.0,1.0);
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
              // 创建缓冲区对象 获取 a_position 的位置
              let aPsotion = webgl.getAttribLocation(webgl.program, "a_position");
              // 顶点坐标
              let arr = [
                  0.100, 0.400, 0,
                  0.100, 0.500, 0,
                  0.200, 0.400, 0,]
  
              let vertexArr = new Float32Array(arr);
              // 创建缓冲区
              let trangleBuffer = webgl.createBuffer();
              // 绑定缓冲区    ARRAY_BUFFER 顶点缓冲区
              webgl.bindBuffer(webgl.ARRAY_BUFFER, trangleBuffer);
              // 将数据写入缓冲区
              webgl.bufferData(webgl.ARRAY_BUFFER, vertexArr, webgl.STATIC_DRAW);
              // 允许数据传递
              webgl.enableVertexAttribArray(aPsotion);
              //缓冲区中的数据按照一定的规律传递给位置变量 aPosition
              webgl.vertexAttribPointer(aPsotion, 3, webgl.FLOAT, false, 3 * 4, 0);
  
              // 获取投影矩阵的位置
              let uniformProj = webgl.getUniformLocation(webgl.program, "proj");
              // 将投影矩阵传入到着色器中  false 是否转秩
              webgl.uniformMatrix4fv(uniformProj, false, projMat4);
  
              let u_angle = webgl.getUniformLocation(webgl.program, "angle");
              // 手动控制角度
              let angle = 90 * Math.PI / 180;
              webgl.uniform1f(u_angle, angle);
          }
  
          // 绘制
          function draw() {
              // 清除颜色缓冲区
              webgl.clearColor(0.0, 0.0, 0.0, 1.0);
              // 清除深度缓冲区
              webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);
              webgl.enable(webgl.DEPTH_TEST);
              webgl.drawArrays(webgl.TRIANGLES, 0, 3)
          }
  
  if (typeof init === 'function') {
    init()
  }
}
</script>

