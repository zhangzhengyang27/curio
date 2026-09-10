<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[6, 8, 8]"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
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
import { float, range, texture, mix, uv, color, rotateUV, positionLocal, time, uniform } from 'three/tsl';
import { softParticles } from 'three/examples/jsm/tsl/utils/SoftParticles.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>WebGPU Soft Particles</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  				scene.fog = new THREE.FogExp2( 0x000000, 0.025 );
  
  				// lights
  
  				scene.add( new THREE.AmbientLight( 0xffffff, 0.25 ) );
  
  				const spotLight = new THREE.SpotLight( 0xffffff, 800 );
  				spotLight.position.set( 10, 15, 8 );
  				spotLight.target.position.set( 0, 4, 0 );
  				spotLight.angle = 0.5;
  				spotLight.penumbra = 0.7;
  				spotLight.distance = 0;
  
  				scene.add( spotLight );
  
  				//
  
  				const loader = new PLYLoader();
  				loader.load( ASSET_HOST + 'models/ply/binary/Lucy100k.ply', function ( geometry ) {
  
  					geometry.computeVertexNormals();
  
  					const material = new THREE.MeshStandardMaterial( );
  					const mesh = new THREE.Mesh( geometry, material );
  
  					mesh.position.y = 4;
  					mesh.rotation.y = Math.PI;
  					mesh.scale.multiplyScalar( 0.005 );
  			
  					scene.add( mesh );
  
  				} );
  
  				const groundMaterial = new THREE.MeshStandardNodeMaterial( { color: 0x444444, roughness: 1 } );
  				const ground = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), groundMaterial );
  				ground.rotation.x = - Math.PI / 2;
  				scene.add( ground );
  
  				// smoke texture
  
  				const textureLoader = new THREE.TextureLoader();
  				const map = textureLoader.load( ASSET_HOST + 'textures/opengameart/smoke1.png' );
  				map.colorSpace = THREE.SRGBColorSpace;
  
  				// simple smoke particle system
  
  				const lifeRange = range( 0.1, 1 );
  				const offsetRange = range( new THREE.Vector3( - 2, 0, - 2 ), new THREE.Vector3( 2, 7, 2 ) );
  
  				const speed = float( 0.2 );
  				const scaledTime = time.add( 20 ).mul( speed );
  
  				const lifeTime = scaledTime.mul( lifeRange ).mod( 1 );
  				const scaleRange = range( 6, 8 );
  				const rotateRange = range( 0.1, 2 );
  
  				const life = lifeTime.div( lifeRange );
  
  				const textureNode = texture( map, rotateUV( uv(), scaledTime.mul( rotateRange ) ) );
  
  				const fade = life.smoothstep( 0, 0.3 ).mul( life.smoothstep( 1, 0.7 ) );
  
  				// soft particles
  
  				const softEnabled = uniform( 1 ); // 0 = hard particles, 1 = soft particles
  				const softDistance = uniform( 1 ); // world-space fade distance
  				const softContrast = uniform( 2 );
  
  				const baseOpacity = textureNode.a.mul( fade );
  
  				const smokeOpacity = mix( baseOpacity, softParticles( {
  					opacity: baseOpacity,
  					distance: softDistance,
  					contrast: softContrast
  				} ), softEnabled );
  
  				const smokeColor = mix( color( 0x6f6f6f ), color( 0x303030 ), positionLocal.y.mul( 0.1 ).clamp() );
  
  				// instanced sprites
  
  				const smokeMaterial = new THREE.SpriteNodeMaterial();
  				smokeMaterial.colorNode = smokeColor;
  				smokeMaterial.opacityNode = smokeOpacity;
  				smokeMaterial.positionNode = offsetRange.mul( lifeTime );
  				smokeMaterial.scaleNode = scaleRange.mul( lifeTime.max( 0.3 ) );
  				smokeMaterial.depthWrite = false;
  
  				const smoke = new THREE.Sprite( smokeMaterial );
  				smoke.count = 50;
  				smoke.frustumCulled = false;
  				scene.add( smoke );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				// controls
  
  				
  				controls.minDistance = 6;
  				controls.maxDistance = 20;
  				controls.target.set( 0, 4, 0 );
  				controls.enableDamping = true;
  				controls.update();
  
  				
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( softEnabled, 'value', { hard: 0, soft: 1 } ).name( 'mode' );
  				gui.add( softDistance, 'value', 0.1, 2, 0.01 ).name( 'soft distance' );
  				gui.add( softContrast, 'value', 1, 6, 0.01 ).name( 'soft contrast' );
  
  			
  
  
  			
  
  			function render() {
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
