<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { radixSort } from 'three/examples/jsm/utils/SortUtils.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - mesh - batch"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  		let stats, gui, guiStatsEl;
  
  		let geometries, mesh;
  		const ids = [];
  		const matrix = new THREE.Matrix4();
  
  		//
  
  		const position = new THREE.Vector3();
  		const rotation = new THREE.Euler();
  		const quaternion = new THREE.Quaternion();
  		const scale = new THREE.Vector3();
  
  		//
  
  		const MAX_GEOMETRY_COUNT = 20000;
  
  		const Method = {
  			BATCHED: 'BATCHED',
  			NAIVE: 'NAIVE'
  		};
  
  		const api = {
  			method: Method.BATCHED,
  			count: 256,
  			dynamic: 16,
  
  			transparent: true,
  			sortObjects: true,
  			perObjectFrustumCulled: true,
  			useCustomSort: true,
  		};
  
  		
  		initGeometries();
  		initMesh();
  
  		//
  
  		function randomizeMatrix( matrix ) {
  
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
  
  		function randomizeRotationSpeed( rotation ) {
  
  			rotation.x = Math.random() * 0.01;
  			rotation.y = Math.random() * 0.01;
  			rotation.z = Math.random() * 0.01;
  			return rotation;
  
  		}
  
  		function randomizeColor( color ) {
  
  			return color.setHSL( Math.random() * 0.5, 0.6, 0.5 );
  
  		}
  
  		function randomizeAlpha() {
  
  			// make ~20% of all objects transparent
  			return Math.random() > 0.8 ? 0.5 : 1.0;
  
  		}
  
  		function initGeometries() {
  
  			const cone = new THREE.ConeGeometry( 1.0, 2.0 );
  			const box = new THREE.BoxGeometry( 2.0, 2.0, 2.0 );
  			const sphere = new THREE.SphereGeometry( 1.0, 16, 8 );
  
  			geometries = [ cone, box, sphere ];
  
  			for ( const geometry of geometries ) {
  
  				// add vertex colors for testing
  				const count = geometry.getAttribute( 'position' ).count;
  				const attribute = new THREE.BufferAttribute( new Float32Array( count * 3 ), 3 );
  				geometry.setAttribute( 'color', attribute );
  
  				for ( let i = 0, l = attribute.array.length; i < l; ++ i ) {
  
  					attribute.array[ i ] = 1.0;
  
  				}
  
  			}
  
  		}
  
  		function createMaterial() {
  
  			return new THREE.MeshPhongMaterial( {
  				vertexColors: true,
  				transparent: api.transparent,
  				depthWrite: ! api.transparent
  			} );
  
  		}
  
  		function cleanup() {
  
  			if ( mesh ) {
  
  				mesh.traverse( node => {
  
  					if ( node instanceof THREE.Mesh ) {
  
  						node.material.dispose();
  
  					}
  
  				} );
  
  				mesh.parent.remove( mesh );
  
  				if ( mesh.dispose ) {
  
  					mesh.dispose();
  
  				}
  
  			}
  
  		}
  
  		function initMesh() {
  
  			cleanup();
  
  			if ( api.method === Method.BATCHED ) {
  
  				initBatchedMesh();
  
  			} else {
  
  				initRegularMesh();
  
  			}
  
  		}
  
  		function initRegularMesh() {
  
  			mesh = new THREE.Group();
  
  			for ( let i = 0; i < api.count; i ++ ) {
  
  				const material = createMaterial();
  				randomizeColor( material.color );
  				material.opacity = randomizeAlpha();
  
  				const child = new THREE.Mesh( geometries[ i % geometries.length ], material );
  				randomizeMatrix( child.matrix );
  				child.matrix.decompose( child.position, child.quaternion, child.scale );
  				child.userData.rotationSpeed = randomizeRotationSpeed( new THREE.Euler() );
  				mesh.add( child );
  
  			}
  
  			scene.add( mesh );
  
  		}
  
  		function initBatchedMesh() {
  
  			const geometryCount = api.count;
  			const vertexCount = geometries.length * 512;
  			const indexCount = geometries.length * 1024;
  
  			const euler = new THREE.Euler();
  			const matrix = new THREE.Matrix4();
  			const color = new THREE.Color();
  			const colorWithAlpha = new THREE.Vector4();
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
  
  				randomizeColor( color );
  				colorWithAlpha.set( color.r, color.g, color.b, randomizeAlpha() );
  
  				const id = mesh.addInstance( geometryIds[ i % geometryIds.length ] );
  				mesh.setMatrixAt( id, randomizeMatrix( matrix ) );
  				mesh.setColorAt( id, colorWithAlpha );
  
  				const rotationMatrix = new THREE.Matrix4();
  				rotationMatrix.makeRotationFromEuler( randomizeRotationSpeed( euler ) );
  				mesh.userData.rotationSpeeds.push( rotationMatrix );
  
  				ids.push( id );
  
  			}
  
  			scene.add( mesh );
  
  		}
  
  		
  
  
  			const width = (__stage.container?.clientWidth || window.innerWidth);
  			const height = (__stage.container?.clientHeight || window.innerHeight);
  
  			// camera
  
  			
  			camera.position.z = 30;
  
  			// renderer
  
  			
  
  
  			// scene
  
  			
  			scene.background = new THREE.Color( 0xffffff );
  
  			// controls
  
  			
  			controls.autoRotate = true;
  			controls.autoRotateSpeed = 1.0;
  
  			// light
  
  			const ambientLight = new THREE.AmbientLight( 0xffffff, 2 );
  			const directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
  			directionalLight.position.set( 1, 1, 1 );
  			scene.add( directionalLight, ambientLight );
  
  			// stats
  
  			stats = new Stats();
  			__stage.overlay?.appendChild(stats.dom)
  
  			// gui
  
  			gui = new GUI();
  			gui.add( api, 'count', 1, MAX_GEOMETRY_COUNT ).step( 1 ).onChange( initMesh );
  			gui.add( api, 'dynamic', 0, MAX_GEOMETRY_COUNT ).step( 1 );
  			gui.add( api, 'method', Method ).onChange( initMesh );
  
  			gui.add( api, 'transparent' ).onChange( v => mesh.traverse( node => {
  
  				if ( node instanceof THREE.Mesh ) {
  
  					const material = node.material;
  					material.transparent = v;
  					material.depthWrite = ! v;
  					material.needsUpdate = true;
  
  				}
  
  			} ) );
  
  			gui.add( api, 'sortObjects' );
  			gui.add( api, 'perObjectFrustumCulled' );
  			gui.add( api, 'useCustomSort' );
  
  			guiStatsEl = document.createElement( 'li' );
  			guiStatsEl.classList.add( 'gui-stats' );
  
  			// listeners
  
  			
  
  		
  
  
  		//
  
  		function sortFunction( list ) {
  
  			// initialize options
  			this._options = this._options || {
  				get: el => el.z,
  				aux: new Array( this.maxInstanceCount )
  			};
  
  			const options = this._options;
  			options.reversed = this.material.transparent;
  
  			let minZ = Infinity;
  			let maxZ = - Infinity;
  			for ( let i = 0, l = list.length; i < l; i ++ ) {
  
  				const z = list[ i ].z;
  				if ( z > maxZ ) maxZ = z;
  				if ( z < minZ ) minZ = z;
  
  			}
  
  			// convert depth to unsigned 32 bit range
  			const depthDelta = maxZ - minZ;
  			const factor = ( 2 ** 32 - 1 ) / depthDelta; // UINT32_MAX / z range
  			for ( let i = 0, l = list.length; i < l; i ++ ) {
  
  				list[ i ].z -= minZ;
  				list[ i ].z *= factor;
  
  			}
  
  			// perform a fast-sort using the hybrid radix sort function
  			radixSort( list, options );
  
  		}
  
  		
  
  		__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const loopNum = Math.min( api.count, api.dynamic );
    			if ( api.method === Method.BATCHED ) {
    				for ( let i = 0; i < loopNum; i ++ ) {
    					const rotationMatrix = mesh.userData.rotationSpeeds[ i ];
    					const id = ids[ i ];
    					mesh.getMatrixAt( id, matrix );
    					matrix.multiply( rotationMatrix );
    					mesh.setMatrixAt( id, matrix );
    				}
    			} else {
    				for ( let i = 0; i < loopNum; i ++ ) {
    					const child = mesh.children[ i ];
    					const rotationSpeed = child.userData.rotationSpeed;
    					child.rotation.set(
    						child.rotation.x + rotationSpeed.x,
    						child.rotation.y + rotationSpeed.y,
    						child.rotation.z + rotationSpeed.z
    					);
    				}
    			}
    }
    			stats.update();
    {
    if ( mesh.isBatchedMesh ) {
    				mesh.sortObjects = api.sortObjects;
    				mesh.perObjectFrustumCulled = api.perObjectFrustumCulled;
    				mesh.setCustomSort( api.useCustomSort ? sortFunction : null );
    			}
    }
  })
  
  		function animateMeshes() {
  
  			const loopNum = Math.min( api.count, api.dynamic );
  
  			if ( api.method === Method.BATCHED ) {
  
  				for ( let i = 0; i < loopNum; i ++ ) {
  
  					const rotationMatrix = mesh.userData.rotationSpeeds[ i ];
  					const id = ids[ i ];
  
  					mesh.getMatrixAt( id, matrix );
  					matrix.multiply( rotationMatrix );
  					mesh.setMatrixAt( id, matrix );
  
  				}
  
  			} else {
  
  				for ( let i = 0; i < loopNum; i ++ ) {
  
  					const child = mesh.children[ i ];
  					const rotationSpeed = child.userData.rotationSpeed;
  
  					child.rotation.set(
  						child.rotation.x + rotationSpeed.x,
  						child.rotation.y + rotationSpeed.y,
  						child.rotation.z + rotationSpeed.z
  					);
  
  				}
  
  			}
  
  		}
  
  		function render() {
  
  			if ( mesh.isBatchedMesh ) {
  
  				mesh.sortObjects = api.sortObjects;
  				mesh.perObjectFrustumCulled = api.perObjectFrustumCulled;
  				mesh.setCustomSort( api.useCustomSort ? sortFunction : null );
  
  			}
  
  
  
  		}
  
  	
}
</script>
