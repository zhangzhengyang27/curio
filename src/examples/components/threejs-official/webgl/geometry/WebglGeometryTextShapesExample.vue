<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, -400, 600]"
    :camera-options="{ fov: 45, near: 1, far: 10000 }"
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
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - simple text from json fonts"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0xf0f0f0 );
  
  				const loader = new FontLoader();
  				loader.load( ASSET_HOST + 'fonts/helvetiker_regular.typeface.json', function ( font ) {
  
  					const color = 0x006699;
  
  					const matDark = new THREE.LineBasicMaterial( {
  						color: color,
  						side: THREE.DoubleSide
  					} );
  
  					const matLite = new THREE.MeshBasicMaterial( {
  						color: color,
  						transparent: true,
  						opacity: 0.4,
  						side: THREE.DoubleSide
  					} );
  
  					const message = '   Three.js\nSimple text.';
  
  					const shapes = font.generateShapes( message, 100 );
  
  					const geometry = new THREE.ShapeGeometry( shapes );
  
  					geometry.computeBoundingBox();
  
  					const xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
  
  					geometry.translate( xMid, 0, 0 );
  
  					// make shape ( N.B. edge view not visible )
  
  					const text = new THREE.Mesh( geometry, matLite );
  					text.position.z = - 150;
  					scene.add( text );
  
  					// make line shape ( N.B. edge view remains visible )
  
  					const holeShapes = [];
  
  					for ( let i = 0; i < shapes.length; i ++ ) {
  
  						const shape = shapes[ i ];
  
  						if ( shape.holes && shape.holes.length > 0 ) {
  
  							for ( let j = 0; j < shape.holes.length; j ++ ) {
  
  								const hole = shape.holes[ j ];
  								holeShapes.push( hole );
  
  							}
  
  						}
  
  					}
  
  					shapes.push( ...holeShapes );
  
  					const lineText = new THREE.Object3D();
  
  					for ( let i = 0; i < shapes.length; i ++ ) {
  
  						const shape = shapes[ i ];
  
  						const points = shape.getPoints();
  						const geometry = new THREE.BufferGeometry().setFromPoints( points );
  
  						geometry.translate( xMid, 0, 0 );
  
  						const lineMesh = new THREE.Line( geometry, matDark );
  						lineText.add( lineMesh );
  
  					}
  
  					scene.add( lineText );
  
  					render();
  
  				} ); //end load function
  
  				
  
  
  
  
  
  				controls.target.set( 0, 0, 0 );
  				controls.update();
  
  				controls.addEventListener( 'change', render );
  
  				
  
  			
   // end init
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
