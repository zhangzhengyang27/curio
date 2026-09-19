<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, -400, 1000]"
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

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - simple text from json fonts"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0xf0f0f0 );
  
  				const loader = new FontLoader();
  				loader.load( ASSET_HOST + 'fonts/MPLUSRounded1c/MPLUSRounded1c-Regular.typeface.json', function ( font ) {
  
  					const color = new THREE.Color( 0x006699 );
  
  					const matDark = new THREE.MeshBasicMaterial( {
  						color: color,
  						side: THREE.DoubleSide
  					} );
  
  					const matLite = new THREE.MeshBasicMaterial( {
  						color: color,
  						transparent: true,
  						opacity: 0.4,
  						side: THREE.DoubleSide
  					} );
  
  					const material = {
  						dark: matDark,
  						lite: matLite,
  						color: color
  					};
  
  					const english = '   Three.js\nStroke text.'; // Left to right
  
  					const hebrew = 'טקסט קו'; // Right to left
  
  					const chinese = '文字描邊'; // Top to bottom
  
  					const message1 = generateStrokeText( font, material, english, 80, 'ltr' );
  
  					const message2 = generateStrokeText( font, material, hebrew, 80, 'rtl' );
  
  					const message3 = generateStrokeText( font, material, chinese, 80, 'tb' );
  
  					message1.position.x = - 100;
  
  					message2.position.x = - 100;
  					message2.position.y = - 300;
  
  					message3.position.x = 300;
  					message3.position.y = - 300;
  
  					scene.add( message1, message2, message3 );
  
  					render();
  
  				} ); //end load function
  
  				
  
  
  
  
  
  				controls.target.set( 0, 0, 0 );
  				controls.update();
  
  				controls.addEventListener( 'change', render );
  
  				
  
  			
   // end init
  
  			function generateStrokeText( font: any, material: any, message: any, size: any, direction = 'ltr' ) {
  
  				const shapes = font.generateShapes( message, size, direction );
  
  				const geometry = new THREE.ShapeGeometry( shapes );
  
  				const strokeText = new THREE.Group();
  
  				geometry.computeBoundingBox();
  
  				const xMid = - 0.5 * ( (geometry!.boundingBox as any).max.x - (geometry!.boundingBox as any).min.x );
  
  				geometry.translate( xMid, 0, 0 );
  
  				// make shape ( N.B. edge view not visible )
  
  				const text = new THREE.Mesh( geometry, material.lite );
  
  				text.position.z = - 150;
  
  				strokeText.add( text );
  
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
  
  				const style = SVGLoader.getStrokeStyle( 5, material.color.getStyle() );
  
  				for ( let i = 0; i < shapes.length; i ++ ) {
  
  					const shape = shapes[ i ];
  
  					const points = shape.getPoints();
  
  					const geometry = SVGLoader.pointsToStroke( points, style );
  
  					geometry.translate( xMid, 0, 0 );
  
  					const strokeMesh = new THREE.Mesh( geometry, material.dark );
  					strokeText.add( strokeMesh );
  
  				}
  
  				return strokeText;
  
  			}
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
