<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper.js';
import { VertexTangentsHelper } from 'three/examples/jsm/helpers/VertexTangentsHelper.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - helpers"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let light;
  			let vnh;
  			let vth;
  
  			
  
  
  				
  
  
  				//
  
  				
  				camera.position.z = 400;
  
  				
  
  				light = new THREE.PointLight();
  				light.position.set( 200, 100, 150 );
  				scene.add( light );
  
  				scene.add( new THREE.PointLightHelper( light, 15 ) );
  
  				const gridHelper = new THREE.GridHelper( 400, 40, 0x0000ff, 0x808080 );
  				gridHelper.position.y = - 150;
  				gridHelper.position.x = - 150;
  				scene.add( gridHelper );
  
  				const polarGridHelper = new THREE.PolarGridHelper( 200, 16, 8, 64, 0x0000ff, 0x808080 );
  				polarGridHelper.position.y = - 150;
  				polarGridHelper.position.x = 200;
  				scene.add( polarGridHelper );
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/LeePerrySmith/LeePerrySmith.glb', function ( gltf ) {
  
  					const mesh = gltf.scene.children[ 0 ];
  
  					mesh.geometry.computeTangents(); // generates bad data due to degenerate UVs
  
  					const group = new THREE.Group();
  					group.scale.multiplyScalar( 50 );
  					scene.add( group );
  
  					// To make sure that the matrixWorld is up to date for the boxhelpers
  					group.updateMatrixWorld( true );
  
  					group.add( mesh );
  
  					vnh = new VertexNormalsHelper( mesh, 5 );
  					scene.add( vnh );
  
  					vth = new VertexTangentsHelper( mesh, 5 );
  					scene.add( vth );
  
  					scene.add( new THREE.BoxHelper( mesh ) );
  
  					const wireframe = new THREE.WireframeGeometry( mesh.geometry );
  					let line = new THREE.LineSegments( wireframe );
  					line.material.depthTest = false;
  					line.material.opacity = 0.25;
  					line.material.transparent = true;
  					line.position.x = 4;
  					group.add( line );
  					scene.add( new THREE.BoxHelper( line ) );
  
  					const edges = new THREE.EdgesGeometry( mesh.geometry );
  					line = new THREE.LineSegments( edges );
  					line.material.depthTest = false;
  					line.material.opacity = 0.25;
  					line.material.transparent = true;
  					line.position.x = - 4;
  					group.add( line );
  					scene.add( new THREE.BoxHelper( line ) );
  
  					scene.add( new THREE.BoxHelper( group ) );
  					scene.add( new THREE.BoxHelper( scene ) );
  
  
  				} );
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = - performance.now() * 0.0003;
    				camera.position.x = 400 * Math.cos( time );
    				camera.position.z = 400 * Math.sin( time );
    				light.position.x = Math.sin( time * 1.7 ) * 300;
    				light.position.y = Math.cos( time * 1.5 ) * 400;
    				light.position.z = Math.cos( time * 1.3 ) * 300;
    				if ( vnh ) vnh.update();
    				if ( vth ) vth.update();
  })
  
  		
}
</script>
