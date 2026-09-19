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

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a>\n\t\t\t\t<span>Render Bundle</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			let gui;
  			let geometries: any, group: any, instancedMesh: any;
  
  			//
  
  			const position = new THREE.Vector3();
  			const rotation = new THREE.Euler();
  			const quaternion = new THREE.Quaternion();
  			const scale = new THREE.Vector3();
  
  			const instanceMatrix = new THREE.Matrix4();
  			const rotationMatrix = new THREE.Matrix4();
  
  			//
  
  			const api = {
  				webgpu: true,
  				renderBundle: true,
  				count: 4000,
  				opacity: 1,
  				dynamic: false
  			};
  
  
  			
  			//
  
  			function randomizeMatrix( matrix: any ) {
  
  				position.x = Math.random() * 80 - 40;
  				position.y = Math.random() * 80 - 40;
  				position.z = Math.random() * 80 - 40;
  
  				rotation.x = Math.random() * 2 * Math.PI;
  				rotation.y = Math.random() * 2 * Math.PI;
  				rotation.z = Math.random() * 2 * Math.PI;
  
  				quaternion.setFromEuler( rotation );
  
  				scale.x = scale.y = scale.z = 0.35 + ( Math.random() * 0.5 );
  
  				return matrix.compose( position, quaternion, scale );
  
  			}
  
  			function randomizeRotationSpeed( rotation: any ) {
  
  				rotation.x = Math.random() * .05;
  				rotation.y = Math.random() * .05;
  				rotation.z = Math.random() * .05;
  				return rotation;
  
  			}
  
  			function initGeometries() {
  
  				geometries = [
  					new THREE.ConeGeometry( 1.0, 2.0, 3, 1 ),
  					new THREE.BoxGeometry( 2.0, 2.0, 2.0 ),
  					new THREE.PlaneGeometry( 2.0, 2, 1, 1 ),
  					new THREE.CapsuleGeometry( ),
  					new THREE.CircleGeometry( 1.0, 3 ),
  					new THREE.CylinderGeometry( 1.0, 1.0, 2.0, 3, 1 ),
  					new THREE.DodecahedronGeometry( 1.0, 0 ),
  					new THREE.IcosahedronGeometry( 1.0, 0 ),
  					new THREE.OctahedronGeometry( 1.0, 0 ),
  					new THREE.PolyhedronGeometry( [ 0, 0, 0 ], [ 0, 0, 0 ], 1, 0 ),
  					new THREE.RingGeometry( 1.0, 1.5, 3 ),
  					new THREE.SphereGeometry( 1.0, 3, 2 ),
  					new THREE.TetrahedronGeometry( 1.0, 0 ),
  					new THREE.TorusGeometry( 1.0, 0.5, 3, 3 ),
  					new THREE.TorusKnotGeometry( 1.0, 0.5, 20, 3, 1, 1 ),
  				];
  
  			}
  
  			function initMesh( count: any ) {
  
  				group = api.renderBundle ? new THREE.BundleGroup() : new THREE.Group();
  
  				for ( let i = 0; i < count; i ++ ) {
  
  					const material = new THREE.MeshToonNodeMaterial( {
  						color: new THREE.Color( Math.random() * 0xffffff ),
  						side: THREE.DoubleSide,
  					} );
  
  					const child = new THREE.Mesh( geometries[ i % geometries.length ], material );
  					randomizeMatrix( child.matrix );
  					child.matrix.decompose( child.position, child.quaternion, child.scale );
  					child.userData.rotationSpeed = randomizeRotationSpeed( new THREE.Euler() );
  					child.frustumCulled = false;
  					group.add( child );
  
  				}
  
  				// instanced meshes are supported inside a bundle group, too
  
  				instancedMesh = new THREE.InstancedMesh( geometries[ 0 ], new THREE.MeshToonNodeMaterial(), 10 );
  				instancedMesh.userData.rotationSpeeds = [];
  
  				const matrix = new THREE.Matrix4();
  
  				for ( let i = 0; i < instancedMesh.count; i ++ ) {
  
  					randomizeMatrix( matrix );
  					instancedMesh.setMatrixAt( i, matrix );
  
  					instancedMesh.userData.rotationSpeeds.push( randomizeRotationSpeed( new THREE.Euler() ) );
  
  				}
  
  				group.add( instancedMesh );
  
  				//
  
  				scene.add( group );
  
  			}
  
  			
  
  
  				const searchParams = new URLSearchParams( window.location.search );
  				api.webgpu = searchParams.get( 'backend' ) !== 'webgl';
  				api.renderBundle = searchParams.get( 'renderBundle' ) !== 'false';
  				api.count = parseFloat( searchParams.get( 'count' ) || '4000' );
  
  				const count = api.count;
  
  				// camera
  
  				const aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  
  				
  				camera.position.z = 50;
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  				// scene
  
  				
  				scene.background = new THREE.Color( 0xc1c1c1 );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3.4 );
  				scene.add( light );
  
  
  
  				initGeometries();
  				initMesh( count );
  
  				
  				controls.autoRotate = true;
  				controls.autoRotateSpeed = 1.0;
  
  				// gui
  
  				gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( api, 'renderBundle' ).name( 'render bundle' ).onChange( reload );
  
  				gui.add( api, 'webgpu' ).onChange( reload );
  
  				gui.add( api, 'dynamic' ).onChange( () => {
  
  					group.static = ! group.static;
  
  				} );
  
  
  				// listeners
  
  				
  
  				
  
  				function reload() {
  
  					const backendParam = 'backend=' + ( api.webgpu ? 'webgpu' : 'webgl' );
  					const renderBundleParam = '&renderBundle=' + ( api.renderBundle ? 'true' : 'false' );
  					const countParam = '&count=' + api.count;
  
  					location.href = location.pathname + '?' + backendParam + renderBundleParam + countParam; // relative redirect with parameters
  
  				}
  
  				__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    if ( api.dynamic === false ) return;
    					// rotate the regular meshes
    					for ( let i = 0; i < api.count; i ++ ) {
    						const child = group.children[ i ];
    						const rotationSpeed = child.userData.rotationSpeed;
    						child.rotation.set(
    							child.rotation.x + rotationSpeed.x,
    							child.rotation.y + rotationSpeed.y,
    							child.rotation.z + rotationSpeed.z
    						);
    					}
    					// rotate each instance of the instanced mesh individually
    					const rotationSpeeds = instancedMesh.userData.rotationSpeeds;
    					for ( let i = 0; i < instancedMesh.count; i ++ ) {
    						rotationMatrix.makeRotationFromEuler( rotationSpeeds[ i ] );
    						instancedMesh.getMatrixAt( i, instanceMatrix );
    						instanceMatrix.multiply( rotationMatrix );
    						instancedMesh.setMatrixAt( i, instanceMatrix );
    					}
    					instancedMesh.instanceMatrix.needsUpdate = true;
    }
  })
  
  				function animateMeshes() {
  
  					if ( api.dynamic === false ) return;
  
  					// rotate the regular meshes
  
  					for ( let i = 0; i < api.count; i ++ ) {
  
  						const child = group.children[ i ];
  						const rotationSpeed = child.userData.rotationSpeed;
  
  						child.rotation.set(
  							child.rotation.x + rotationSpeed.x,
  							child.rotation.y + rotationSpeed.y,
  							child.rotation.z + rotationSpeed.z
  						);
  
  					}
  
  					// rotate each instance of the instanced mesh individually
  
  					const rotationSpeeds = instancedMesh.userData.rotationSpeeds;
  
  					for ( let i = 0; i < instancedMesh.count; i ++ ) {
  
  						rotationMatrix.makeRotationFromEuler( rotationSpeeds[ i ] );
  
  						instancedMesh.getMatrixAt( i, instanceMatrix );
  						instanceMatrix.multiply( rotationMatrix );
  						instancedMesh.setMatrixAt( i, instanceMatrix );
  
  					}
  
  					instancedMesh.instanceMatrix.needsUpdate = true;
  
  				}
  
  			
  
  
  		
}
</script>
