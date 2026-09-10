<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<label for=\"dotScreen\">Glitch me wild:</label><input id=\"wildGlitch\" type=\"checkbox\"/><br />"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let composer;
  			let object, light;
  
  			let glitchPass;
  
  			const wildGlitchCheckbox = document.createElement( 'input' );
  			wildGlitchCheckbox.type = 'checkbox';
  			wildGlitchCheckbox.id = 'wildGlitch';
  			const wildGlitchLabel = document.createElement( 'label' );
  			wildGlitchLabel.style.cssText = 'position:absolute;top:10px;left:10px;color:#fff;font-size:12px;display:flex;align-items:center;gap:4px;';
  			wildGlitchLabel.appendChild( wildGlitchCheckbox );
  			wildGlitchLabel.appendChild( document.createTextNode( 'Wild Glitch' ) );
  			__stage.overlay?.appendChild( wildGlitchLabel );
  
  			function updateOptions() {
  
  				glitchPass.goWild = wildGlitchCheckbox.checked;
  
  			}
  
  			
  
  
  				
  
  
  				//
  
  				
  				camera.position.z = 400;
  
  				
  				scene.fog = new THREE.Fog( 0x000000, 1, 1000 );
  
  				object = new THREE.Object3D();
  				scene.add( object );
  
  				const geometry = new THREE.SphereGeometry( 1, 4, 4 );
  				const material = new THREE.MeshPhongMaterial( { flatShading: true } );
  
  				const mesh = new THREE.InstancedMesh( geometry, material, 100 );
  				const dummy = new THREE.Object3D();
  				const color = new THREE.Color();
  
  				for ( let i = 0; i < 100; i ++ ) {
  
  					dummy.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 ).normalize();
  					dummy.position.multiplyScalar( Math.random() * 400 );
  					dummy.rotation.set( Math.random() * 2, Math.random() * 2, Math.random() * 2 );
  
  					const scale = Math.random() * 50;
  					dummy.scale.set( scale, scale, scale );
  
  					dummy.updateMatrix();
  					mesh.setMatrixAt( i, dummy.matrix );
  
  					color.setHex( 0xffffff * Math.random() );
  					mesh.setColorAt( i, color );
  
  				}
  
  				object.add( mesh );
  
  				scene.add( new THREE.AmbientLight( 0xcccccc ) );
  
  				light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 1, 1, 1 );
  				scene.add( light );
  
  				// postprocessing
  
  				composer = new EffectComposer( renderer );
  				composer.addPass( new RenderPass( scene, camera ) );
  
  				glitchPass = new GlitchPass();
  				composer.addPass( glitchPass );
  
  				const outputPass = new OutputPass();
  				composer.addPass( outputPass );
  
  
  				//
  
  				
  
  				wildGlitchCheckbox.addEventListener( 'change', updateOptions );
  
  				updateOptions();
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    object.rotation.x += 0.005;
    				object.rotation.y += 0.01;
    				composer.render();
  })
  
  		
}
</script>
