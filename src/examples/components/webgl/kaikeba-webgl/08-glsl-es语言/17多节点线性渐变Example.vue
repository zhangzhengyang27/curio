<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { initShaders } from '@/examples/jsm-compat/webgl/kaikeba-webgl/08-GlSl ES语言/jsm/Utils.js'
import Poly from '@/examples/jsm-compat/webgl/kaikeba-webgl/08-GlSl ES语言/jsm/Poly.js'
const vertexShader = `attribute vec4 a_Position;
    void main(){
      gl_Position=a_Position;
    }`

const fragmentShader = `precision mediump float;
    uniform vec2 u_CanvasSize;
    //起始位
    vec2 u_Start=vec2(100,100);
    //结束位
    vec2 u_End=vec2(700,700);
    //节点颜色集合
    vec4 colors[3];
    //节点位置集合
    float ratios[3];

    //终点减起点向量
    vec2 se=u_End-u_Start;
    //长度
    float seLen=length(se);
    //单位向量
    vec2 se1=normalize(se);

    //获取片元颜色
    vec4 getColor(vec4 colors[3],float ratios[3]){
        //片元颜色
        vec4 color=vec4(1);
        //当前片元减起始片元的向量
        vec2 sf=vec2(gl_FragCoord)-u_Start;
        //当前片元在se上的投影长度
        float fsLen=clamp(dot(sf,se1),0.0,seLen);
        //长度比
        float ratio=clamp(fsLen/seLen,ratios[0],ratios[3-1]);
        //第一个比值
        float ratio1=ratios[0];
        //第一个颜色
        vec4 color1=colors[0];
        //遍历节点，按比值取色
        for(int i=1;i<3;i++){
            //第二个比值
            float ratio2=ratios[i];
            //第二个颜色
            vec4 color2=colors[i];
            if(ratio>=ratio1&&ratio<=ratio2){
                //一段颜色的差值
                vec4 color2_1=color2-color1;
                //当前比值在一段比值中的比值
                float ratioInRatio=(ratio-ratio1)/(ratio2-ratio1);
                //当前比值在当前颜色段中所对应的颜色
                color=color1+color2_1*ratioInRatio;
                break;
            }
            ratio1=ratio2;
            color1=color2;
        }
        return color;
    }

    void main(){
      colors[0]=vec4(1,0,0,1);
      colors[1]=vec4(1,1,0,1);
      colors[2]=vec4(0,1,0,1);
      ratios[0]=0.0;
      ratios[1]=0.5;
      ratios[2]=1.0;
      gl_FragColor=getColor(colors,ratios);
    }`

async function onReady({ canvas, container, addUpdateCallback, resize }) {
  
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      // 获取着色器文本
      const vsSource = vertexShader;
      const fsSource = fragmentShader;
  
      //三维画笔
      const gl = canvas.getContext("webgl");
  
      //初始化着色器
      initShaders(gl, vsSource, fsSource);
  
      //声明颜色 rgba
      gl.clearColor(0, 0, 0, 1);
  
      const source = new Float32Array([
        -1, 1,
        -1, -1,
        1, 1,
        1, -1
      ]);
  
      const rect = new Poly({
        gl,
        source,
        type: 'TRIANGLE_STRIP',
        attributes: {
          a_Position: {
            size: 2,
            index: 0
          }
        },
        uniforms: {
          u_CanvasSize: {
            type: 'uniform2fv',
            value: [canvas.width, canvas.height]
          }
        }
      })
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      rect.draw()
}
</script>

<style scoped>
.webgl-example-scene {
      margin: 0;
      overflow: hidden;
    }

    .webgl-example-canvas {
      background-color: antiquewhite;
    }
</style>
