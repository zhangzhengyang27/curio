<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 1, far: 2000 }"
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
import { installHtmlInCanvasPolyfill } from 'three-html-render/polyfill';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { InteractionManager } from 'three/examples/jsm/interaction/InteractionManager.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl - HTMLTexture"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			if ( ! ( 'requestPaint' in HTMLCanvasElement.prototype ) ) {
  
  				installHtmlInCanvasPolyfill();
  				info.innerHTML += '<br><a href="https://github.com/WICG/html-in-canvas" target="_blank">HTML-in-Canvas API</a> not available. Using <a href="https://github.com/repalash/three-html-render" target="_blank">polyfill</a>.';
  
  			}
  
  			let mesh, interactions;
  
  			
  
  
  				
  
  				renderer.toneMapping = THREE.NeutralToneMapping;
  
  
  				camera.position.z = 500;
  
  				
  				scene.background = new THREE.Color( 0xaaaaaa );
  				scene.environment = new THREE.PMREMGenerator( renderer ).fromScene( new RoomEnvironment(), 0.02 ).texture;
  
  				// HTML element
  
  				const element = document.createElement( 'div' );
  				element.id = 'draw_element';
  				element.innerHTML = `
  					Hello world!<br>I'm multi-line, <b>formatted</b>,
  					rotated text with emoji (&#128512;), RTL text
  					<span dir=rtl>من فارسی صحبت میکنم</span>,
  					vertical text,
  					<p style="writing-mode: vertical-rl;">
  					这是垂直文本
  					</p>
  					an inline image (<img width="150" src=ASSET_HOST + 'textures/758px-Canestra_di_frutta_(Caravaggio).jpg'>), and
  					<svg width="50" height="50">
  					<circle cx="25" cy="25" r="20" fill="green" />
  					<text x="25" y="30" font-size="15" text-anchor="middle" fill="#fff">
  						SVG
  					</text>
  					</svg>!
  					<br>
  					<input type="text" placeholder="Type here...">
  					<button>Click me</button>
  				`;
  
  				const geometry = new RoundedBoxGeometry( 200, 200, 200, 10, 10 );
  
  				const material = new THREE.MeshStandardMaterial( { roughness: 0, metalness: 0.5 } );
  				material.map = new THREE.HTMLTexture( element );
  
  				mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				// Interaction
  
  				interactions = new InteractionManager();
  				interactions.connect( renderer, camera );
  				interactions.add( mesh );
  
  				// Button click handler
  
  				element.querySelector( 'button' ).addEventListener( 'click', function () {
  
  					this.textContent = 'Clicked!';
  
  				} );
  
  				
  
  			
  
  
  			
  
  			function animate( time ) {
  
  				mesh.rotation.x = Math.sin( time * 0.0005 ) * 0.5;
  				mesh.rotation.y = Math.cos( time * 0.0008 ) * 0.5;
  
  				interactions.update();
  
  
  
  			}
  
  		
}
</script>
