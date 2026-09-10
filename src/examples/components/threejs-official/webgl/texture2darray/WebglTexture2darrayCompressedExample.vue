<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 45, near: 0.1, far: 2000 }"
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
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - 2D Compressed Texture Array<br />\n\t\t\tLoop from the movie Spirited away\n\t\t\tby the <a href=\"https://www.ghibli.jp/\" target=\"_blank\" rel=\"noopener\">Studio Ghibli</a><br />"

const vsSource = /* glsl */`
  uniform vec2 size;
  out vec2 vUv;
  void main() {
    vUv = uv;
    vec3 transformed = position;
    transformed.xy *= size;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );
  }
`;

const fsSource = /* glsl */`
  precision highp sampler2DArray;
  uniform sampler2DArray diffuse;
  uniform float depth;
  in vec2 vUv;
  out vec4 outColor;
  void main() {
    vec4 color = texture( diffuse, vec3( vUv, depth ) );
    outColor = color;
  }
`;

function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let mesh, stats, timer;
  
  			const planeWidth = 50;
  			const planeHeight = 25;
  
  			let depthStep = 1;
  
  			
  
  
  				
  
  				
  				camera.position.z = 70;
  
  				
  
  				//
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				
  
  
  				//
  
  				const ktx2Loader = new KTX2Loader();
  				ktx2Loader.detectSupport( renderer );
  
  				ktx2Loader.load( ASSET_HOST + 'textures/spiritedaway.ktx2', function ( texturearray ) {
  
  					const material = new THREE.ShaderMaterial( {
  						uniforms: {
  							diffuse: { value: texturearray },
  							depth: { value: 55 },
  							size: { value: new THREE.Vector2( planeWidth, planeHeight ) }
  						},
  						vertexShader: vsSource,
  						fragmentShader: fsSource,
  						glslVersion: THREE.GLSL3
  					} );
  
  					const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
  
  					mesh = new THREE.Mesh( geometry, material );
  
  					scene.add( mesh );
  
  				} );
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				if ( mesh ) {
    					const delta = timer.getDelta() * 10;
    					depthStep += delta;
    					const value = depthStep % 5;
    					mesh.material.uniforms[ 'depth' ].value = value;
    				}
    {
    }
    				stats.update();
  })
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
