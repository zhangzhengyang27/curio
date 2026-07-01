<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 35, near: 1, far: 3000 }"
    custom-render
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - shader material demo. featuring lava shader by <a href=\"http://irrlicht.sourceforge.net/phpBB2/viewtopic.php?t=21057\" target=\"_blank\" rel=\"noopener\">TheGameMaker</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let composer, timer;
  
  			let uniforms, mesh;
  
  			
  
  
  				const container = document.getElementById( 'container' );
  
  				
  				camera.position.z = 4;
  
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const cloudTexture = textureLoader.load( ASSET_HOST + 'textures/lava/cloud.png' );
  				const lavaTexture = textureLoader.load( ASSET_HOST + 'textures/lava/lavatile.jpg' );
  
  				lavaTexture.colorSpace = THREE.SRGBColorSpace;
  
  				cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;
  				lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping;
  
  				uniforms = {
  
  					'fogDensity': { value: 0.45 },
  					'fogColor': { value: new THREE.Vector3( 0, 0, 0 ) },
  					'time': { value: 1.0 },
  					'uvScale': { value: new THREE.Vector2( 3.0, 1.0 ) },
  					'texture1': { value: cloudTexture },
  					'texture2': { value: lavaTexture }
  
  				};
  
  				const size = 0.65;
  
  				const material = new THREE.ShaderMaterial( {
  
  					uniforms: uniforms,
  					vertexShader: document.getElementById( 'vertexShader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentShader' ).textContent
  
  				} );
  
  				mesh = new THREE.Mesh( new THREE.TorusGeometry( size, 0.3, 30, 30 ), material );
  				mesh.rotation.x = 0.3;
  				scene.add( mesh );
  
  				//
  
  				
  
  
  				renderer.autoClear = false;
  
  
  				//
  
  				const renderModel = new RenderPass( scene, camera );
  				const effectBloom = new BloomPass( 1.25 );
  				const outputPass = new OutputPass();
  
  				composer = new EffectComposer( renderer );
  
  				composer.addPass( renderModel );
  				composer.addPass( effectBloom );
  				composer.addPass( outputPass );
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = 5 * timer.getDelta();
    				uniforms[ 'time' ].value += 0.2 * delta;
    				mesh.rotation.y += 0.0125 * delta;
    				mesh.rotation.x += 0.05 * delta;
    				renderer.clear();
    				composer.render( 0.01 );
  })
  
  		
}
</script>
