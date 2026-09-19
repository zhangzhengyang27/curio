<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 27, near: 0.1, far: 100 }"
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> wegbl - modified material.\n\t\t\t<a href=\"https://casual-effects.com/data/\" target=\"_blank\" rel=\"noopener\">Lee Perry-Smith</a> head."
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats;
  
  			
  
  
  				
  				camera.position.z = 20;
  
  				
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/LeePerrySmith/LeePerrySmith.glb', function ( gltf ) {
  
  					const geometry = gltf.scene.children[ 0 ].geometry;
  
  					let mesh = new THREE.Mesh( geometry, buildTwistMaterial( 2.0 ) );
  					mesh.position.x = - 3.5;
  					mesh.position.y = - 0.5;
  					scene.add( mesh );
  
  					mesh = new THREE.Mesh( geometry, buildTwistMaterial( - 2.0 ) );
  					mesh.position.x = 3.5;
  					mesh.position.y = - 0.5;
  					scene.add( mesh );
  
  				} );
  
  				
  
  
  				controls.minDistance = 10;
  				controls.maxDistance = 50;
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				// EVENTS
  
  				
  
  			
  
  
  			function buildTwistMaterial( amount: any ) {
  
  				const material = new THREE.MeshNormalMaterial();
  				material.onBeforeCompile = function ( shader ) {
  
  					shader.uniforms.time = { value: 0 };
  
  					shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
  					shader.vertexShader = shader.vertexShader.replace(
  						'#include <begin_vertex>',
  						[
  							`float theta = sin( time + position.y ) / ${ amount.toFixed( 1 ) };`,
  							'float c = cos( theta );',
  							'float s = sin( theta );',
  							'mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );',
  							'vec3 transformed = vec3( position ) * m;',
  							'vNormal = vNormal * m;'
  						].join( '\n' )
  					);
  
  					material.userData.shader = shader;
  
  				};
  
  				// Make sure WebGLRenderer doesn't reuse a single program
  
  				material.customProgramCacheKey = function () {
  
  					return amount.toFixed( 1 );
  
  				};
  
  				return material;
  
  			}
  
  			//
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    scene.traverse( function ( child: any ) {
    					if ( child.isMesh ) {
    						const shader = child.material.userData.shader;
    						if ( shader ) {
    							shader.uniforms.time.value = performance.now() / 1000;
    						}
    					}
    				} );
    }
    				stats.update();
  })
  
  			function render() {
  
  				scene.traverse( function ( child: any ) {
  
  					if ( child.isMesh ) {
  
  						const shader = child.material.userData.shader;
  
  						if ( shader ) {
  
  							shader.uniforms.time.value = performance.now() / 1000;
  
  						}
  
  					}
  
  				} );
  
  
  
  			}
  
  		
}
</script>
