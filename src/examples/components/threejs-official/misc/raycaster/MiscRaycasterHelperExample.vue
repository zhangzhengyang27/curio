<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three/webgpu';
import { RaycasterHelper } from 'https://cdn.jsdelivr.net/npm/@gsimone/three-raycaster-helper@0.1.0/dist/gsimone-three-raycaster-helper.esm.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - raycaster - helper<br/>\n\t\t\tSee external <a href=\"https://github.com/gsimone/things?tab=readme-ov-file#raycasterhelper\" target=\"_blank\" rel=\"noopener\">RaycasterHelper</a> for more information."
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let capsule1, capsule2, capsule3;
  			let raycaster, raycasterHelper;
  
  			
  
  
  				
  
  
  				//
  
  				
  				camera.position.z = 10;
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				//
  
  				const geometry = new THREE.CapsuleGeometry( 0.5, 0.5, 4, 32 );
  				const material = new THREE.MeshNormalMaterial();
  				material.side = THREE.DoubleSide;
  
  				capsule1 = new THREE.Mesh( geometry, material );
  				capsule1.position.x = - 2;
  				capsule2 = new THREE.Mesh( geometry, material );
  				capsule2.position.x = 0;
  				capsule3 = new THREE.Mesh( geometry, material );
  				capsule3.position.x = 2;
  
  				scene.add( capsule1 );
  				scene.add( capsule2 );
  				scene.add( capsule3 );
  
  				raycaster = new THREE.Raycaster( new THREE.Vector3( - 4, 0, 0 ), new THREE.Vector3( 1, 0, 0 ) );
  				raycaster.near = 1;
  				raycaster.far = 8;
  				raycasterHelper = new RaycasterHelper( raycaster );
  				scene.add( raycasterHelper );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function animate( time ) {
  
  				const elapsedTime = time / 1000; // ms to s
  
  				[ capsule1, capsule2, capsule3 ].forEach( capsule => {
  
  					capsule.position.y = Math.sin( elapsedTime * 0.5 + capsule.position.x );
  					capsule.rotation.z = Math.sin( elapsedTime * 0.5 ) * Math.PI * 1;
  
  				} );
  
  				raycasterHelper.hits = raycaster.intersectObjects( scene.children );
  				raycasterHelper.update();
  
  
  
  			}
  
  		
}
</script>
