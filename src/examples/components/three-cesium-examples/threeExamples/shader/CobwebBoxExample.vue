<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 5]"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  /* 顶点着色器 */
  const vertexShader = `
  varying vec2 vUv;
  void main(){
  	vec4 mPosition=modelMatrix*vec4(position,1.);
  	gl_Position=projectionMatrix*viewMatrix*mPosition;
  	vUv = uv;
  }`
  
  /* 片元着色器 */
  const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  
  void main(){
    vec2 uv=vUv;
    uv-=.5;
    float r=length(uv);// 极径
    float a=atan(uv.x,uv.y);// 极角
    // a += u_time; // 旋转
    vec2 puv=vec2(a,r);// 转换为极坐标 puv.x 范围是 -pi ~ pi
    puv=vec2(puv.x/6.2831+.5,puv.y);// puv.x 范围是 0 ~ 1
    
    vec3 color=vec3(.0);
    // 圆圈
    float circular=fract(puv.y*12.);
    circular=smoothstep(.09,0.,circular);
    // 线
    float line=fract(puv.x*8.);
    line*=1.-line;
    line=line*3.;
    line=smoothstep(.05,0.,line);
    
    line+=circular;
    // line *= step(puv.y,0.5);
    line*=smoothstep(.0,.1,abs(puv.y ));
    color+=line;
    color-=smoothstep(.3,.5,abs(uv.y))+smoothstep(.3,.5,abs(uv.x));
  
    color *=vec3(0.08, 0.93, 0.11);
    gl_FragColor=vec4(color,1.);
  }`
  
  // 自定义材质
  const material = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader,
    vertexShader: vertexShader,
    uniforms: {
      uTime: { value: 0 },
    },
    // side: THREE.DoubleSide,
  })
  
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const mesh = new THREE.Mesh(geometry, material) //网格模型对象Mesh
  
  scene.add(mesh)
  
  ctx.addUpdateCallback(() => {
    mesh.rotation.x += 0.02
        mesh.rotation.y += 0.02
        material.uniforms.uTime.value += 0.03
  })
}
</script>
