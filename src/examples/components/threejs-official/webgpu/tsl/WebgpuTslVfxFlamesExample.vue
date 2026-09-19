<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[1, 1, 3]"
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

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { TWO_PI, oneMinus, spherizeUV, sin, step, texture, time, Fn, uv, vec2, vec3, vec4, mix, billboarding } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>VFX Flames</span>"
const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'

function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x201919 );
  
  				// textures
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const cellularTexture = textureLoader.load( ASSET_HOST + 'textures/noises/voronoi/grayscale-256x256.png' );
  				const perlinTexture = textureLoader.load( ASSET_HOST + 'textures/noises/perlin/rgb-256x256.png' );
  
  				// gradient canvas
  
  				const gradient = {};
  				(gradient as any).element = document.createElement( 'canvas' );
  				(gradient as any).element.width = 128;
  				(gradient as any).element.height = 1;
  				(gradient as any).context = (gradient as any).element.getContext( '2d' );
  
  				(gradient as any).colors = [
  					'#090033',
  					'#5f1f93',
  					'#e02e96',
  					'#ffbd80',
  					'#fff0db',
  				];
  
  				(gradient as any).texture = new THREE.CanvasTexture( (gradient as any).element );
  				(gradient as any).texture.colorSpace = THREE.SRGBColorSpace;
  
  				(gradient as any).update = () => {
  
  					const fillGradient = (gradient as any).context.createLinearGradient( 0, 0, (gradient as any).element.width, 0 );
  
  					for ( let i = 0; i < (gradient as any).colors.length; i ++ ) {
  
  						const progress = i / ( (gradient as any).colors.length - 1 );
  						const color = (gradient as any).colors[ i ];
  						fillGradient.addColorStop( progress, color );
  
  					}
  
  					(gradient as any).context.fillStyle = fillGradient;
  					(gradient as any).context.fillRect( 0, 0, (gradient as any).element.width, (gradient as any).element.height );
  
  					(gradient as any).texture.needsUpdate = true;
  
  				};
  
  				(gradient as any).update();
  
  				// flame 1 material
  
  				const flame1Material = new THREE.SpriteNodeMaterial( { side: THREE.DoubleSide } );
  
  				flame1Material.colorNode = Fn( () => {
  
  					// main UV
  					const mainUv = uv().toVar();
  					mainUv.assign( spherizeUV( mainUv, 10 ).mul( 0.6 ).add( 0.2 ) ); // spherize
  					mainUv.assign( mainUv.pow( vec2( 1, 2 ) ) ); // stretch
  					mainUv.assign( mainUv.mul( 2, 1 ).sub( vec2( 0.5, 0 ) ) ); // scale
  
  					// gradients
  					const gradient1 = sin( time.mul( 10 ).sub( mainUv.y.mul( TWO_PI ).mul( 2 ) ) ).toVar();
  					const gradient2 = mainUv.y.smoothstep( 0, 1 ).toVar();
  					mainUv.x.addAssign( gradient1.mul( gradient2 ).mul( 0.2 ) );
  
  					// cellular noise
  					const cellularUv = mainUv.mul( 0.5 ).add( vec2( 0, time.negate().mul( 0.5 ) ) ).mod( 1 );
  					const cellularNoise = texture( cellularTexture, cellularUv, 0 ).r.oneMinus().smoothstep( 0, 0.5 ).oneMinus();
  					cellularNoise.mulAssign( gradient2 );
  
  					// shape
  					const shape = mainUv.sub( 0.5 ).mul( vec2( 3, 2 ) ).length().oneMinus().toVar();
  					shape.assign( shape.sub( cellularNoise ) );
  
  					// gradient color
  					const gradientColor = texture( (gradient as any).texture, vec2( shape.remap( 0, 1, 0, 1 ), 0 ) );
  
  					// output
  					const color = mix( gradientColor, vec3( 1 ), shape.step( 0.8 ) );
  					const alpha = shape.smoothstep( 0, 0.3 );
  					return vec4( color.rgb, alpha );
  
  				} )();
  
  				// flame 2 material
  
  				const flame2Material = new THREE.SpriteNodeMaterial( { side: THREE.DoubleSide } );
  
  				flame2Material.colorNode = Fn( () => {
  
  					// main UV
  					const mainUv = uv().toVar();
  					mainUv.assign( spherizeUV( mainUv, 10 ).mul( 0.6 ).add( 0.2 ) ); // spherize
  					mainUv.assign( mainUv.abs().pow( vec2( 1, 3 ) ).mul( mainUv.sign() ) ); // stretch
  					mainUv.assign( mainUv.mul( 2, 1 ).sub( vec2( 0.5, 0 ) ) ); // scale
  
  					// perlin noise
  					const perlinUv = mainUv.add( vec2( 0, time.negate().mul( 1 ) ) ).mod( 1 );
  					const perlinNoise = texture( perlinTexture, perlinUv, 0 ).sub( 0.5 ).mul( 1 );
  					mainUv.x.addAssign( perlinNoise.x.mul( 0.5 ) );
  
  					// gradients
  					const gradient1 = sin( time.mul( 10 ).sub( mainUv.y.mul( TWO_PI ).mul( 2 ) ) );
  					const gradient2 = mainUv.y.smoothstep( 0, 1 );
  					const gradient3 = oneMinus( mainUv.y ).smoothstep( 0, 0.3 );
  					mainUv.x.addAssign( gradient1.mul( gradient2 ).mul( 0.2 ) );
  
  					// displaced perlin noise
  					const displacementPerlinUv = mainUv.mul( 0.5 ).add( vec2( 0, time.negate().mul( 0.25 ) ) ).mod( 1 );
  					const displacementPerlinNoise = texture( perlinTexture, displacementPerlinUv, 0 ).sub( 0.5 ).mul( 1 );
  					const displacedPerlinUv = mainUv.add( vec2( 0, time.negate().mul( 0.5 ) ) ).add( displacementPerlinNoise ).mod( 1 );
  					const displacedPerlinNoise = texture( perlinTexture, displacedPerlinUv, 0 ).sub( 0.5 ).mul( 1 );
  					mainUv.x.addAssign( displacedPerlinNoise.mul( 0.5 ) );
  
  					// cellular noise
  					const cellularUv = mainUv.add( vec2( 0, time.negate().mul( 1.5 ) ) ).mod( 1 );
  					const cellularNoise = texture( cellularTexture, cellularUv, 0 ).r.oneMinus().smoothstep( 0.25, 1 );
  
  					// shape
  					const shape = step( mainUv.sub( 0.5 ).mul( vec2( 6, 1 ) ).length(), 0.5 );
  					shape.assign( shape.mul( cellularNoise ) );
  					shape.mulAssign( gradient3 );
  					shape.assign( step( 0.01, shape ) );
  
  					// output
  					return vec4( vec3( 1 ), shape );
  
  				} )();
  
  				// billboarding - follow the camera rotation only horizontally
  
  				flame1Material.vertexNode = billboarding();
  				flame2Material.vertexNode = billboarding();
  
  				// meshes
  
  				const flame1 = new THREE.Sprite( flame1Material );
  				flame1.center.set( 0.5, 0 );
  				flame1.scale.x = 0.5; // optional
  				flame1.position.x = - 0.5;
  				scene.add( flame1 );
  
  				const flame2 = new THREE.Sprite( flame2Material );
  				flame2.center.set( 0.5, 0 );
  				flame2.position.x = 0.5;
  				scene.add( flame2 );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  				controls.enableDamping = true;
  				controls.minDistance = 0.1;
  				controls.maxDistance = 50;
  
  				
  
  			
  
  
  			
  
  			async function animate() {
  
  				controls.update();
  
  
  
  			}
  
  		
}
</script>
