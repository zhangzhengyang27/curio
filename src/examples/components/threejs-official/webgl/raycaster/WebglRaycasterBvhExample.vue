<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 1, far: 100 }"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
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
import { onUnmounted } from 'vue'

let gui: any = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, BVHHelper } from 'three-mesh-bvh';
import { patchPrototype, restorePrototype } from '@/examples/composables/usePrototypePatch';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> raycaster - <a href=\"https://github.com/gkjohnson/three-mesh-bvh\" target=\"_blank\" rel=\"noopener\">three-mesh-bvh</a><br/>\n\t\t\tSee <a href=\"https://github.com/gkjohnson/three-mesh-bvh\" target=\"_blank\" rel=\"noopener\">main project repository</a> for more information and examples on high performance spatial queries."
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			patchPrototype(THREE.BufferGeometry, 'computeBoundsTree', computeBoundsTree);
			patchPrototype(THREE.BufferGeometry, 'disposeBoundsTree', disposeBoundsTree);
			patchPrototype(THREE.Mesh, 'raycast', acceleratedRaycast);
  
  			let stats;
  
  			let mesh: any, helper: any, bvh: any;
  			let sphereInstance: any, lineSegments: any;
  
  			// reusable variables
  			const _raycaster = new THREE.Raycaster();
  			const _position = new THREE.Vector3();
  			const _quaternion = new THREE.Quaternion();
  			const _scale = new THREE.Vector3( 1, 1, 1 );
  			const _matrix = new THREE.Matrix4();
  			const _axis = new THREE.Vector3();
  			const MAX_RAYS = 3000;
  			const RAY_COLOR = 0x444444;
  
  			const params = {
  
  				count: 150,
  				firstHitOnly: true,
  				useBVH: true,
  
  				displayHelper: false,
  				helperDepth: 10,
  
  			};
  
  			
  
  
  				// environment
  				
  				camera.position.z = 10;
  
  				
  				scene.background = new THREE.Color( 0xeeeeee );
  
  				const ambient = new THREE.HemisphereLight( 0xffffff, 0x999999, 3 );
  				scene.add( ambient );
  
  				// renderer
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				// raycast visualizations
  				const lineGeometry = new THREE.BufferGeometry();
  				lineGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( MAX_RAYS * 2 * 3 ), 3 ) );
  				lineSegments = new THREE.LineSegments( lineGeometry, new THREE.LineBasicMaterial( {
  					color: RAY_COLOR,
  					transparent: true,
  					opacity: 0.25,
  					depthWrite: false
  				} ) );
  
  				sphereInstance = new THREE.InstancedMesh(
  					new THREE.SphereGeometry(),
  					new THREE.MeshBasicMaterial( { color: RAY_COLOR } ),
  					2 * MAX_RAYS
  				);
  				sphereInstance.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
  				sphereInstance.count = 0;
  
  				scene.add( sphereInstance, lineSegments );
  
  				// load the bunny
  				const loader = new FBXLoader();
  				loader.load( ASSET_HOST + 'models/fbx/stanford-bunny.fbx', object => {
  
  					mesh = object.children[ 0 ];
  
  					const geometry = mesh.geometry;
  					geometry.translate( 0, 0.5 / 0.0075, 0 );
  					geometry.computeBoundsTree();
  					bvh = geometry.boundsTree;
  
  					if ( ! params.useBVH ) {
  
  						geometry.boundsTree = null;
  
  					}
  
  					scene.add( mesh );
  					mesh.scale.setScalar( 0.0075 );
  
  					helper = new BVHHelper( mesh );
  					helper.color.set( 0xE91E63 );
  					scene.add( helper );
  
  				} );
  
  
  				controls.minDistance = 5;
  				controls.maxDistance = 75;
  
  				// set up gui
  				gui = new GUI();
  				const rayFolder = gui.addFolder( 'Raycasting' );
  				rayFolder.add( params, 'count', 1, MAX_RAYS, 1 );
  				rayFolder.add( params, 'firstHitOnly' );
  				rayFolder.add( params, 'useBVH' ).onChange( (v: any) => {
  
  					mesh.geometry.boundsTree = v ? bvh : null;
  
  				} );
  
  				const helperFolder = gui.addFolder( 'BVH Helper' );
  				helperFolder.add( params, 'displayHelper' );
  				helperFolder.add( params, 'helperDepth', 1, 20, 1 ).onChange( (v: any) => {
  
  					helper.depth = v;
  					helper.update();
  
  				} );
  
  				
  				onWindowResize();

				function onWindowResize() {
					const w = __stage.container?.clientWidth || window.innerWidth
					const h = __stage.container?.clientHeight || window.innerHeight
					camera.aspect = w / h
					camera.updateProjectionMatrix()
					renderer.setSize(w, h)
				}

  				initRays();
  
  			
  
  
  			function initRays() {
  
  				const position = new THREE.Vector3();
  				const quaternion = new THREE.Quaternion();
  				const scale = new THREE.Vector3( 1, 1, 1 );
  				const matrix = new THREE.Matrix4();
  
  				for ( let i = 0; i < MAX_RAYS * 2; i ++ ) {
  
  					position.randomDirection().multiplyScalar( 3.75 );
  					matrix.compose( position, quaternion, scale );
  					sphereInstance.setMatrixAt( i, matrix );
  
  				}
  
  			}
  
  			function updateRays() {
  
  				if ( ! mesh ) return;
  
  				_raycaster.firstHitOnly = params.firstHitOnly;
  				const rayCount = params.count;
  
  				let lineNum = 0;
  				for ( let i = 0; i < rayCount; i ++ ) {
  
  					// get the current ray origin
  					sphereInstance.getMatrixAt( i * 2, _matrix );
  					_matrix.decompose( _position, _quaternion, _scale );
  
  					// rotate it about the origin
  					const offset = 1e-4 * window.performance.now();
  					_axis.set(
  						Math.sin( i * 100 + offset ),
  						Math.cos( - i * 10 + offset ),
  						Math.sin( i * 1 + offset ),
  					).normalize();
  					_position.applyAxisAngle( _axis, 0.001 );
  
  					// update the position
  					_scale.setScalar( 0.02 );
  					_matrix.compose( _position, _quaternion, _scale );
  					sphereInstance.setMatrixAt( i * 2, _matrix );
  
  					// raycast
  					_raycaster.ray.origin.copy( _position );
  					_raycaster.ray.direction.copy( _position ).multiplyScalar( - 1 ).normalize();
  
  					// update hits points and lines
  					const hits = _raycaster.intersectObject( mesh );
  					if ( hits.length !== 0 ) {
  
  						const hit = hits[ 0 ];
  						const point = hit.point;
  						_scale.setScalar( 0.01 );
  						_matrix.compose( point, _quaternion, _scale );
  						sphereInstance.setMatrixAt( i * 2 + 1, _matrix );
  
  						lineSegments.geometry.attributes.position.setXYZ( lineNum ++, _position.x, _position.y, _position.z );
  						lineSegments.geometry.attributes.position.setXYZ( lineNum ++, point.x, point.y, point.z );
  
  					} else {
  
  						sphereInstance.setMatrixAt( i * 2 + 1, _matrix );
  						lineSegments.geometry.attributes.position.setXYZ( lineNum ++, _position.x, _position.y, _position.z );
  						lineSegments.geometry.attributes.position.setXYZ( lineNum ++, 0, 0, 0 );
  
  					}
  
  				}
  
  				sphereInstance.count = rayCount * 2;
  				sphereInstance.instanceMatrix.needsUpdate = true;
  
  				lineSegments.geometry.setDrawRange( 0, lineNum );
  				lineSegments.geometry.attributes.position.needsUpdate = true;
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    if ( helper ) {
    					helper.visible = params.displayHelper;
    				}
    				if ( mesh ) {
    					mesh.rotation.y += 0.002;
    					mesh.updateMatrixWorld();
    				}
    {
    if ( ! mesh ) return;
    				_raycaster.firstHitOnly = params.firstHitOnly;
    				const rayCount = params.count;
    				let lineNum = 0;
    				for ( let i = 0; i < rayCount; i ++ ) {
    					// get the current ray origin
    					sphereInstance.getMatrixAt( i * 2, _matrix );
    					_matrix.decompose( _position, _quaternion, _scale );
    					// rotate it about the origin
    					const offset = 1e-4 * window.performance.now();
    					_axis.set(
    						Math.sin( i * 100 + offset ),
    						Math.cos( - i * 10 + offset ),
    						Math.sin( i * 1 + offset ),
    					).normalize();
    					_position.applyAxisAngle( _axis, 0.001 );
    					// update the position
    					_scale.setScalar( 0.02 );
    					_matrix.compose( _position, _quaternion, _scale );
    					sphereInstance.setMatrixAt( i * 2, _matrix );
    					// raycast
    					_raycaster.ray.origin.copy( _position );
    					_raycaster.ray.direction.copy( _position ).multiplyScalar( - 1 ).normalize();
    					// update hits points and lines
    					const hits = _raycaster.intersectObject( mesh );
    					if ( hits.length !== 0 ) {
    						const hit = hits[ 0 ];
    						const point = hit.point;
    						_scale.setScalar( 0.01 );
    						_matrix.compose( point, _quaternion, _scale );
    						sphereInstance.setMatrixAt( i * 2 + 1, _matrix );
    						lineSegments.geometry.attributes.position.setXYZ( lineNum ++, _position.x, _position.y, _position.z );
    						lineSegments.geometry.attributes.position.setXYZ( lineNum ++, point.x, point.y, point.z );
    					} else {
    						sphereInstance.setMatrixAt( i * 2 + 1, _matrix );
    						lineSegments.geometry.attributes.position.setXYZ( lineNum ++, _position.x, _position.y, _position.z );
    						lineSegments.geometry.attributes.position.setXYZ( lineNum ++, 0, 0, 0 );
    					}
    				}
    				sphereInstance.count = rayCount * 2;
    				sphereInstance.instanceMatrix.needsUpdate = true;
    				lineSegments.geometry.setDrawRange( 0, lineNum );
    				lineSegments.geometry.attributes.position.needsUpdate = true;
    }
    }
    				stats.update();
  })
  
  		function render() {
  
  				if ( helper ) {
  
  					helper.visible = params.displayHelper;
  
  				}
  
  				if ( mesh ) {
  
  					mesh.rotation.y += 0.002;
  					mesh.updateMatrixWorld();
  
  				}
  
  				updateRays();
  
  
  
  			}
  
}

function onBeforeDispose() {
  restorePrototype(THREE.BufferGeometry, 'computeBoundsTree')
  restorePrototype(THREE.BufferGeometry, 'disposeBoundsTree')
  restorePrototype(THREE.Mesh, 'raycast')
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
