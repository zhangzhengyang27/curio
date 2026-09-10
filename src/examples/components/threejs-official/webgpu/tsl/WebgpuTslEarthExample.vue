<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[4.5, 2, 3]"
    :camera-options="{ fov: 25, near: 0.1, far: 100 }"
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
import { step, normalWorldGeometry, output, texture, vec3, vec4, normalize, positionWorld, bumpMap, cameraPosition, color, uniform, mix, uv, max } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Earth</span>"
const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'

function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let globe, timer;
  
  			init();
  
  			function init() {
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  
  				// sun
  
  				const sun = new THREE.DirectionalLight( '#ffffff', 2 );
  				sun.position.set( 0, 0, 3 );
  				scene.add( sun );
  
  				// uniforms
  
  				const atmosphereDayColor = uniform( color( '#4db2ff' ) );
  				const atmosphereTwilightColor = uniform( color( '#bc490b' ) );
  				const roughnessLow = uniform( 0.25 );
  				const roughnessHigh = uniform( 0.35 );
  
  				// textures
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const dayTexture = textureLoader.load( ASSET_HOST + 'textures/planets/earth_day_4096.jpg' );
  				dayTexture.colorSpace = THREE.SRGBColorSpace;
  				dayTexture.anisotropy = 8;
  
  				const nightTexture = textureLoader.load( ASSET_HOST + 'textures/planets/earth_night_4096.jpg' );
  				nightTexture.colorSpace = THREE.SRGBColorSpace;
  				nightTexture.anisotropy = 8;
  
  				const bumpRoughnessCloudsTexture = textureLoader.load( ASSET_HOST + 'textures/planets/earth_bump_roughness_clouds_4096.jpg' );
  				bumpRoughnessCloudsTexture.anisotropy = 8;
  
  				// fresnel
  
  				const viewDirection = positionWorld.sub( cameraPosition ).normalize();
  				const fresnel = viewDirection.dot( normalWorldGeometry ).abs().oneMinus().toVar();
  
  				// sun orientation
  
  				const sunOrientation = normalWorldGeometry.dot( normalize( sun.position ) ).toVar();
  
  				// atmosphere color
  
  				const atmosphereColor = mix( atmosphereTwilightColor, atmosphereDayColor, sunOrientation.smoothstep( - 0.25, 0.75 ) );
  
  				// globe
  
  				const globeMaterial = new THREE.MeshStandardNodeMaterial();
  
  				const cloudsStrength = texture( bumpRoughnessCloudsTexture, uv() ).b.smoothstep( 0.2, 1 );
  
  				globeMaterial.colorNode = mix( texture( dayTexture ), vec3( 1 ), cloudsStrength.mul( 2 ) );
  
  				const roughness = max(
  					texture( bumpRoughnessCloudsTexture ).g,
  					step( 0.01, cloudsStrength )
  				);
  				globeMaterial.roughnessNode = roughness.remap( 0, 1, roughnessLow, roughnessHigh );
  
  				const night = texture( nightTexture );
  				const dayStrength = sunOrientation.smoothstep( - 0.25, 0.5 );
  
  				const atmosphereDayStrength = sunOrientation.smoothstep( - 0.5, 1 );
  				const atmosphereMix = atmosphereDayStrength.mul( fresnel.pow( 2 ) ).clamp( 0, 1 );
  
  				let finalOutput = mix( night.rgb, output.rgb, dayStrength );
  				finalOutput = mix( finalOutput, atmosphereColor, atmosphereMix );
  
  				globeMaterial.outputNode = vec4( finalOutput, output.a );
  
  				const bumpElevation = max(
  					texture( bumpRoughnessCloudsTexture ).r,
  					cloudsStrength
  				);
  				globeMaterial.normalNode = bumpMap( bumpElevation );
  
  				const sphereGeometry = new THREE.SphereGeometry( 1, 64, 64 );
  				globe = new THREE.Mesh( sphereGeometry, globeMaterial );
  				scene.add( globe );
  
  				// atmosphere
  
  				const atmosphereMaterial = new THREE.MeshBasicNodeMaterial( { side: THREE.BackSide, transparent: true } );
  				let alpha = fresnel.remap( 0.73, 1, 1, 0 ).pow( 3 );
  				alpha = alpha.mul( sunOrientation.smoothstep( - 0.5, 1 ) );
  				atmosphereMaterial.outputNode = vec4( atmosphereColor, alpha );
  
  				const atmosphere = new THREE.Mesh( sphereGeometry, atmosphereMaterial );
  				atmosphere.scale.setScalar( 1.04 );
  				scene.add( atmosphere );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				// controls
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 0.1;
  				controls.maxDistance = 50;
  
  				// events
  
  				
  
  				// debug
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  
  				gui
  					.addColor( { color: atmosphereDayColor.value.getHex( THREE.SRGBColorSpace ) }, 'color' )
  					.onChange( ( value ) => {
  
  						atmosphereDayColor.value.set( value );
  
  					} )
  					.name( 'atmosphereDayColor' );
  
  				gui
  					.addColor( { color: atmosphereTwilightColor.value.getHex( THREE.SRGBColorSpace ) }, 'color' )
  					.onChange( ( value ) => {
  
  						atmosphereTwilightColor.value.set( value );
  
  					} )
  					.name( 'atmosphereTwilightColor' );
  
  				gui.add( roughnessLow, 'value', 0, 1, 0.001 ).name( 'roughnessLow' );
  				gui.add( roughnessHigh, 'value', 0, 1, 0.001 ).name( 'roughnessHigh' );
  
  			}
  
  			
  
  			__stage.addUpdateCallback(async (_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				globe.rotation.y += delta * 0.025;
  })
  
  		
}
</script>
