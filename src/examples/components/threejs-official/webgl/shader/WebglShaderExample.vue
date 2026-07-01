<template>
  <ExampleScene
    camera="perspective"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - shader demo. featuring <a href=\"http://www.pouet.net/prod.php?which=52761\" target=\"_blank\" rel=\"noopener\">Monjori by Mic</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			
  
  
  				const container = document.getElementById( 'container' );
  
  				
  
  				
  
  				const geometry = new THREE.PlaneGeometry( 2, 2 );
  
  				uniforms = {
  					time: { value: 1.0 }
  				};
  
  				const material = new THREE.ShaderMaterial( {
  
  					uniforms: uniforms,
  					vertexShader: document.getElementById( 'vertexShader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentShader' ).textContent
  
  				} );
  
  				const mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				
  
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    uniforms[ 'time' ].value = performance.now() / 1000;
  })
  
  		
}
</script>
