<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 45, near: 0.1, far: 200 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { pass, renderOutput } from 'three/tsl';
import { fxaa } from 'three/examples/jsm/tsl/display/FXAANode.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>FXAA</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			const params = {
  				enabled: true,
  				animated: false
  			};
  
  			let timer, group;
  			let renderPipeline;
  
  			
  
  
  				
  				camera.position.z = 50;
  
  				
  				scene.background = new THREE.Color( 0xffffff );
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				//
  
  				const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d );
  				hemiLight.position.set( 0, 1000, 0 );
  				scene.add( hemiLight );
  
  				const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  				dirLight.position.set( - 3000, 1000, - 1000 );
  				scene.add( dirLight );
  
  				//
  
  				group = new THREE.Group();
  
  				const geometry = new THREE.TetrahedronGeometry();
  				const material = new THREE.MeshStandardMaterial( { color: 0xf73232, flatShading: true } );
  
  				const mesh = new THREE.InstancedMesh( geometry, material, 100 );
  				const dummy = new THREE.Object3D();
  
  				for ( let i = 0; i < 100; i ++ ) {
  
  					dummy.position.x = Math.random() * 50 - 25;
  					dummy.position.y = Math.random() * 50 - 25;
  					dummy.position.z = Math.random() * 50 - 25;
  
  					dummy.scale.setScalar( Math.random() * 2 + 1 );
  
  					dummy.rotation.x = Math.random() * Math.PI;
  					dummy.rotation.y = Math.random() * Math.PI;
  					dummy.rotation.z = Math.random() * Math.PI;
  
  					dummy.updateMatrix();
  					mesh.setMatrixAt( i, dummy.matrix );
  
  				}
  
  				group.add( mesh );
  				scene.add( group );
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				// post processing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				// ignore default output color transform ( toneMapping and outputColorSpace )
  				// use renderOutput() for control the sequence
  
  				renderPipeline.outputColorTransform = false;
  
  				// scene pass
  
  				const scenePass = pass( scene, camera ).toInspector( 'Color' );
  				const outputPass = renderOutput( scenePass );
  
  				// FXAA must be computed in sRGB color space (so after tone mapping and color space conversion)
  
  				const fxaaPass = fxaa( outputPass );
  				renderPipeline.outputNode = fxaaPass;
  
  				//
  
  				
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( params, 'enabled' ).onChange( ( value ) => {
  			
  					if ( value === true ) {
  
  						renderPipeline.outputNode = fxaaPass;
  
  					} else {
  
  						renderPipeline.outputNode = outputPass;
  
  					}
  
  					renderPipeline.needsUpdate = true;
  
  				} );
  				gui.add( params, 'animated' );
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( params.animated === true ) {
    					group.rotation.y += delta * 0.1;
    				}
    				renderPipeline.render();
  })
  
  		
}
</script>
