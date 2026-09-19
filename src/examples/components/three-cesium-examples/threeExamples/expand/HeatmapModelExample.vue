<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[200, 200, 200]"
    alpha
    antialias
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import ExampleScene from '@/examples/components/ExampleScene.vue'

let _intervalId: any = null

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onBeforeDispose() {
  if (_intervalId) {
    clearInterval(_intervalId)
    _intervalId = null
  }
}

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  controls.enableDamping = true
  
  // 渲染
  
  class InterpolatedGradientMaterial extends THREE.ShaderMaterial {
      declare dataPointsLength: any
      constructor({
          dataPoints = [],
          dataValues = [],
          colorLow = new THREE.Color(0x0000FF),
          colorHigh = new THREE.Color(0xFF0000),
          minValue = 0,
          maxValue = 1,
          opacity = 1,
          weightFunction = 'inverse_square',
          smoothstepEdges = { min: 0.0, max: 1.0 }
      }: any = {}) {
          // 如果数据为空，填充假数据
          if (dataPoints.length === 0 || dataValues.length === 0) {
              console.warn("dataPoints and dataValues are empty. Using default fake data.")
              const fakeDataLength = 10 // 假数据长度
              dataPoints = Array.from({ length: fakeDataLength }, (_, i) => new THREE.Vector3(i, 0, 0)) // 填充简单的假数据
              dataValues = Array.from({ length: fakeDataLength }, (_, i) => i) // 填充简单的假数据
          }
  
          const vertexShader = /* glsl */`
              varying vec3 vPosition;
              void main() {
                  vPosition = position;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
          `
  
          const fragmentShader = /* glsl */`
              varying vec3 vPosition;
              uniform vec3 dataPoints[DATA_POINTS_LENGTH];
              uniform float dataValues[DATA_POINTS_LENGTH];
              uniform vec3 colorLow;
              uniform vec3 colorHigh;
              uniform float minValue;
              uniform float maxValue;
              uniform int weightFunctionType;
              uniform vec2 smoothstepEdges;
              uniform float opacity;
  
              vec3 rgb2hsv(vec3 c) {
                  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
                  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
                  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
                  float d = q.x - min(q.w, q.y);
                  float e = 1.0e-10;
                  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
              }
  
              vec3 hsv2rgb(vec3 c) {
                  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
              }
  
              float getWeight(float distance) {
                  if (weightFunctionType == 0) { // inverse
                      return 1.0 / distance;
                  } else if (weightFunctionType == 1) { // inverse square
                      return 1.0 / (distance * distance);
                  } else if (weightFunctionType == 2) { // exponential
                      return exp(-distance);
                  }
                  return 1.0 / (distance * distance); // default to inverse square
              }
  
              void main() {
                  float totalWeight = 0.0;
                  float weightedValue = 0.0;
                  for(int i = 0; i < DATA_POINTS_LENGTH; i++) {
                      float distance = length(vPosition - dataPoints[i]);
                      float weight = getWeight(distance);
                      totalWeight += weight;
                      weightedValue += dataValues[i] * weight;
                  }
                  float interpolatedValue = weightedValue / totalWeight;
                  float normalizedValue = (interpolatedValue - minValue) / (maxValue - minValue);
                  normalizedValue = smoothstep(smoothstepEdges.x, smoothstepEdges.y, normalizedValue);
  
                  vec3 hsvLow = rgb2hsv(colorLow);
                  vec3 hsvHigh = rgb2hsv(colorHigh);
                  vec3 hsvColor = mix(hsvLow, hsvHigh, normalizedValue);
                  vec3 color = hsv2rgb(hsvColor);
  
                  gl_FragColor = vec4(color, opacity);
              }
          `
  
          super({
              vertexShader,
              fragmentShader: fragmentShader.replace(/DATA_POINTS_LENGTH/g, dataPoints.length.toString()),
              uniforms: {
                  dataPoints: { value: dataPoints },
                  dataValues: { value: dataValues },
                  colorLow: { value: colorLow },
                  colorHigh: { value: colorHigh },
                  minValue: { value: minValue },
                  maxValue: { value: maxValue },
                  opacity: { value: opacity },
                  weightFunctionType: { value: ['inverse', 'inverse_square', 'exponential'].indexOf(weightFunction) },
                  smoothstepEdges: { value: new THREE.Vector2(smoothstepEdges.min, smoothstepEdges.max) }
              },
              transparent: true
          })
  
          this.dataPointsLength = dataPoints.length
      }
  
      updateData(dataPoints: any, dataValues: any) {
          if (dataPoints.length !== this.dataPointsLength) {
              console.warn('New data length does not match the original length. Shader recompilation required.')
              this.recompileShader(dataPoints.length)
          }
  
          this.uniforms.dataPoints.value = dataPoints
          this.uniforms.dataValues.value = dataValues
          this.uniformsNeedUpdate = true
      }
  
      recompileShader(newLength: any) {
          const newFragmentShader = this.fragmentShader.replace(
              new RegExp(this.dataPointsLength.toString(), 'g'),
              newLength.toString()
          )
          this.fragmentShader = newFragmentShader
          this.needsUpdate = true
          this.dataPointsLength = newLength
  
          // 重新创建 uniforms
          this.uniforms.dataPoints.value = new Array(newLength).fill(new THREE.Vector3())
          this.uniforms.dataValues.value = new Array(newLength).fill(0)
      }
  }
  
  // 加载模型
  new OBJLoader().load(
  
      props.example?.globals?.FILE_HOST + 'files/model/z2586300277.obj',
  
      (obj) => {
  
          const box3 = new THREE.Box3().setFromObject(obj)
  
          const material = setHeat(box3)
  
          obj.traverse((child) => {
  
              if (child instanceof THREE.Mesh) {
  
                  child.material = material
  
              }
  
          })
  
          scene.add(obj)
  
      }
  
  )
  
  function setHeat(box3: any) {
  
      // 定义数据点和数据值
      const dataPoints: any[] = []
      const dataValues: any[] = []
  
      const getPoint = () => new THREE.Vector3(  
  
          Math.random() * (box3.max.x - box3.min.x) + box3.min.x,
  
          Math.random() * (box3.max.y - box3.min.y) + box3.min.y,
  
          Math.random() * (box3.max.z - box3.min.z) + box3.min.z
  
      )
  
      // 在box3 的范围内随机生成点
      for (let i = 0; i < 20; i++) {
  
          dataPoints.push(getPoint())
  
          dataValues.push(Math.random())
  
      }
  
      // 创建自定义材质
      const material = new InterpolatedGradientMaterial({
          dataPoints: dataPoints,
          dataValues: dataValues,
          colorLow: new THREE.Color(0x0000FF),  // 蓝色
          colorHigh: new THREE.Color(0xFF0000), // 红色
          minValue: 0,
          maxValue: 1,
          opacity: 0.8,
          weightFunction: 'inverse_square',
          smoothstepEdges: { min: 0.0, max: 1.0 }
      });
  
      _intervalId = setInterval(() => {

          dataPoints.pop()

          dataPoints.unshift(getPoint())

          dataValues.pop()

          dataValues.unshift(Math.random())

          material.updateData(dataPoints, dataValues)

      }, 200)
  
      // GUI 控制
      const materialFolder = new GUI();
  
      const colorLowDebug = { value: '#0000ff' }
      materialFolder
          .addColor(colorLowDebug, "value")
          .name("Color Low")
          .onChange((v) => {
              material.uniforms.colorLow.value.set(v)
          });
      const colorHighDebug = { value: '#ff0000' }
      materialFolder
          .addColor(colorHighDebug, "value")
          .name("Color High")
          .onChange((v) => {
              material.uniforms.colorHigh.value.set(v)
          });
      materialFolder
          .add(material.uniforms.minValue, "value", 0, 1)
          .name("Min Value");
      materialFolder
          .add(material.uniforms.maxValue, "value", 0, 1)
          .name("Max Value");
      materialFolder
          .add(material.uniforms.weightFunctionType, "value", {
              Inverse: 0,
              "Inverse Square": 1,
              Exponential: 2,
          })
          .name("Weight Function")
          .onChange((value) => {
              material.uniforms.weightFunctionType.value = parseInt(value, 10);
          });
      materialFolder
          .add(material.uniforms.smoothstepEdges.value, "x", 0, 1)
          .name("Smoothstep Min");
      materialFolder
          .add(material.uniforms.smoothstepEdges.value, "y", 0, 1)
          .name("Smoothstep Max");
  
      return material
  
  }
}
</script>
