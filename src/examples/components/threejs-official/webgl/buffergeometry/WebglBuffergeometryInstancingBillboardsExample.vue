<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 50, near: 1, far: 5000 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - instanced circle billboards - colors\n\t\t<div id=\"notSupported\" style=\"display:none\">Sorry, your graphics card + browser does not support hardware instancing"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  		let container, stats;
  
  		let geometry, material, mesh;
  
  		
  
  
  			
  			camera.position.z = 1400;
  
  			
  
  			const circleGeometry = new THREE.CircleGeometry( 1, 6 );
  
  			geometry = new THREE.InstancedBufferGeometry();
  			geometry.index = circleGeometry.index;
  			geometry.attributes = circleGeometry.attributes;
  
  			const particleCount = 75000;
  
  			const translateArray = new Float32Array( particleCount * 3 );
  
  			for ( let i = 0, i3 = 0, l = particleCount; i < l; i ++, i3 += 3 ) {
  
  				translateArray[ i3 + 0 ] = Math.random() * 2 - 1;
  				translateArray[ i3 + 1 ] = Math.random() * 2 - 1;
  				translateArray[ i3 + 2 ] = Math.random() * 2 - 1;
  
  			}
  
  			geometry.setAttribute( 'translate', new THREE.InstancedBufferAttribute( translateArray, 3 ) );
  
  			material = new THREE.RawShaderMaterial( {
  				uniforms: {
  					'map': { value: new THREE.TextureLoader().load( ASSET_HOST + 'textures/sprites/circle.png' ) },
  					'time': { value: 0.0 }
  				},
  				vertexShader: document.getElementById( 'vshader' ).textContent,
  				fragmentShader: document.getElementById( 'fshader' ).textContent,
  				depthTest: true,
  				depthWrite: true
  			} );
  
  			mesh = new THREE.Mesh( geometry, material );
  			mesh.scale.set( 500, 500, 500 );
  			scene.add( mesh );
  
  			
  
  
  			stats = new Stats();
  			__stage.overlay?.appendChild(stats.dom)
  
  			
  
  			return true;
  
  		
  
  
  		
  
  		__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = performance.now() * 0.0005;
    			material.uniforms[ 'time' ].value = time;
    			mesh.rotation.x = time * 0.2;
    			mesh.rotation.y = time * 0.4;
    			stats.update();
  })
  
  	
}
</script>
