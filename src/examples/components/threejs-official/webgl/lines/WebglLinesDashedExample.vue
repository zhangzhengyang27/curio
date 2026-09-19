<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 1, far: 200 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as GeometryUtils from 'three/examples/jsm/utils/GeometryUtils.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - dashed lines example"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats;
  			const objects = [];
  
  			const WIDTH = (__stage.container?.clientWidth || window.innerWidth), HEIGHT = (__stage.container?.clientHeight || window.innerHeight);
  
  			
  
  
  				
  				camera.position.z = 150;
  
  				
  				scene.background = new THREE.Color( 0x111111 );
  				scene.fog = new THREE.Fog( 0x111111, 150, 200 );
  
  				const subdivisions = 6;
  				const recursion = 1;
  
  				const points = GeometryUtils.hilbert3D( new THREE.Vector3( 0, 0, 0 ), 25.0, recursion, 0, 1, 2, 3, 4, 5, 6, 7 );
  				const spline = new THREE.CatmullRomCurve3( points );
  
  				const samples = spline.getPoints( points.length * subdivisions );
  				const geometrySpline = new THREE.BufferGeometry().setFromPoints( samples );
  
  				const line = new THREE.Line( geometrySpline, new THREE.LineDashedMaterial( { color: 0xffffff, dashSize: 1, gapSize: 0.5 } ) );
  				line.computeLineDistances();
  
  				objects.push( line );
  				scene.add( line );
  
  				const geometryBox = box( 50, 50, 50 );
  
  				const lineSegments = new THREE.LineSegments( geometryBox, new THREE.LineDashedMaterial( { color: 0xffaa00, dashSize: 3, gapSize: 1 } ) );
  				lineSegments.computeLineDistances();
  
  				objects.push( lineSegments );
  				scene.add( lineSegments );
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			function box( width: any, height: any, depth: any ) {
  
  				width = width * 0.5,
  				height = height * 0.5,
  				depth = depth * 0.5;
  
  				const geometry = new THREE.BufferGeometry();
  				const position = [];
  
  				position.push(
  					- width, - height, - depth,
  					- width, height, - depth,
  
  					- width, height, - depth,
  					width, height, - depth,
  
  					width, height, - depth,
  					width, - height, - depth,
  
  					width, - height, - depth,
  					- width, - height, - depth,
  
  					- width, - height, depth,
  					- width, height, depth,
  
  					- width, height, depth,
  					width, height, depth,
  
  					width, height, depth,
  					width, - height, depth,
  
  					width, - height, depth,
  					- width, - height, depth,
  
  					- width, - height, - depth,
  					- width, - height, depth,
  
  					- width, height, - depth,
  					- width, height, depth,
  
  					width, height, - depth,
  					width, height, depth,
  
  					width, - height, - depth,
  					width, - height, depth
  				 );
  
  				geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( position, 3 ) );
  
  				return geometry;
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    const time = Date.now() * 0.001;
    				scene.traverse( function ( object: any ) {
    					if ( object.isLine ) {
    						object.rotation.x = 0.25 * time;
    						object.rotation.y = 0.25 * time;
    					}
    				} );
    }
    				stats.update();
  })
  
  			function render() {
  
  				const time = Date.now() * 0.001;
  
  				scene.traverse( function ( object: any ) {
  
  					if ( object.isLine ) {
  
  						object.rotation.x = 0.25 * time;
  						object.rotation.y = 0.25 * time;
  
  					}
  
  				} );
  
  
  
  			}
  
  	
}
</script>
