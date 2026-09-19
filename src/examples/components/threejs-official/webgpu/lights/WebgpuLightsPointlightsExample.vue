<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 1, far: 1000 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { abs, attribute, distance, float, max, modelWorldMatrixInverse, positionLocal, sin, time, uniform } from 'three/tsl';

let timer: any;


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Point Lights</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  
  
  			let light1: any, light2: any;
  
  			
  
  
  				
  				camera.position.z = 100;
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				// model
  
  				const loader = new OBJLoader();
  				loader.load( ASSET_HOST + 'models/obj/walt/WaltHead.obj', function ( obj ) {
  
  					const mesh = obj.children[ 0 ];
  					mesh.geometry = createGeometry( mesh.geometry );
  					mesh.material = createMaterial();
  
  					mesh.scale.multiplyScalar( 0.8 );
  					mesh.position.y = - 30;
  					scene.add( mesh );
  
  				} );
  
  				const sphere = new THREE.SphereGeometry( 0.5, 16, 8 );
  
  				// lights
  
  				light1 = new THREE.PointLight( 0xff0040, 2000 );
  				light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xff0040 } ) ) );
  				scene.add( light1 );
  
  				light2 = new THREE.PointLight( 0x0040ff, 2000 );
  				light2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0x0040ff } ) ) );
  				scene.add( light2 );
  
  				scene.add( new THREE.AmbientLight( 0xaaaaaa, 0.1 ) );
  
  				// renderer
  
  				
  
  
  				controls.enableDamping = true;
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const time = timer.getElapsed() * 0.5;
    				light1.position.x = Math.sin( time ) * 20;
    				light1.position.y = Math.cos( time * 0.75 ) * - 30;
    				light1.position.z = Math.cos( time * 0.5 ) * 20;
    				light2.position.x = Math.cos( time * 0.5 ) * 20;
    				light2.position.y = Math.sin( time * 0.75 ) * - 30;
    				light2.position.z = Math.sin( time ) * 20;
  })
  
  			// helpers
  
  			function createMaterial() {
  
  				const material = new THREE.MeshPhongNodeMaterial();
  
  				const seedAttribute = attribute( 'seed' );
  				const displaceNormalAttribute = attribute( 'displaceNormal' );
  
  				const localTime = (attribute as any)( 'time' ).add( time );
  
  				const effector1 = (uniform as any)( light1.position ).toVar();
  				const effector2 = (uniform as any)( light2.position ).toVar();
  
  				const distance1 = distance( positionLocal, (modelWorldMatrixInverse.mul as any)( effector1 ) );
  				const distance2 = distance( positionLocal, (modelWorldMatrixInverse.mul as any)( effector2 ) );
  
  				const invDistance1 = max( 0.0, float( 20.0 ).sub( distance1 ) ).div( 2.0 );
  				const invDistance2 = max( 0.0, float( 20.0 ).sub( distance2 ) ).div( 2.0 );
  
  				const s = abs( sin( localTime.mul( 2 ).add( seedAttribute ) ).mul( 0.5 ) ).add( invDistance1 ).add( invDistance2 );
  
  				material.positionNode = positionLocal.add( (displaceNormalAttribute as any).mul( s ) );
  
  				return material;
  
  			}
  
  			function createGeometry( geometry: any ) {
  
  				const positionAttribute = geometry.getAttribute( 'position' );
  
  				const v0 = new THREE.Vector3();
  				const v1 = new THREE.Vector3();
  				const v2 = new THREE.Vector3();
  				const v3 = new THREE.Vector3();
  				const n = new THREE.Vector3();
  
  				const plane = new THREE.Plane();
  
  				const vertices = [];
  				const times = [];
  				const seeds = [];
  				const displaceNormal = [];
  
  				for ( let i = 0; i < positionAttribute.count; i += 3 ) {
  
  					v0.fromBufferAttribute( positionAttribute, i );
  					v1.fromBufferAttribute( positionAttribute, i + 1 );
  					v2.fromBufferAttribute( positionAttribute, i + 2 );
  
  					plane.setFromCoplanarPoints( v0, v1, v2 );
  
  					v3.copy( v0 ).add( v1 ).add( v2 ).divideScalar( 3 ); // compute center
  					v3.add( n.copy( plane.normal ).multiplyScalar( - 1 ) ); // displace center inwards
  
  					// generate tetrahedron for each triangle
  
  					vertices.push( v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z );
  					vertices.push( v3.x, v3.y, v3.z, v1.x, v1.y, v1.z, v0.x, v0.y, v0.z );
  					vertices.push( v3.x, v3.y, v3.z, v2.x, v2.y, v2.z, v1.x, v1.y, v1.z );
  					vertices.push( v3.x, v3.y, v3.z, v0.x, v0.y, v0.z, v2.x, v2.y, v2.z );
  
  					const t = Math.random();
  					const s = Math.random();
  					n.copy( plane.normal );
  
  					times.push( t, t, t ); times.push( t, t, t ); times.push( t, t, t ); times.push( t, t, t );
  					seeds.push( s, s, s ); seeds.push( s, s, s ); seeds.push( s, s, s ); seeds.push( s, s, s );
  
  					displaceNormal.push( n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z );
  					displaceNormal.push( n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z );
  					displaceNormal.push( n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z );
  					displaceNormal.push( n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z );
  
  				}
  
  				const newGeometry = new THREE.BufferGeometry();
  				newGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
  				newGeometry.setAttribute( 'time', new THREE.Float32BufferAttribute( times, 1 ) );
  				newGeometry.setAttribute( 'seed', new THREE.Float32BufferAttribute( seeds, 1 ) );
  				newGeometry.setAttribute( 'displaceNormal', new THREE.Float32BufferAttribute( displaceNormal, 3 ) );
  
  				newGeometry.computeVertexNormals();
  
  				return newGeometry;
  
  
  			}
  
  		
}
</script>
