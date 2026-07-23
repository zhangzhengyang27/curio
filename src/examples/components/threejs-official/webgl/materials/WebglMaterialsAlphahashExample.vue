<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
    custom-render
    @ready="onReady"
  />
</template>

<script setup>
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { TAARenderPass } from 'three/examples/jsm/postprocessing/TAARenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

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
  const controls = __stage.controls
  

  
  
  
  
  
  			let stats, mesh, material;
  
  			let composer, renderPass, taaRenderPass, outputPass;
  
  			let needsUpdate = false;
  
  			const amount = parseInt( window.location.search.slice( 1 ) ) || 3;
  			const count = Math.pow( amount, 3 );
  
  			const color = new THREE.Color();
  
  			const params = {
  				alpha: 0.5,
  				alphaHash: true,
  				taa: true,
  				sampleLevel: 2,
  			};
  
  			
  
  
  				
  
  
  
  				
  
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
  
  				
  
  
  				//
  
  				const environment = new RoomEnvironment();
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				scene.environment = pmremGenerator.fromScene( environment, 0.04 ).texture;
  				environment.dispose();
  
  				//
  
  				composer = new EffectComposer( renderer );
  
  				renderPass = new RenderPass( scene, camera );
  				renderPass.enabled = false;
  
  				taaRenderPass = new TAARenderPass( scene, camera );
  
  				outputPass = new OutputPass();
  
  				composer.addPass( renderPass );
  				composer.addPass( taaRenderPass );
  				composer.addPass( outputPass );
  
  				//
  
  				
  				controls.enableZoom = false;
  				controls.enablePan = false;
  
  				controls.addEventListener( 'change', () => ( needsUpdate = true ) );
  
  				//
  
  				gui = new GUI();
  
  				gui.add( params, 'alpha', 0, 1 ).onChange( onMaterialUpdate );
  				gui.add( params, 'alphaHash' ).onChange( onMaterialUpdate );
  
  				const taaFolder = gui.addFolder( 'Temporal Anti-Aliasing' );
  
  				taaFolder.add( params, 'taa' ).name( 'enabled' ).onChange( () => {
  
  					renderPass.enabled = ! params.taa;
  					taaRenderPass.enabled = params.taa;
  
  					sampleLevelCtrl.enable( params.taa );
  
  					needsUpdate = true;
  
  				} );
  
  				const sampleLevelCtrl = taaFolder.add( params, 'sampleLevel', 0, 6, 1 ).onChange( () => ( needsUpdate = true ) );
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  			
  
  
  			
  
  			function onMaterialUpdate() {
  
  				material.opacity = params.alpha;
  				material.alphaHash = params.alphaHash;
  				material.transparent = ! params.alphaHash;
  				material.depthWrite = params.alphaHash;
  
  				material.needsUpdate = true;
  				needsUpdate = true;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    if ( needsUpdate ) {
    					taaRenderPass.accumulate = false;
    					taaRenderPass.sampleLevel = 0;
    					needsUpdate = false;
    				} else {
    					taaRenderPass.accumulate = true;
    					taaRenderPass.sampleLevel = params.sampleLevel;
    				}
    				composer.render();
    }
    				stats.update();
  })
  
  			function render() {
  
  				if ( needsUpdate ) {
  
  					taaRenderPass.accumulate = false;
  					taaRenderPass.sampleLevel = 0;
  
  					needsUpdate = false;
  
  				} else {
  
  					taaRenderPass.accumulate = true;
  					taaRenderPass.sampleLevel = params.sampleLevel;
  
  				}
  
  				composer.render();
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
