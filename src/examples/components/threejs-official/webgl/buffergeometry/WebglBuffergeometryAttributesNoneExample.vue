<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 27, near: 1, far: 3500 }"
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

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> WebGL 2 - buffergeometry - attributes - none"

const vertexShader = /* glsl */`
  uniform float seed;

  uint hash( uint x ) {
    x += ( x << 10u );
    x ^= ( x >> 6u );
    x += ( x << 3u );
    x ^= ( x >> 11u );
    x += ( x << 15u );
    return x;
  }

  uint hash( uvec2 v ) {
    uint h = hash( v.x ) ^ hash( v.y + 0x9e3779b9u );
    return hash( h );
  }

  float random( uvec2 v ) {
    return float( hash( v ) ) / 4294967295.0;
  }

  out vec3 vColor;

  void main() {
    uint triangleID = uint( gl_VertexID ) / 3u;
    uint vertexID = uint( gl_VertexID ) % 3u;
    float r1 = random( uvec2( triangleID, vertexID * 2u ) );
    float r2 = random( uvec2( triangleID, vertexID * 2u + 1u ) );
    float angle1 = r1 * 6.28318 + seed;
    float angle2 = r2 * 6.28318 + seed * 0.5;
    vec3 pos = vec3( cos( angle1 ) * 500.0, sin( angle2 ) * 500.0, ( r1 - 0.5 ) * 2000.0 );
    vColor = vec3( random( uvec2( triangleID, 10u ) ), random( uvec2( triangleID, 20u ) ), random( uvec2( triangleID, 30u ) ) );
    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
  }
`;

const fragmentShader = /* glsl */`
  in vec3 vColor;
  out vec4 outColor;

  void main() {
    outColor = vec4( vColor, 1.0 );
  }
`;

function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let mesh;
  
  			
  
  
  				
  				camera.position.z = 4;
  
  				
  				scene.background = new THREE.Color( 0x050505 );
  				scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );
  
  				// geometry
  
  				const triangleCount = 10000;
  				const vertexCountPerTriangle = 3;
  				const vertexCount = triangleCount * vertexCountPerTriangle;
  
  				const geometry = new THREE.BufferGeometry();
  				geometry.setDrawRange( 0, vertexCount );
  
  				// material
  
  				const material = new THREE.RawShaderMaterial( {
  					uniforms: {
  						seed: { value: 42 },
  					},
  					vertexShader: vertexShader,
  					fragmentShader: fragmentShader,
  					side: THREE.DoubleSide,
  					glslVersion: THREE.GLSL3
  				} );
  
  				// mesh
  
  				mesh = new THREE.Mesh( geometry, material );
  				mesh.frustumCulled = false;
  				scene.add( mesh );
  
  				// renderer
  
  				
  
  
  				
  
  
  			function animate( time ) {
  
  				mesh.rotation.x = time / 1000.0 * 0.25;
  				mesh.rotation.y = time / 1000.0 * 0.50;
  
  
  
  			}
  
  		
}
</script>
