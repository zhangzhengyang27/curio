<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 50, near: 1, far: 10 }"
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
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - instancing demo (single triangle)\n\t\t<div id=\"notSupported\" style=\"display:none\">Sorry your graphics card + browser does not support hardware instancing"

const vertexShader = /* glsl */`
  precision highp float;

  uniform float time;
  uniform float sineTime;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  attribute vec3 position;
  attribute vec3 offset;
  attribute vec4 color;
  attribute vec4 orientationStart;
  attribute vec4 orientationEnd;

  varying vec3 vPosition;
  varying vec4 vColor;

  void main() {
    vPosition = position * max( abs( sineTime * 10.0 ), 0.1 ) + offset;
    vec4 orientation = normalize( mix( orientationStart, orientationEnd, sineTime ) );
    vec3 vcV = cross( orientation.xyz, vPosition );
    vPosition = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + vPosition );
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
  }
`;

const fragmentShader = /* glsl */`
  precision highp float;

  uniform float time;

  varying vec3 vPosition;
  varying vec4 vColor;

  void main() {
    vec4 color = vec4( vColor );
    color.r += sin( vPosition.x * 10.0 + time ) * 0.5;
    gl_FragColor = color;
  }
`;

function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  		let container, stats;
  
  
  		
  
  
  			container = __stage.container;
  
  			
  			camera.position.z = 2;
  
  			
  
  			// geometry
  
  			const vector = new THREE.Vector4();
  
  			const instances = 50000;
  
  			const positions = [];
  			const offsets = [];
  			const colors = [];
  			const orientationsStart = [];
  			const orientationsEnd = [];
  
  			positions.push( 0.025, - 0.025, 0 );
  			positions.push( - 0.025, 0.025, 0 );
  			positions.push( 0, 0, 0.025 );
  
  			// instanced attributes
  
  			for ( let i = 0; i < instances; i ++ ) {
  
  				// offsets
  
  				offsets.push( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
  
  				// colors
  
  				colors.push( Math.random(), Math.random(), Math.random(), Math.random() );
  
  				// orientation start
  
  				vector.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
  				vector.normalize();
  
  				orientationsStart.push( vector.x, vector.y, vector.z, vector.w );
  
  				// orientation end
  
  				vector.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
  				vector.normalize();
  
  				orientationsEnd.push( vector.x, vector.y, vector.z, vector.w );
  
  			}
  
  			const geometry = new THREE.InstancedBufferGeometry();
  			geometry.instanceCount = instances;
  
  			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
  
  			geometry.setAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
  			geometry.setAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 4 ) );
  			geometry.setAttribute( 'orientationStart', new THREE.InstancedBufferAttribute( new Float32Array( orientationsStart ), 4 ) );
  			geometry.setAttribute( 'orientationEnd', new THREE.InstancedBufferAttribute( new Float32Array( orientationsEnd ), 4 ) );
  
  			// material
  
  			const material = new THREE.RawShaderMaterial( {
  
  				uniforms: {
  					'time': { value: 1.0 },
  					'sineTime': { value: 1.0 }
  				},
  				vertexShader: vertexShader,
  				fragmentShader: fragmentShader,
  				side: THREE.DoubleSide,
  				forceSinglePass: true,
  				transparent: true
  
  			} );
  
  			//
  
  			const mesh = new THREE.Mesh( geometry, material );
  			scene.add( mesh );
  
  			//
  
  			
  
  
  			//
  
  			gui = new GUI( { width: 350 } );
  			gui.add( geometry, 'instanceCount', 0, instances );
  
  			//
  
  			stats = new Stats();
  			__stage.overlay?.appendChild(stats.dom)
  
  			//
  
  			
  
  		
  
  
  		
  
  		//
  
  		__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = performance.now();
    			const object = scene.children[ 0 ];
    			object.rotation.y = time * 0.0005;
    			object.material.uniforms[ 'time' ].value = time * 0.005;
    			object.material.uniforms[ 'sineTime' ].value = Math.sin( object.material.uniforms[ 'time' ].value * 0.05 );
    			stats.update();
  })
  
  	
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
