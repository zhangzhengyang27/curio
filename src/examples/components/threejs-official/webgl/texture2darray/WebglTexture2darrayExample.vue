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

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { unzipSync } from 'three/examples/jsm/libs/fflate.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - 2D Texture array<br />\n\t\t\tScanned head data by\n\t\t\t<a href=\"https://www.codeproject.com/Articles/352270/Getting-started-with-Volume-Rendering\" target=\"_blank\" rel=\"noopener\">Divine Augustine</a><br />\n\t\t\tlicensed under\n\t\t\t<a href=\"https://www.codeproject.com/info/cpol10.aspx\" target=\"_blank\" rel=\"noopener\">CPOL</a>"

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
    vec4 color = texture( diffuse, vec3( vUv, depth / 109.0 ) );
    outColor = vec4( color.r );
  }
`;

function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let mesh: any, stats;
  
  			const planeWidth = 50;
  			const planeHeight = 50;
  
  			let depthStep = 0.4;
  
  			
  
  
  				
  
  				
  				camera.position.z = 70;
  
  				
  
  				// width 256, height 256, depth 109, 8-bit, zip archived raw data
  
  				new THREE.FileLoader()
  					.setResponseType( 'arraybuffer' )
  					.load( ASSET_HOST + 'textures/3d/head256x256x109.zip', function ( data ) {
  
  						const zip = unzipSync( new Uint8Array( (data as any) ) );
  						const array = new Uint8Array( zip[ 'head256x256x109' ].buffer );
  
  						const texture = new THREE.DataArrayTexture( array, 256, 256, 109 );
  						texture.format = THREE.RedFormat;
  						texture.needsUpdate = true;
  
  						const material = new THREE.ShaderMaterial( {
  							uniforms: {
  								diffuse: { value: texture },
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
  
  				// 2D Texture array is available on WebGL 2.0
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    if ( mesh ) {
    					let value = mesh.material.uniforms[ 'depth' ].value;
    					value += depthStep;
    					if ( value > 109.0 || value < 0.0 ) {
    						if ( value > 1.0 ) value = 109.0 * 2.0 - value;
    						if ( value < 0.0 ) value = - value;
    						depthStep = - depthStep;
    					}
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
