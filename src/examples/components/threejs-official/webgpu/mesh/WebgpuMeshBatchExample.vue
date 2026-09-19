<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 1, far: 100 }"
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
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { radixSort } from 'three/examples/jsm/utils/SortUtils.js';
import { normalView, packNormalToRGB, diffuseColor, vec4 } from 'three/tsl';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t<div class=\"title-wrapper\">\n\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Batch Mesh</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  		let gui;
  		let geometries: any, mesh: any, material: any;
  		const ids: any = [];
  
  		const matrix = new THREE.Matrix4();
  
  		//
  
  		const position = new THREE.Vector3();
  		const rotation = new THREE.Euler();
  		const quaternion = new THREE.Quaternion();
  		const scale = new THREE.Vector3();
  
  		//
  
  		const MAX_GEOMETRY_COUNT = 20000;
  
  		const api = {
  			webgpu: true,
  			count: 512,
  			dynamic: 16,
  
  			sortObjects: true,
  			perObjectFrustumCulled: true,
  			opacity: 1,
  			useCustomSort: true,
  			randomizeGeometry: ()=>{
  
  				for ( let i = 0; i < api.count; i ++ ) {
  
  					mesh.setGeometryIdAt( i, Math.floor( Math.random() * geometries.length ) );
  		
  				}
  		
  			}
  		};
  
  
  		init();
  
  		//
  
  		function randomizeMatrix( matrix: any ) {
  
  			position.x = Math.random() * 40 - 20;
  			position.y = Math.random() * 40 - 20;
  			position.z = Math.random() * 40 - 20;
  
  			rotation.x = Math.random() * 2 * Math.PI;
  			rotation.y = Math.random() * 2 * Math.PI;
  			rotation.z = Math.random() * 2 * Math.PI;
  
  			quaternion.setFromEuler( rotation );
  
  			scale.x = scale.y = scale.z = 0.5 + ( Math.random() * 0.5 );
  
  			return matrix.compose( position, quaternion, scale );
  
  		}
  
  		function randomizeRotationSpeed( rotation: any ) {
  
  			rotation.x = Math.random() * 0.01;
  			rotation.y = Math.random() * 0.01;
  			rotation.z = Math.random() * 0.01;
  			return rotation;
  
  		}
  
  		function initGeometries() {
  
  			geometries = [
  				new THREE.ConeGeometry( 1.0, 2.0 ),
  				new THREE.BoxGeometry( 2.0, 2.0, 2.0 ),
  				new THREE.SphereGeometry( 1.0, 16, 8 ),
  			];
  
  		}
  
  		function createMaterial() {
  
  			if ( ! material ) {
  
  				material = new THREE.MeshBasicNodeMaterial();
  				material.outputNode = vec4(
  					diffuseColor.mul( packNormalToRGB( normalView ).y.add( 0.5 ) ).rgb,
  					diffuseColor.a,
  				);
  		
  	}
  
  			return material;
  
  		}
  
  		function cleanup() {
  
  			if ( mesh ) {
  
  				mesh.parent.remove( mesh );
  
  				if ( mesh.dispose ) {
  
  					mesh.dispose();
  
  				}
  
  			}
  
  		}
  
  		function initMesh() {
  
  			cleanup();
  			initBatchedMesh();
  
  		}
  
  		function initBatchedMesh() {
  
  			const geometryCount = api.count;
  			const vertexCount = geometries.length * 512;
  			const indexCount = geometries.length * 1024;
  
  			const euler = new THREE.Euler();
  			const matrix = new THREE.Matrix4();
  			mesh = new THREE.BatchedMesh( geometryCount, vertexCount, indexCount, createMaterial() );
  			mesh.userData.rotationSpeeds = [];
  
  			// disable full-object frustum culling since all of the objects can be dynamic.
  			mesh.frustumCulled = false;
  
  			ids.length = 0;
  
  			const geometryIds = [
  				mesh.addGeometry( geometries[ 0 ] ),
  				mesh.addGeometry( geometries[ 1 ] ),
  				mesh.addGeometry( geometries[ 2 ] ),
  			];
  			for ( let i = 0; i < api.count; i ++ ) {
  
  				const id = mesh.addInstance( geometryIds[ i % geometryIds.length ] );
  				mesh.setMatrixAt( id, randomizeMatrix( matrix ) );
  				mesh.setColorAt( id, new THREE.Color( Math.random() * 0xffffff ) );
  
  				const rotationMatrix = new THREE.Matrix4();
  				rotationMatrix.makeRotationFromEuler( randomizeRotationSpeed( euler ) );
  				mesh.userData.rotationSpeeds.push( rotationMatrix );
  
  				ids.push( id );
  
  			}
  
  			scene.add( mesh );
  
  		}
  
  		function init( forceWebGL = false ) {
  
  			if ( renderer ) {
  
  				renderer.dispose();
  				controls.dispose();
  				document.body.removeChild( renderer.domElement );
  
  			}
  
  			// camera
  
  			const aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  
  			
  			camera.position.z = 30;
  
  			// renderer
  
  			
  
  
  			renderer.inspector = new Inspector();
  			// scene
  
  			
  			scene.background = forceWebGL ? new THREE.Color( 0xffc1c1 ) : new THREE.Color( 0xc1c1ff );
  
  
  
  
  
  			initGeometries();
  			initMesh();
  
  			// controls
  
  			
  			controls.autoRotate = true;
  			controls.autoRotateSpeed = 1.0;
  
  			// gui
  
  			gui = renderer.inspector.createParameters( 'Settings' );
  			gui.add( api, 'webgpu' ).onChange( () => {
  
  				init( ! api.webgpu );
  
  			} );
  			gui.add( api, 'count', 1, MAX_GEOMETRY_COUNT, 1 ).onChange( initMesh );
  			gui.add( api, 'dynamic', 0, MAX_GEOMETRY_COUNT, 1 );
  
  			gui.add( api, 'opacity', 0, 1 ).onChange( (v: any) => {
  
  				if ( v < 1 ) {
  
  					material.transparent = true;
  					material.depthWrite = false;
  
  				} else {
  
  					material.transparent = false;
  					material.depthWrite = true;
  
  				}
  
  				material.opacity = v;
  				material.needsUpdate = true;
  
  			} );
  			gui.add( api, 'sortObjects' );
  			gui.add( api, 'perObjectFrustumCulled' );
  			gui.add( api, 'useCustomSort' );
  			gui.add( api, 'randomizeGeometry' ).name( 'randomize geometry' );
  
  
  			// listeners
  
  			
  
  			
  
  
  			__stage.addUpdateCallback(async (_delta: any, _elapsed: any) => {
    animateMeshes();
    				if ( mesh.isBatchedMesh ) {
    					mesh.sortObjects = api.sortObjects;
    					mesh.perObjectFrustumCulled = api.perObjectFrustumCulled;
    					mesh.setCustomSort( api.useCustomSort ? sortFunction : null );
    				}
  })
  
  			function animateMeshes() {
  
  				const loopNum = Math.min( api.count, api.dynamic );
  
  
  				for ( let i = 0; i < loopNum; i ++ ) {
  
  					const rotationMatrix = mesh.userData.rotationSpeeds[ i ];
  					const id = ids[ i ];
  
  					mesh.getMatrixAt( id, matrix );
  					matrix.multiply( rotationMatrix );
  					mesh.setMatrixAt( id, matrix );
  
  				}
  
  			}
  
  		}
  
  		//
  
  		function sortFunction( this: any, list: any, camera: any ) {
  
  			// initialize options
  			this._options = this._options || {
  				get: (el: any) => el.z,
  				aux: new Array( this.maxInstanceCount )
  			};
  
  			const options = this._options;
  			options.reversed = this.material.transparent;
  
  			// convert depth to unsigned 32 bit range
  			const factor = ( 2 ** 32 - 1 ) / camera.far; // UINT32_MAX / max_depth
  			for ( let i = 0, l = list.length; i < l; i ++ ) {
  
  				list[ i ].z *= factor;
  
  			}
  
  			// perform a fast-sort using the hybrid radix sort function
  			radixSort( list, options );
  
  		}
  
  	
}
</script>
