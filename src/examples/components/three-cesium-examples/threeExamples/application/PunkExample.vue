<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[-1, 0.5, 1]"
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three';
import { BoxGeometry, MeshLambertMaterial, Mesh, CanvasTexture, MeshBasicMaterial, Clock, CylinderGeometry, MathUtils, RepeatWrapping } from 'three';
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(stageCtx) {
  const scene = stageCtx.scene
  const camera = stageCtx.camera
  const renderer = stageCtx.renderer
  const controls = stageCtx.controls

  function animationLoop() {
  }
  
  controls.target.set(0, 12, 0);
  
  controls.update();
  controls.enableDamping = true;
  controls.autoRotate = true;
  
  var light = new THREE.DirectionalLight('white', 3);
  light.position.set(1, 1, 1);
  scene.add(light);

  stageCtx.addUpdateCallback(() => {
    let g = new BoxGeometry();
        g.translate(0, 0.5, 0);
        let m = new MeshLambertMaterial({ color: 0x7f7f7f });
        for (let z = -5; z < 5; z++) {
            for (let x = -5; x < 5; x++) {
                let o = new Mesh(g, m);
                o.position.set(x, 0, z).multiplyScalar(4);
                o.rotation.y = Math.random() * Math.PI;
                let posLen = o.position.length();
                let posScale = 1 - MathUtils.clamp(posLen / 50, 0, 1);
                posScale = Math.pow(posScale, 4);
                o.scale.set(MathUtils.randInt(1, 4), 1 + Math.floor(Math.random() * posScale * 75), MathUtils.randInt(1, 4));
                if (posLen <= 25) {
                    scene.add(o);
                }
            }
        }
        let cnvTexture;
        function create_ring_letter() {
            let cnv = document.createElement('canvas');
            cnv.width = 1024;
            cnv.height = 128;
const ctx = cnv.getContext("2d");
            ctx.fillStyle = 'magenta';
            ctx.fillRect(0, 0, cnv.width, cnv.height);
            ctx.clearRect(0, 10, cnv.width, cnv.height - 20);
            ctx.textBaseline = 'middle';
            ctx.textAlign = "center";
            ctx.fillStyle = 'aqua';
            ctx.font = "bold 80px Arial";
            ctx.fillText("Welcome to Nico Space", cnv.width * 0.5, cnv.height * 0.5);
            cnvTexture = new CanvasTexture(cnv);
            cnvTexture.wrapS = RepeatWrapping;
            cnvTexture.wrapT = RepeatWrapping;
            cnvTexture.repeat.set(3, 1);
            let gc = new CylinderGeometry(25, 25, 5, 72, 1, true);
            const material = new MeshBasicMaterial({ alphaTest: 0.5, side: 2, map: cnvTexture });
            const mesh = new Mesh(gc, material);
            mesh.position.y = 25;
            scene.add(mesh);
        }
        create_ring_letter();
        let clock = new Clock();
        function animate() {
            let t = clock.getDelta();
            cnvTexture.offset.x += t * 0.125;
        }
  
  })
}
</script>
