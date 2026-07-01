<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 4, 4]"
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
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

  scene.background = new THREE.Color('gainsboro');
  
  controls.enableDamping = true;
  controls.autoRotate = true;
  
  var light = new THREE.DirectionalLight('white', 3);
  light.position.set(1, 1, 1);
  scene.add(light);
  
  // next comment
  
  // a texture with isolines
  var canvas = document.createElement('CANVAS');
  canvas.width = 16;
  canvas.height = 128;
  
  var context = canvas.getContext('2d');
  context.fillStyle = 'royalblue';
  context.fillRect(0, 0, 16, 128);
  context.fillStyle = 'white';
  context.fillRect(0, 0, 16, 6);
  
  var isoTexture = new THREE.CanvasTexture(canvas);
  isoTexture.repeat.set(1, 10);
  isoTexture.wrapS = THREE.RepeatWrapping;
  isoTexture.wrapT = THREE.RepeatWrapping;
  
  // some terrain with simlex noise
  // reference https://codepen.io/boytchev/full/gOQQRLd
  var geometry = new THREE.PlaneGeometry(6, 4, 150, 100),
      pos = geometry.getAttribute('position'),
      uv = geometry.getAttribute('uv'),
      simplex = new SimplexNoise();
  
  for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i),
          y = pos.getY(i),
          z = 0.4 * simplex.noise(x, y);
  
      pos.setZ(i, z);
      uv.setXY(i, 0, z);
  }
  
  geometry.computeVertexNormals();
  
  var terrain = new THREE.Mesh(
      geometry,
      new THREE.MeshPhysicalMaterial({
          roughness: 0.5,
          metalness: 0.2,
          side: THREE.DoubleSide,
          map: isoTexture,
      })
  );
  terrain.rotation.x = -Math.PI / 2;
  scene.add(terrain);
  function animationLoop() {
      controls.update();
      light.position.copy(camera.position);
  }
  // test robot test robot test
}
</script>
