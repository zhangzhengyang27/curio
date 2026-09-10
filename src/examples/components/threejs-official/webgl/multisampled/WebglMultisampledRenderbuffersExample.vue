<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 45, near: 10, far: 2000 }"
    custom-render
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
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Multisampled Renderbuffers<br />\n\t\t\tLeft: WebGLRenderTarget, Right: WebGLRenderTarget (multisampled)."
function onReady(__stage) {
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let group, container;
  
  			let composer1, composer2;
  
  			const params = {
  
  				animate: true,
  
  			};
  
  			
  
  
  				container = __stage.container;
  
  				
  				camera.position.z = 500;
  
  
  				scene.background = new THREE.Color( 0xffffff );
  				scene.fog = new THREE.Fog( 0xcccccc, 100, 1500 );
  
  				//
  
  				const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x222222, 5 );
  				hemiLight.position.set( 1, 1, 1 );
  				scene.add( hemiLight );
  
  				//
  
  				group = new THREE.Group();
  
  				const geometry = new THREE.SphereGeometry( 10, 64, 40 );
  				const material = new THREE.MeshLambertMaterial( {
  					color: 0xee0808,
  					polygonOffset: true,
  					polygonOffsetFactor: 1, // positive value pushes polygon further away
  					polygonOffsetUnits: 1
  
  				} );
  				const material2 = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } );
  
  				for ( let i = 0; i < 50; i ++ ) {
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.x = Math.random() * 600 - 300;
  					mesh.position.y = Math.random() * 600 - 300;
  					mesh.position.z = Math.random() * 600 - 300;
  					mesh.rotation.x = Math.random();
  					mesh.rotation.z = Math.random();
  					mesh.scale.setScalar( Math.random() * 5 + 5 );
  					group.add( mesh );
  
  					const mesh2 = new THREE.Mesh( geometry, material2 );
  					mesh2.position.copy( mesh.position );
  					mesh2.rotation.copy( mesh.rotation );
  					mesh2.scale.copy( mesh.scale );
  					group.add( mesh2 );
  
  				}
  
  				scene.add( group );
  
  				//
  
  				
  
  
  				renderer.autoClear = false;
  
  
  				//
  
  				const size = renderer.getDrawingBufferSize( new THREE.Vector2() );
  				const renderTarget = new THREE.WebGLRenderTarget( size.width, size.height, { samples: 4, type: THREE.HalfFloatType } );
  
  				const renderPass = new RenderPass( scene, camera );
  				const outputPass = new OutputPass();
  
  				//
  
  				composer1 = new EffectComposer( renderer );
  				composer1.addPass( renderPass );
  				composer1.addPass( outputPass );
  
  				//
  
  				composer2 = new EffectComposer( renderer, renderTarget );
  				composer2.addPass( renderPass );
  				composer2.addPass( outputPass );
  
  				//
  
  				gui = new GUI();
  				gui.add( params, 'animate' );
  
  				//
  
  				
  
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const halfWidth = container.offsetWidth / 2;
    				if ( params.animate ) {
    					group.rotation.y += 0.002;
    				}
    				renderer.setScissorTest( true );
    				renderer.setScissor( 0, 0, halfWidth - 1, container.offsetHeight );
    				composer1.render();
    				renderer.setScissor( halfWidth, 0, halfWidth, container.offsetHeight );
    				composer2.render();
    				renderer.setScissorTest( false );
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
