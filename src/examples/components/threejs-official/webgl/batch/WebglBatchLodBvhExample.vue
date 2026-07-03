<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 20, 55]"
    :camera-options="{ fov: 50, near: 0.1, far: 1000 }"
    :enable-controls="false"
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

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { acceleratedRaycast, computeBatchedBoundsTree } from 'three-mesh-bvh';
import { createRadixSort, extendBatchedMeshPrototype, getBatchedMeshLODCount } from '@three.ez/batched-mesh-extensions';
import { performanceRangeLOD, simplifyGeometriesByErrorLOD } from '@three.ez/simplify-geometry';
import { patchPrototype, restorePrototype } from '@/examples/composables/usePrototypePatch.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> batch lod bvh - <a href=\"https://github.com/agargaro/batched-mesh-extensions\" target=\"_blank\" rel=\"noopener\">@three.ez/batched-mesh-extensions</a><br/>\n\t\t\tBatchedMesh with 10 geometries and 500k instances.<br>\n\t\t\tEach geometry has 5 LODs (4 generated with meshoptimizer). <br>\n\t\t\tFrustum culling and raycasting are accelerated by using BVHs (TLAS & BLAS). <br>"
async function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			extendBatchedMeshPrototype();
  
			patchPrototype(THREE.Mesh, 'raycast', acceleratedRaycast);
			patchPrototype(THREE.BatchedMesh, 'computeBoundsTree', computeBatchedBoundsTree);
  
  			let stats;
  
  
  			const instancesCount = 500000;
  
  			let lastHoveredInstance = null;
  			const lastHoveredColor = new THREE.Color();
  			const highlight = new THREE.Color( 'red' );
  
  			const raycaster = new THREE.Raycaster();
  			const mouse = new THREE.Vector2( 1, 1 );
  			const position = new THREE.Vector3();
  			const quaternion = new THREE.Quaternion();
  			const scale = new THREE.Vector3( 1, 1, 1 );
  			const matrix = new THREE.Matrix4();
  			const color = new THREE.Color();
  
  			
  			async 
  
  
  				// renderer
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 0.8;
  
  
  				//
  
  				
  
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  				scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
  
  				//
  
  				
  
  
  				//
  
  				raycaster.firstHitOnly = true;
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  
  				controls.maxPolarAngle = Math.PI / 2;
  
  				const geometries = [
  					new THREE.TorusKnotGeometry( 1, 0.4, 256, 32, 1, 1 ),
  					new THREE.TorusKnotGeometry( 1, 0.4, 256, 32, 1, 2 ),
  					new THREE.TorusKnotGeometry( 1, 0.4, 256, 32, 1, 3 ),
  					new THREE.TorusKnotGeometry( 1, 0.4, 256, 32, 1, 4 ),
  					new THREE.TorusKnotGeometry( 1, 0.4, 256, 32, 1, 5 ),
  					new THREE.TorusKnotGeometry( 1, 0.4, 256, 32, 2, 1 ),
  					new THREE.TorusKnotGeometry( 1, 0.4, 256, 32, 2, 3 ),
  					new THREE.TorusKnotGeometry( 1, 0.4, 256, 32, 3, 1 ),
  					new THREE.TorusKnotGeometry( 1, 0.4, 256, 32, 4, 1 ),
  					new THREE.TorusKnotGeometry( 1, 0.4, 256, 32, 5, 3 )
  				];
  
  				// generate 4 LODs (levels of detail) for each geometry
  				const geometriesLODArray = await simplifyGeometriesByErrorLOD( geometries, 4, performanceRangeLOD );
  
  				// create BatchedMesh
  				const { vertexCount, indexCount, LODIndexCount } = getBatchedMeshLODCount( geometriesLODArray );
  				batchedMesh = new THREE.BatchedMesh( instancesCount, vertexCount, indexCount, new THREE.MeshStandardMaterial( { metalness: 1, roughness: 0.8 } ) );
  
  				// enable radix sort for better performance
  				batchedMesh.customSort = createRadixSort( batchedMesh );
  
  				// add geometries and their LODs to the batched mesh ( all LODs share the same position array )
  				for ( let i = 0; i < geometriesLODArray.length; i ++ ) {
  
  					const geometryLOD = geometriesLODArray[ i ];
  					const geometryId = batchedMesh.addGeometry( geometryLOD[ 0 ], - 1, LODIndexCount[ i ] );
  					batchedMesh.addGeometryLOD( geometryId, geometryLOD[ 1 ], 0.08 ); // used when below ~8% of the screen height
  					batchedMesh.addGeometryLOD( geometryId, geometryLOD[ 2 ], 0.04 ); // below ~4%
  					batchedMesh.addGeometryLOD( geometryId, geometryLOD[ 3 ], 0.033 ); // below ~3.3%
  					batchedMesh.addGeometryLOD( geometryId, geometryLOD[ 4 ], 0.02 ); // below ~2%
  			
  				}
  
  				// place instances in a 2D grid with randomized rotation and color
  				const sqrtCount = Math.ceil( Math.sqrt( instancesCount ) );
  				const size = 5.5;
  				const start = ( sqrtCount / - 2 * size ) + ( size / 2 );
  
  				for ( let i = 0; i < instancesCount; i ++ ) {
  
  					const r = Math.floor( i / sqrtCount );
  					const c = i % sqrtCount;
  					const id = batchedMesh.addInstance( Math.floor( Math.random() * geometriesLODArray.length ) );
  					position.set( c * size + start, 0, r * size + start );
  					quaternion.random();
  					batchedMesh.setMatrixAt( id, matrix.compose( position, quaternion, scale ) );
  					batchedMesh.setColorAt( id, color.setHSL( Math.random(), 0.6, 0.5 ) );
  			
  				}
  
  				// compute blas (bottom-level acceleration structure) bvh ( three-mesh-bvh )
  				batchedMesh.computeBoundsTree();
  
  				// compute tlas (top-level acceleration structure) bvh ( @three.ez/batched-mesh-extensions )
  				batchedMesh.computeBVH( THREE.WebGLCoordinateSystem );
  			
  				scene.add( batchedMesh );
  			
  				// set up gui
  				const config = {
  					freeze: false,
  					useBVH: true,
  					useLOD: true
  				};
  			
  				const bvh = batchedMesh.bvh;
  				const lods = batchedMesh._geometryInfo.map( x => x.LOD );
  				const onBeforeRender = batchedMesh.onBeforeRender;
  			
  				const gui = new GUI();
  
  				gui.add( batchedMesh, 'instanceCount' ).disable();
  			
  				gui.add( config, 'freeze' ).onChange( v => {
  
  					batchedMesh.onBeforeRender = v ? () => {} : onBeforeRender;
  
  				} );
  
  				const frustumCullingFolder = gui.addFolder( 'Frustum culling & raycasting' );
  				frustumCullingFolder.add( config, 'useBVH' ).onChange( v => {
  
  					batchedMesh.bvh = v ? bvh : null;
  
  				} );
  
  				const geometriesFolder = gui.addFolder( 'Geometries' );
  				geometriesFolder.add( config, 'useLOD' ).onChange( v => {
  
  					const geometryInfo = batchedMesh._geometryInfo;
  					for ( let i = 0; i < geometryInfo.length; i ++ ) {
  
  						geometryInfo[ i ].LOD = v ? lods[ i ] : null;
  
  					}
  
  				} );
  
  				document.addEventListener( 'pointermove', onPointerMove );
  				
  				onWindowResize();
  			
  				
  
  
  
  			function onPointerMove( event ) {
  
  				event.preventDefault();
  
  				mouse.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  				mouse.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  				raycast();
  
  			}
  			
  
  			
  
  			function raycast() {
  
  				raycaster.setFromCamera( mouse, camera );
  				const intersection = raycaster.intersectObject( batchedMesh );
  
  				const batchId = intersection.length > 0 ? intersection[ 0 ].batchId : null;
  			
  				if ( lastHoveredInstance === batchId ) return;
  
  				if ( lastHoveredInstance ) {
  
  					batchedMesh.setColorAt( lastHoveredInstance, lastHoveredColor );
  			
  				}
  
  				if ( batchId ) {
  
  					batchedMesh.getColorAt( batchId, lastHoveredColor );
  					batchedMesh.setColorAt( batchId, highlight );
  			
  				}
  
  				lastHoveredInstance = batchId;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.begin();
    				stats.end();
  })

}

function onBeforeDispose() {
  restorePrototype(THREE.Mesh, 'raycast')
  restorePrototype(THREE.BatchedMesh, 'computeBoundsTree')
}
</script>
