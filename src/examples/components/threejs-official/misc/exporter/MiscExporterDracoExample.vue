<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[4, 2, 4]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DRACOExporter } from 'three/examples/jsm/exporters/DRACOExporter.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - exporter - draco"
async function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let exporter, mesh;
  
  			const params = {
  				export: exportFile
  			};
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0xa0a0a0 );
  				scene.fog = new THREE.Fog( 0xa0a0a0, 4, 20 );
  
  				exporter = new DRACOExporter();
  
  				//
  
  				const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 3 );
  				hemiLight.position.set( 0, 20, 0 );
  				scene.add( hemiLight );
  
  				const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
  				directionalLight.position.set( 0, 20, 10 );
  				directionalLight.castShadow = true;
  				directionalLight.shadow.camera.top = 2;
  				directionalLight.shadow.camera.bottom = - 2;
  				directionalLight.shadow.camera.left = - 2;
  				directionalLight.shadow.camera.right = 2;
  				scene.add( directionalLight );
  
  				// ground
  
  				const ground = new THREE.Mesh( new THREE.PlaneGeometry( 40, 40 ), new THREE.MeshPhongMaterial( { color: 0xbbbbbb, depthWrite: false } ) );
  				ground.rotation.x = - Math.PI / 2;
  				ground.receiveShadow = true;
  				scene.add( ground );
  
  				const grid = new THREE.GridHelper( 40, 20, 0x000000, 0x000000 );
  				grid.material.opacity = 0.2;
  				grid.material.transparent = true;
  				scene.add( grid );
  
  				// export mesh
  
  				const geometry = new THREE.TorusKnotGeometry( 0.75, 0.2, 200, 30 );
  				const material = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
  				mesh = new THREE.Mesh( geometry, material );
  				mesh.castShadow = true;
  				mesh.position.y = 1.5;
  				scene.add( mesh );
  
  				//
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  
  
  				//
  
  
  				controls.target.set( 0, 1.5, 0 );
  				controls.update();
  
  				//
  
  				
  
  				const gui = new GUI();
  
  				gui.add( params, 'export' ).name( 'Export DRC' );
  				gui.open();
  
  
  			
  
  
  			
  
  			function animate() {
  
  
  
  			}
  
  			async function exportFile() {
  
  				const result = await exporter.parseAsync( mesh );
  				saveArrayBuffer( result, 'file.drc' );
  
  			}
  
  			const link = document.createElement( 'a' );
  			link.style.display = 'none';
  			document.body.appendChild( link );
  
  			function save( blob, filename ) {
  
  				link.href = URL.createObjectURL( blob );
  				link.download = filename;
  				link.click();
  
  			}
  
  			function saveArrayBuffer( buffer, filename ) {
  
  				save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
  
  			}
  
  		
}
</script>
