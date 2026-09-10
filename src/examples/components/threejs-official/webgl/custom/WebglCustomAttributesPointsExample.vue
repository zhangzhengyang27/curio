<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 40, near: 1, far: 10000 }"
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - custom attributes example - particles"

const vertexShader = /* glsl */ `
attribute float size;
attribute vec3 customColor;

varying vec3 vColor;

void main() {

	vColor = customColor;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	gl_PointSize = size * ( 300.0 / -mvPosition.z );

	gl_Position = projectionMatrix * mvPosition;

}
`

const fragmentShader = /* glsl */ `
uniform vec3 color;
uniform sampler2D pointTexture;

varying vec3 vColor;

void main() {

	gl_FragColor = vec4( color * vColor, 1.0 );
	gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );

}
`

function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let stats;

  			let sphere;
  
  
  
  			const WIDTH = (__stage.container?.clientWidth || window.innerWidth);
  			const HEIGHT = (__stage.container?.clientHeight || window.innerHeight);
  
  			
  
  
  				
  				camera.position.z = 300;
  
  				
  
  				const amount = 100000;
  				const radius = 200;
  
  				const positions = new Float32Array( amount * 3 );
  				const colors = new Float32Array( amount * 3 );
  				const sizes = new Float32Array( amount );
  
  				const vertex = new THREE.Vector3();
  				const color = new THREE.Color( 0xffffff );
  
  				for ( let i = 0; i < amount; i ++ ) {
  
  					vertex.x = ( Math.random() * 2 - 1 ) * radius;
  					vertex.y = ( Math.random() * 2 - 1 ) * radius;
  					vertex.z = ( Math.random() * 2 - 1 ) * radius;
  					vertex.toArray( positions, i * 3 );
  
  					if ( vertex.x < 0 ) {
  
  						color.setHSL( 0.5 + 0.1 * ( i / amount ), 0.7, 0.5 );
  
  					} else {
  
  						color.setHSL( 0.0 + 0.1 * ( i / amount ), 0.9, 0.5 );
  
  					}
  
  					color.toArray( colors, i * 3 );
  
  					sizes[ i ] = 10;
  
  				}
  
  				const geometry = new THREE.BufferGeometry();
  				geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
  				geometry.setAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
  				geometry.setAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
  
  				//
  
  				const material = new THREE.ShaderMaterial( {
  
  					uniforms: {
  						color: { value: new THREE.Color( 0xffffff ) },
  						pointTexture: { value: new THREE.TextureLoader().load( ASSET_HOST + 'textures/sprites/spark1.png' ) }
  					},
  					vertexShader: vertexShader,
  					fragmentShader: fragmentShader,
  
  					blending: THREE.AdditiveBlending,
  					depthTest: false,
  					transparent: true
  
  				} );
  
  				//
  
  				sphere = new THREE.Points( geometry, material );
  				scene.add( sphere );
  
  				//
  
  				
  
  
  				//
  				
  				
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const time = Date.now() * 0.005;
    				sphere.rotation.z = 0.01 * time;
    				const geometry = sphere.geometry;
    				const attributes = geometry.attributes;
    				for ( let i = 0; i < attributes.size.array.length; i ++ ) {
    					attributes.size.array[ i ] = 14 + 13 * Math.sin( 0.1 * i + time );
    				}
    				attributes.size.needsUpdate = true;
    }
    				stats.update();
  })
  
  			function render() {
  
  				const time = Date.now() * 0.005;
  
  				sphere.rotation.z = 0.01 * time;
  
  				const geometry = sphere.geometry;
  				const attributes = geometry.attributes;
  
  				for ( let i = 0; i < attributes.size.array.length; i ++ ) {
  
  					attributes.size.array[ i ] = 14 + 13 * Math.sin( 0.1 * i + time );
  
  				}
  
  				attributes.size.needsUpdate = true;
  
  
  
  			}
  
  		
}
</script>
