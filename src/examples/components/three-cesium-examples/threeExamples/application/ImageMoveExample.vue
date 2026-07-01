<template>
  <ExampleScene
    camera="perspective"
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three';
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

  const [w, h] = [innerWidth, innerHeight]
  camera.position.z = 3;
  
  const loader = new THREE.TextureLoader()
  const urls = [
      props.example?.globals?.FILE_HOST + 'images/wx_star.png',
      props.example?.globals?.FILE_HOST + 'images/QQ.png',
      props.example?.globals?.FILE_HOST + 'images/nico.jpg',
  ]
  const tex = urls.map(u => loader.load(u));
  tex[2].wrapS = tex[2].wrapT = THREE.RepeatWrapping; tex[2].repeat.set(.1, .1);
  
  function R(g, t) {
      const m = new THREE.MeshMatcapMaterial({ matcap: t, transparent: true });
      m.onBeforeCompile = sh => {
          sh.vertexShader = sh.vertexShader
              .replace('#include <common>', `\n#include <common>\nvarying vec2 vUv;`)
              .replace('#include <fog_vertex>', `\n#include <fog_vertex>\nvUv=uv;`);
          sh.fragmentShader = sh.fragmentShader
              .replace('#include <common>', `\n#include <common>\nvarying vec2 vUv;\nfloat sdf(vec2 c,vec2 s,float r){return length(max(abs(c)-s+r,0.0))-r;}`)
              .replace('#include <dithering_fragment>', `\n#include <dithering_fragment>\nfloat d=sdf(vUv-vec2(.5),vec2(.5),.08);\nfloat a=1.-smoothstep(0.,.002,d);\ngl_FragColor=vec4(outgoingLight,a);`);
      };
      return new THREE.Mesh(g, m);
  }
  
  const scale = 1.25;
  const g = new THREE.PlaneGeometry(1 * scale, 1.4 * scale);
  const group = new THREE.Group();
  [[-1, 0, 1, .1], [0, 0, .5, 0], [1, 0, 1, -.1]].forEach((p, i) => {
      const m = R(g, tex[i]);
      m.position.set(p[0] * scale, p[1] * scale, p[2] * scale);
      if (p[3]) m.rotation.y = Math.PI * p[3];
      group.add(m);
  });
  scene.add(group);
  
  const mouse = new THREE.Vector2(), clock = new THREE.Clock();
  addEventListener('mousemove', e => { mouse.x = (e.clientX / w) * 2 - 1; mouse.y = -(e.clientY / h) * 2 + 1 });
}
</script>
