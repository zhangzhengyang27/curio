<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
    @ready="onReady"
  />
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ssaaPass } from 'three/examples/jsm/tsl/display/SSAAPassNode.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  
  			let mesh, material, renderPipeline;
  
  			const amount = parseInt( window.location.search.slice( 1 ) ) || 3;
  			const count = Math.pow( amount, 3 );
  
  			const color = new THREE.Color();
  
  			const params = {
  				alpha: 0.5,
  				alphaHash: true
  			};
  
  			
  			async 
  
  
  				
  
  
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				const geometry = new THREE.IcosahedronGeometry( 0.5, 3 );
  
  				material = new THREE.MeshStandardMaterial( {
  					color: 0xffffff,
  					alphaHash: params.alphaHash,
  					opacity: params.alpha
  				} );
  
  				mesh = new THREE.InstancedMesh( geometry, material, count );
  
  				let i = 0;
  				const offset = ( amount - 1 ) / 2;
  
  				const matrix = new THREE.Matrix4();
  
  				for ( let x = 0; x < amount; x ++ ) {
  
  					for ( let y = 0; y < amount; y ++ ) {
  
  						for ( let z = 0; z < amount; z ++ ) {
  
  							matrix.setPosition( offset - x, offset - y, offset - z );
  
  							mesh.setMatrixAt( i, matrix );
  							mesh.setColorAt( i, color.setHex( Math.random() * 0xffffff ) );
  
  							i ++;
  
  						}
  
  					}
  
  				}
  
  				scene.add( mesh );
  
  				//
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				const environment = new RoomEnvironment();
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				scene.environment = pmremGenerator.fromScene( environment, 0.04 ).texture;
  				environment.dispose();
  
  				//
  
  				// postprocessing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				const scenePass = ssaaPass( scene, camera );
  				scenePass.sampleLevel = 3;
  
  				renderPipeline.outputNode = scenePass;
  
  				//
  
  				
  				controls.enableZoom = false;
  				controls.enablePan = false;
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  
  				gui.add( params, 'alpha', 0, 1 ).onChange( onMaterialUpdate );
  				gui.add( params, 'alphaHash' ).onChange( onMaterialUpdate );
  
  				const ssaaFolder = gui.addFolder( 'SSAA' );
  				ssaaFolder.add( scenePass, 'sampleLevel', 0, 4, 1 );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onMaterialUpdate() {
  
  				material.opacity = params.alpha;
  				material.alphaHash = params.alphaHash;
  				material.transparent = ! params.alphaHash;
  				material.depthWrite = params.alphaHash;
  
  				material.needsUpdate = true;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    renderPipeline.render();
  })
  
  		
}
</script>
