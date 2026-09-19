<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-1, 1, 1]"
    :camera-options="{ fov: 50, near: 1, far: 100 }"
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
import { onUnmounted } from 'vue'

let gui: any = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { SUBTRACTION, INTERSECTION, ADDITION, Brush, Evaluator } from 'three-bvh-csg';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> bvh csg - <a href=\"https://github.com/gkjohnson/three-bvh-csg\" target=\"_blank\" rel=\"noopener\">three-bvh-csg</a><br/>\n\t\t\tSee <a href=\"https://github.com/gkjohnson/three-bvh-csg\" target=\"_blank\" rel=\"noopener\">main project repository</a> for more information and examples on constructive solid geometry."
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let stats;
  
  			let baseBrush: any, brush: any;
  			let core;
  			let result: any, evaluator: any, wireframe;
  
  			const params = {
  
  				operation: SUBTRACTION,
  				useGroups: true,
  				wireframe: false,
  
  			};
  
  			
  
  
  				// environment
  				
  
  
  				
  				scene.background = new THREE.Color( 0xfce4ec );
  
  				// lights
  				const ambient = new THREE.HemisphereLight( 0xffffff, 0xbfd4d2, 3 );
  				scene.add( ambient );
  
  				const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.3 );
  				directionalLight.position.set( 1, 4, 3 ).multiplyScalar( 3 );
  				directionalLight.castShadow = true;
  				directionalLight.shadow.mapSize.setScalar( 2048 );
  				directionalLight.shadow.bias = - 1e-4;
  				directionalLight.shadow.normalBias = 1e-4;
  				scene.add( directionalLight );
  
  				// renderer
  				
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.shadowMap.type = THREE.PCFShadowMap;
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				// add shadow plane
  				const plane = new THREE.Mesh(
  					new THREE.PlaneGeometry(),
  					new THREE.ShadowMaterial( {
  						color: 0xd81b60,
  						transparent: true,
  						opacity: 0.075,
  						side: THREE.DoubleSide,
  					} ),
  				);
  				plane.position.y = - 3;
  				plane.rotation.x = - Math.PI / 2;
  				plane.scale.setScalar( 10 );
  				plane.receiveShadow = true;
  				scene.add( plane );
  
  				// create brushes
  				evaluator = new Evaluator();
  
  				baseBrush = new Brush(
  					new THREE.IcosahedronGeometry( 2, 3 ),
  					new THREE.MeshStandardMaterial( {
  						flatShading: true,
  
  						polygonOffset: true,
  						polygonOffsetUnits: 1,
  						polygonOffsetFactor: 1,
  					} ),
  				);
  
  				brush = new Brush(
  					new THREE.CylinderGeometry( 1, 1, 5, 45 ),
  					new THREE.MeshStandardMaterial( {
  						color: 0x80cbc4,
  
  						polygonOffset: true,
  						polygonOffsetUnits: 1,
  						polygonOffsetFactor: 1,
  
  					} ),
  				);
  
  				core = new Brush(
  					new THREE.IcosahedronGeometry( 0.15, 1 ),
  					new THREE.MeshStandardMaterial( {
  						flatShading: true,
  						color: 0xff9800,
  						emissive: 0xff9800,
  						emissiveIntensity: 0.35,
  
  						polygonOffset: true,
  						polygonOffsetUnits: 1,
  						polygonOffsetFactor: 1,
  
  					} ),
  				);
  				core.castShadow = true;
  				scene.add( core );
  
  				// create wireframe
  				wireframe = new THREE.Mesh(
  					undefined,
  					new THREE.MeshBasicMaterial( { color: 0x009688, wireframe: true } ),
  				);
  				scene.add( wireframe );
  
  				// controls
  
  				controls.minDistance = 5;
  				controls.maxDistance = 75;
  
  				// set up gui
  				gui = new GUI();
  				gui.add( params, 'operation', { SUBTRACTION, INTERSECTION, ADDITION } );
  				gui.add( params, 'wireframe' );
  				gui.add( params, 'useGroups' );



  				function onWindowResize() {

  					camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  					camera.updateProjectionMatrix();

  					renderer.setSize( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );

  				}

  				onWindowResize();
  
  			
  
  
  			function updateCSG() {
  
  				evaluator.useGroups = params.useGroups;
  				result = evaluator.evaluate( baseBrush, brush, params.operation, result );
  
  				result.castShadow = true;
  				result.receiveShadow = true;
  				scene.add( result );
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    // update the transforms
    				const t = window.performance.now() + 9000;
    				baseBrush.rotation.x = t * 0.0001;
    				baseBrush.rotation.y = t * 0.00025;
    				baseBrush.rotation.z = t * 0.0005;
    				baseBrush.updateMatrixWorld();
    				brush.rotation.x = t * - 0.0002;
    				brush.rotation.y = t * - 0.0005;
    				brush.rotation.z = t * - 0.001;
    				const s = 0.5 + 0.5 * ( 1 + Math.sin( t * 0.001 ) );
    				brush.scale.set( s, 1, s );
    				brush.updateMatrixWorld();
    				// update the csg
    				updateCSG();
    				wireframe.geometry = result.geometry;
    				wireframe.visible = params.wireframe;
    				stats.update();
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
