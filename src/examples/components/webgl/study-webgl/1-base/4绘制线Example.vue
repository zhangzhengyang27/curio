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
  
          // 定义 顶点着色器 shader
          let vertexstring = `
          attribute vec3 a_position;
          uniform  mat4  proj;
          void main(void){
              gl_Position = proj*vec4(a_position,1.0)  ;
              gl_PointSize=60.0;
          }
          `;
  
          // 定义 片元着色器 shader 修改颜色
          let fragmentstring = `
          precision mediump float;
          void main(void){
            gl_FragColor = vec4(0.0,0.0,1.0,1.0);
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
              webgl = webglDiv.getContext("webgl")!;
              // 设置视口
              webgl.viewport(0, 0, webglDiv.clientWidth, webglDiv.clientHeight);
              // 设置投影矩阵
              glMatrix.mat4.ortho(projMat4, 0, webglDiv.clientWidth, webglDiv.clientHeight, 0, -1.0, 1.0)
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
              (webgl as any).program = program
          }
  
          var points: any[] = [];
          var colors: any[] = [];
          // 初始化缓冲区
          function initBuffer() {
              // 创建缓冲区对象 获取 a_position 的位置
              let aPsotion = webgl.getAttribLocation((webgl as any).program, "a_position");
              // 顶点坐标  三个数构成一个坐标() vec3
              let arr = [100.0, 100.0, 0, 200.0, 200.0, 0, 300.0, 200.0, 0, 400, 600, 0];
  
              let vertexArr = new Float32Array(arr);
              let trangleBuffer = webgl.createBuffer();
  
              webgl.bindBuffer(webgl.ARRAY_BUFFER, trangleBuffer);
              webgl.bufferData(webgl.ARRAY_BUFFER, vertexArr, webgl.STATIC_DRAW);
              // 开启缓冲区
              webgl.enableVertexAttribArray(aPsotion);
              webgl.vertexAttribPointer(aPsotion, 3, webgl.FLOAT, false, 0, 0);
  
              // 获取投影矩阵的位置
              let uniformProj = webgl.getUniformLocation((webgl as any).program, "proj");
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
              // webgl.drawArrays(webgl.LINES, 0, 4);
              // webgl.drawArrays(webgl.LINE_STRIP,0,4)
              webgl.drawArrays(webgl.LINE_LOOP,0,4)
          }
  
  if (typeof init === 'function') {
    init()
  }
}
</script>

