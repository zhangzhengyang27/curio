<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[7, 13, 7]"
    :camera-options="{ fov: 30, near: 1, far: 10000 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "Percent Closer Soft-Shadows (PCSS) by <a href=\"http://eduperiment.com\">spidersharma03</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  const PCSS = "\n\n\t\t\t\t#define LIGHT_WORLD_SIZE 0.005\n\t\t\t\t#define LIGHT_FRUSTUM_WIDTH 3.75\n\t\t\t\t#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)\n\t\t\t\t#define NEAR_PLANE 9.5\n\n\t\t\t\t#define NUM_SAMPLES 17\n\t\t\t\t#define NUM_RINGS 11\n\t\t\t\t#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES\n\n\t\t\t\tvec2 poissonDisk[NUM_SAMPLES];\n\n\t\t\t\tvoid initPoissonSamples( const in vec2 randomSeed ) {\n\t\t\t\t\tfloat ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );\n\t\t\t\t\tfloat INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );\n\n\t\t\t\t\t// jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/\n\t\t\t\t\tfloat angle = rand( randomSeed ) * PI2;\n\t\t\t\t\tfloat radius = INV_NUM_SAMPLES;\n\t\t\t\t\tfloat radiusStep = radius;\n\n\t\t\t\t\tfor( int i = 0; i < NUM_SAMPLES; i ++ ) {\n\t\t\t\t\t\tpoissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );\n\t\t\t\t\t\tradius += radiusStep;\n\t\t\t\t\t\tangle += ANGLE_STEP;\n\t\t\t\t\t}\n\t\t\t\t}\n\n\t\t\t\tfloat penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation\n\t\t\t\t\treturn (zReceiver - zBlocker) / zBlocker;\n\t\t\t\t}\n\n\t\t\t\tfloat findBlocker( sampler2D shadowMap, const in vec2 uv, const in float zReceiver ) {\n\t\t\t\t\t// This uses similar triangles to compute what\n\t\t\t\t\t// area of the shadow map we should search\n\t\t\t\t\tfloat searchRadius = LIGHT_SIZE_UV * ( zReceiver - NEAR_PLANE ) / zReceiver;\n\t\t\t\t\tfloat blockerDepthSum = 0.0;\n\t\t\t\t\tint numBlockers = 0;\n\n\t\t\t\t\tfor( int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++ ) {\n\t\t\t\t\t\tfloat shadowMapDepth = texture2D(shadowMap, uv + poissonDisk[i] * searchRadius).r;\n\t\t\t\t\t\tif ( shadowMapDepth < zReceiver ) {\n\t\t\t\t\t\t\tblockerDepthSum += shadowMapDepth;\n\t\t\t\t\t\t\tnumBlockers ++;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\tif( numBlockers == 0 ) return -1.0;\n\n\t\t\t\t\treturn blockerDepthSum / float( numBlockers );\n\t\t\t\t}\n\n\t\t\t\tfloat PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius ) {\n\t\t\t\t\tfloat sum = 0.0;\n\t\t\t\t\tfloat depth;\n\t\t\t\t\t#pragma unroll_loop_start\n\t\t\t\t\tfor( int i = 0; i < 17; i ++ ) {\n\t\t\t\t\t\tdepth = texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ).r;\n\t\t\t\t\t\tif( zReceiver <= depth ) sum += 1.0;\n\t\t\t\t\t}\n\t\t\t\t\t#pragma unroll_loop_end\n\t\t\t\t\t#pragma unroll_loop_start\n\t\t\t\t\tfor( int i = 0; i < 17; i ++ ) {\n\t\t\t\t\t\tdepth = texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ).r;\n\t\t\t\t\t\tif( zReceiver <= depth ) sum += 1.0;\n\t\t\t\t\t}\n\t\t\t\t\t#pragma unroll_loop_end\n\t\t\t\t\treturn sum / ( 2.0 * float( 17 ) );\n\t\t\t\t}\n\n\t\t\t\tfloat PCSS ( sampler2D shadowMap, vec4 coords ) {\n\t\t\t\t\tvec2 uv = coords.xy;\n\t\t\t\t\tfloat zReceiver = coords.z; // Assumed to be eye-space z in this code\n\n\t\t\t\t\tinitPoissonSamples( uv );\n\t\t\t\t\t// STEP 1: blocker search\n\t\t\t\t\tfloat avgBlockerDepth = findBlocker( shadowMap, uv, zReceiver );\n\n\t\t\t\t\t//There are no occluders so early out (this saves filtering)\n\t\t\t\t\tif( avgBlockerDepth == -1.0 ) return 1.0;\n\n\t\t\t\t\t// STEP 2: penumbra size\n\t\t\t\t\tfloat penumbraRatio = penumbraSize( zReceiver, avgBlockerDepth );\n\t\t\t\t\tfloat filterRadius = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;\n\n\t\t\t\t\t// STEP 3: filtering\n\t\t\t\t\t//return avgBlockerDepth;\n\t\t\t\t\treturn PCF_Filter( shadowMap, uv, zReceiver, filterRadius );\n\t\t\t\t}\n\n\t\t";
  const PCSSGetShadow = "\n\n\t\t\treturn PCSS( shadowMap, shadowCoord );\n\n\t\t";
  
  
  
  
  
  			let stats;
  
  
  			let group;
  
  			
  
  
  				
  
  				// scene
  
  				
  				scene.fog = new THREE.Fog( 0xcce0ff, 5, 100 );
  
  				// camera
  
  				
  
  				// We use this particular camera position in order to expose a bug that can sometimes happen presumably
  				// due to lack of precision when interpolating values over really large triangles.
  				// It reproduced on at least NVIDIA GTX 1080 and GTX 1050 Ti GPUs when the ground plane was not
  				// subdivided into segments.
  				camera.position.x = 7;
  				camera.position.y = 13;
  				camera.position.z = 7;
  
  				scene.add( camera );
  
  				// lights
  
  				scene.add( new THREE.AmbientLight( 0xaaaaaa, 3 ) );
  
  				const light = new THREE.DirectionalLight( 0xf0f6ff, 4.5 );
  				light.position.set( 2, 8, 4 );
  
  				light.castShadow = true;
  				light.shadow.mapSize.width = 1024;
  				light.shadow.mapSize.height = 1024;
  				light.shadow.camera.far = 20;
  
  				scene.add( light );
  
  				// scene.add( new DirectionalLightHelper( light ) );
  				scene.add( new THREE.CameraHelper( light.shadow.camera ) );
  
  				// group
  
  				group = new THREE.Group();
  				scene.add( group );
  
  				const geometry = new THREE.SphereGeometry( 0.3, 20, 20 );
  
  				for ( let i = 0; i < 20; i ++ ) {
  
  					const material = new THREE.MeshPhongMaterial( { color: Math.random() * 0xffffff } );
  
  					const sphere = new THREE.Mesh( geometry, material );
  					sphere.position.x = Math.random() - 0.5;
  					sphere.position.z = Math.random() - 0.5;
  					sphere.position.normalize();
  					sphere.position.multiplyScalar( Math.random() * 2 + 1 );
  					sphere.castShadow = true;
  					sphere.receiveShadow = true;
  					sphere.userData.phase = Math.random() * Math.PI;
  					group.add( sphere );
  
  				}
  
  				// ground
  
  				const groundMaterial = new THREE.MeshPhongMaterial( { color: 0x898989 } );
  
  				const ground = new THREE.Mesh( new THREE.PlaneGeometry( 20000, 20000, 8, 8 ), groundMaterial );
  				ground.rotation.x = - Math.PI / 2;
  				ground.receiveShadow = true;
  				scene.add( ground );
  
  				// column
  
  				const column = new THREE.Mesh( new THREE.BoxGeometry( 1, 4, 1 ), groundMaterial );
  				column.position.y = 2;
  				column.castShadow = true;
  				column.receiveShadow = true;
  				scene.add( column );
  
  				// overwrite shadowmap code
  
  				let shader = THREE.ShaderChunk.shadowmap_pars_fragment;
  
  				shader = shader.replace(
  					'#ifdef USE_SHADOWMAP',
  					'#ifdef USE_SHADOWMAP' +
  					PCSS
  				);
  
  				shader = shader.replace(
  					'\t\t\tif ( frustumTest ) {\n\t\t\t\tfloat depth = texture2D( shadowMap, shadowCoord.xy ).r;',
  					'\t\t\tif ( frustumTest ) {\n' +
  					PCSSGetShadow + '\n' +
  					'\t\t\t\tfloat depth = texture2D( shadowMap, shadowCoord.xy ).r;'
  				);
  
  				THREE.ShaderChunk.shadowmap_pars_fragment = shader;
  
  				// renderer
  
  				
  
  
  				renderer.setClearColor( scene.fog.color );
  
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.shadowMap.type = THREE.BasicShadowMap; // PCSS requires reading raw depth values
  
  				// controls
  
  				controls.maxPolarAngle = Math.PI * 0.5;
  				controls.minDistance = 10;
  				controls.maxDistance = 75;
  				controls.target.set( 0, 2.5, 0 );
  				controls.update();
  
  				// performance monitor
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			//
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = performance.now() / 1000;
    				group.traverse( function ( child ) {
    					if ( 'phase' in child.userData ) {
    						child.position.y = Math.abs( Math.sin( time + child.userData.phase ) ) * 4 + 0.3;
    					}
    				} );
    				stats.update();
  })
  
  		
}
</script>
