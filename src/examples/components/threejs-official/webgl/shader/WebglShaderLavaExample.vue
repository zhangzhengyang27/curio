<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 35, near: 1, far: 3000 }"
    custom-render
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
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - shader material demo. featuring lava shader by <a href=\"http://irrlicht.sourceforge.net/phpBB2/viewtopic.php?t=21057\" target=\"_blank\" rel=\"noopener\">TheGameMaker</a>"

const vertexShader = /* glsl */`
  uniform float time;
  uniform vec2 uvScale;
  varying vec2 vUv;

  void main() {
    vUv = uvScale * uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */`
  uniform float time;
  uniform float fogDensity;
  uniform vec3 fogColor;
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  varying vec2 vUv;

  void main() {
    vec2 position = - 1.0 + 2.0 * vUv;
    vec4 noise = texture2D( texture1, vUv );
    vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * 0.02;
    vec2 T2 = vUv + vec2( - 0.5, 2.0 ) * time * 0.01;
    T1.x += noise.x * 2.0;
    T1.y += noise.y * 2.0;
    T2.x -= noise.y * 0.2;
    T2.y += noise.z * 0.2;
    float p = texture2D( texture1, T1 * 2.0 ).a;
    vec4 color = texture2D( texture2, T2 * 2.0 );
    vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );
    if ( temp.r > 1.0 ) { temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
    if ( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
    if ( temp.b > 1.0 ) { temp.rg += temp.b - 1.0; }
    gl_FragColor = temp;
    float depth = gl_FragCoord.z / gl_FragCoord.w;
    const float LOG2 = 1.442695;
    float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
    fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );
    gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
  }
`;

function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let composer, timer;
  
  			let uniforms, mesh;
  
  			
  
  
  				camera.position.z = 4;
  
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const cloudTexture = textureLoader.load( ASSET_HOST + 'textures/lava/cloud.png' );
  				const lavaTexture = textureLoader.load( ASSET_HOST + 'textures/lava/lavatile.jpg' );
  
  				lavaTexture.colorSpace = THREE.SRGBColorSpace;
  
  				cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;
  				lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping;
  
  				uniforms = {
  
  					'fogDensity': { value: 0.45 },
  					'fogColor': { value: new THREE.Vector3( 0, 0, 0 ) },
  					'time': { value: 1.0 },
  					'uvScale': { value: new THREE.Vector2( 3.0, 1.0 ) },
  					'texture1': { value: cloudTexture },
  					'texture2': { value: lavaTexture }
  
  				};
  
  				const size = 0.65;
  
  				const material = new THREE.ShaderMaterial( {
  
  					uniforms: uniforms,
  					vertexShader: vertexShader,
  					fragmentShader: fragmentShader
  
  				} );
  
  				mesh = new THREE.Mesh( new THREE.TorusGeometry( size, 0.3, 30, 30 ), material );
  				mesh.rotation.x = 0.3;
  				scene.add( mesh );
  
  				//
  
  				
  
  
  				renderer.autoClear = false;
  
  
  				//
  
  				const renderModel = new RenderPass( scene, camera );
  				const effectBloom = new BloomPass( 1.25 );
  				const outputPass = new OutputPass();
  
  				composer = new EffectComposer( renderer );
  
  				composer.addPass( renderModel );
  				composer.addPass( effectBloom );
  				composer.addPass( outputPass );
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const delta = 5 * timer.getDelta();
    				uniforms[ 'time' ].value += 0.2 * delta;
    				mesh.rotation.y += 0.0125 * delta;
    				mesh.rotation.x += 0.05 * delta;
    				renderer.clear();
    				composer.render( 0.01 );
  })
  
  		
}
</script>
