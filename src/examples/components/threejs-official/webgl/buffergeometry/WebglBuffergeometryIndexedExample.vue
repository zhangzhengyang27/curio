<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 27, near: 1, far: 3500 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - buffergeometry - indexed"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let stats;
  
  			let mesh;
  
  			
  
  
  				//
  
  				
  				camera.position.z = 64;
  
  				
  				scene.background = new THREE.Color( 0x050505 );
  
  				//
  
  				const light = new THREE.HemisphereLight();
  				light.intensity = 3;
  				scene.add( light );
  
  				//
  
  				const geometry = new THREE.BufferGeometry();
  
  				const indices = [];
  
  				const vertices = [];
  				const normals = [];
  				const colors = [];
  
  				const size = 20;
  				const segments = 10;
  
  				const halfSize = size / 2;
  				const segmentSize = size / segments;
  
  				const _color = new THREE.Color();
  
  				// generate vertices, normals and color data for a simple grid geometry
  
  				for ( let i = 0; i <= segments; i ++ ) {
  
  					const y = ( i * segmentSize ) - halfSize;
  
  					for ( let j = 0; j <= segments; j ++ ) {
  
  						const x = ( j * segmentSize ) - halfSize;
  
  						vertices.push( x, - y, 0 );
  						normals.push( 0, 0, 1 );
  
  						const r = ( x / size ) + 0.5;
  						const g = ( y / size ) + 0.5;
  
  						_color.setRGB( r, g, 1, THREE.SRGBColorSpace );
  
  						colors.push( _color.r, _color.g, _color.b );
  
  					}
  
  				}
  
  				// generate indices (data for element array buffer)
  
  				for ( let i = 0; i < segments; i ++ ) {
  
  					for ( let j = 0; j < segments; j ++ ) {
  
  						const a = i * ( segments + 1 ) + ( j + 1 );
  						const b = i * ( segments + 1 ) + j;
  						const c = ( i + 1 ) * ( segments + 1 ) + j;
  						const d = ( i + 1 ) * ( segments + 1 ) + ( j + 1 );
  
  						// generate two faces (triangles) per iteration
  
  						indices.push( a, b, d ); // face one
  						indices.push( b, c, d ); // face two
  
  					}
  
  				}
  
  				//
  
  				geometry.setIndex( indices );
  				geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
  				geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
  				geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
  
  				const material = new THREE.MeshPhongMaterial( {
  					side: THREE.DoubleSide,
  					vertexColors: true
  				} );
  
  				mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				//
  
  				
  
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				const gui = new GUI();
  				gui.add( material, 'wireframe' );
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = Date.now() * 0.001;
    				mesh.rotation.x = time * 0.25;
    				mesh.rotation.y = time * 0.5;
    				stats.update();
  })
  
  		
}
</script>
