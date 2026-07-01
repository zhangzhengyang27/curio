<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[4, 2, 5]"
    :camera-options="{ fov: 50, near: 0.1, far: 100 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { color, cos, float, mix, range, sin, time, uniform, uv, vec3, vec4, TWO_PI } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Galaxy</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x201919 );
  
  				// galaxy
  
  				const material = new THREE.SpriteNodeMaterial( {
  					depthWrite: false,
  					blending: THREE.AdditiveBlending
  				} );
  
  				const size = uniform( 0.08 );
  				material.scaleNode = range( 0, 1 ).mul( size );
  
  				const radiusRatio = range( 0, 1 );
  				const radius = radiusRatio.pow( 1.5 ).mul( 5 ).toVar();
  
  				const branches = 3;
  				const branchAngle = range( 0, branches ).floor().mul( TWO_PI.div( branches ) );
  				const angle = branchAngle.add( time.mul( radiusRatio.oneMinus() ) );
  
  				const position = vec3(
  					cos( angle ),
  					0,
  					sin( angle )
  				).mul( radius );
  
  				const randomOffset = range( vec3( - 1 ), vec3( 1 ) ).pow3().mul( radiusRatio ).add( 0.2 );
  
  				material.positionNode = position.add( randomOffset );
  
  				const colorInside = uniform( color( '#ffa575' ) );
  				const colorOutside = uniform( color( '#311599' ) );
  				const colorFinal = mix( colorInside, colorOutside, radiusRatio.oneMinus().pow( 2 ).oneMinus() );
  				const alpha = float( 0.1 ).div( uv().sub( 0.5 ).length() ).sub( 0.2 );
  				material.colorNode = vec4( colorFinal, alpha );
  
  				const mesh = new THREE.InstancedMesh( new THREE.PlaneGeometry( 1, 1 ), material, 20000 );
  				scene.add( mesh );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 0.1;
  				controls.maxDistance = 50;
  
  				// events
  
  				
  
  				// debug
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  
  				gui.add( size, 'value', 0, 1, 0.001 ).name( 'size' );
  
  				gui.addColor( { color: colorInside.value.getHex( THREE.SRGBColorSpace ) }, 'color' )
  					.name( 'colorInside' )
  					.onChange( function ( value ) {
  
  						colorInside.value.set( value );
  
  					} );
  
  				gui.addColor( { color: colorOutside.value.getHex( THREE.SRGBColorSpace ) }, 'color' )
  					.name( 'colorOutside' )
  					.onChange( function ( value ) {
  
  						colorOutside.value.set( value );
  
  					} );
  
  			
  
  
  			
  
  			function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
