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
import { float, int, pass, uniform } from 'three/tsl';
import { radialBlur } from 'three/examples/jsm/tsl/display/radialBlur.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Radial Blur</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			const params = {
  				enabled: true,
  				animated: true
  			};
  
  			let timer, group;
  			let renderPipeline;
  
  			
  
  
  				
  				camera.position.z = 50;
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				timer = new THREE.Timer();
  
  				//
  
  				const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d );
  				hemiLight.position.set( 0, 1000, 0 );
  				scene.add( hemiLight );
  
  				const pointLight = new THREE.PointLight( 0xffffff, 1000 );
  				pointLight.position.set( 0, 0, 0 );
  				scene.add( pointLight );
  
  				//
  
  				group = new THREE.Group();
  
  				const geometry = new THREE.TetrahedronGeometry();
  				const material = new THREE.MeshStandardMaterial( { flatShading: true } );
  
  				const mesh = new THREE.InstancedMesh( geometry, material, 100 );
  				const dummy = new THREE.Object3D();
  				const col = new THREE.Color();
  				const center = new THREE.Vector2();
  
  				for ( let i = 0; i < mesh.count; i ++ ) {
  
  					dummy.position.x = Math.random() * 50 - 25;
  					dummy.position.y = Math.random() * 50 - 25;
  					dummy.position.z = Math.random() * 50 - 25;
  
  					center.set( dummy.position.x, dummy.position.y );
  
  					// make sure tetrahedrons are not positioned at the origin
  
  					if ( center.length() < 6 ) {
  
  						center.normalize().multiplyScalar( 6 );
  						dummy.position.x = center.x;
  						dummy.position.y = center.y;
  
  					}
  
  					dummy.scale.setScalar( Math.random() * 2 + 1 );
  
  					dummy.rotation.x = Math.random() * Math.PI;
  					dummy.rotation.y = Math.random() * Math.PI;
  					dummy.rotation.z = Math.random() * Math.PI;
  
  					dummy.updateMatrix();
  					mesh.setMatrixAt( i, dummy.matrix );
  
  					col.setHSL( 0.55 + ( i / mesh.count ) * 0.15, 1, 0.2 );
  
  					mesh.setColorAt( i, col );
  
  				}
  
  				group.add( mesh );
  				scene.add( group );
  
  				
  
  
  				renderer.inspector = new Inspector();
  				renderer.toneMapping = THREE.NeutralToneMapping;
  
  
  				// post processing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				const scenePass = pass( scene, camera );
  
  				const weightUniform = uniform( float( 0.9 ) );
  				const decayUniform = uniform( float( 0.95 ) );
  				const exposureUniform = uniform( int( 5 ) );
  				const countUniform = uniform( int( 32 ) );
  
  				const blurPass = radialBlur( scenePass, { weight: weightUniform, decay: decayUniform, count: countUniform, exposure: exposureUniform } );
  
  				renderPipeline.outputNode = blurPass;
  
  				//
  
  				
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( weightUniform, 'value', 0, 1 ).name( 'weight' );
  				gui.add( decayUniform, 'value', 0, 1 ).name( 'decay' );
  				gui.add( countUniform, 'value', 16, 64, 1 ).name( 'sample count' );
  				gui.add( exposureUniform, 'value', 1, 10 ).name( 'exposure' );
  				gui.add( params, 'enabled' ).onChange( ( value ) => {
  			
  					if ( value === true ) {
  
  						renderPipeline.outputNode = blurPass;
  
  					} else {
  
  						renderPipeline.outputNode = scenePass;
  
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
