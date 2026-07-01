<template>
  <SVGExampleScene
    camera="perspective"
    :camera-options="{ fov: 33, near: 0.1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </SVGExampleScene>
</template>

<script setup>
import SVGExampleScene from '@/examples/components/SVGExampleScene.vue'
import * as THREE from 'three';
import { SVGRenderer } from 'three/examples/jsm/renderers/SVGRenderer.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> svg - lines"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			THREE.ColorManagement.enabled = false;
  
  				camera.position.z = 10;
  
  				
  				scene.background = new THREE.Color( 0, 0, 0 );
  
  				
  
  
  
  				//
  
  				const vertices = [];
  				const divisions = 50;
  
  				for ( let i = 0; i <= divisions; i ++ ) {
  
  					const v = ( i / divisions ) * ( Math.PI * 2 );
  
  					const x = Math.sin( v );
  					const z = Math.cos( v );
  
  					vertices.push( x, 0, z );
  
  				}
  
  				const geometry = new THREE.BufferGeometry();
  				geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
  
  				//
  
  				for ( let i = 1; i <= 3; i ++ ) {
  
  					const material = new THREE.LineBasicMaterial( {
  						color: Math.random() * 0xffffff,
  						linewidth: 10
  					} );
  					const line = new THREE.Line( geometry, material );
  					line.scale.setScalar( i / 3 );
  					scene.add( line );
  
  				}
  
  				const material = new THREE.LineDashedMaterial( {
  					color: 'blue',
  					linewidth: 1,
  					dashSize: 10,
  					gapSize: 10
  				} );
  				const line = new THREE.Line( geometry, material );
  				line.scale.setScalar( 2 );
  				scene.add( line );
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    let count = 0;
    				const time = performance.now() / 1000;
    				scene.traverse( function ( child ) {
    					child.rotation.x = count + ( time / 3 );
    					child.rotation.z = count + ( time / 4 );
    					count ++;
    				} );
  })
  
  		
}
</script>
