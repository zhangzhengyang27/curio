<template>
  <ExampleScene
    camera="perspective"
    antialias
    :clear-color="0xffffff"
    :camera-options="{ fov: 75, near: 0.1, far: 100 }"
    custom-render
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - multiple elements with text - webgl"
function onReady(__stage) {
  const scene = __stage.scene
  const camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			const scenes = [];
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			let views, t, canvas;
  
  			window.onload = init;
  
  			
  
  
  				const balls = 20;
  				const size = .25;
  
  				const colors = [
  					'rgb(0,127,255)', 'rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(0,255,255)',
  					'rgb(255,0,255)', 'rgb(255,0,127)', 'rgb(255,255,0)', 'rgb(0,255,127)'
  				];
  
  				canvas = document.getElementById( 'c' );
  
  				
  
  				views = document.querySelectorAll( '.view' );
  
  				for ( let n = 0; n < views.length; n ++ ) {
  
  
  					scene.background = new THREE.Color( 0xffffff );
  
  					const geometry0 = new THREE.BufferGeometry();
  					const geometry1 = new THREE.BufferGeometry();
  
  					const vertices = [];
  
  					if ( views[ n ].lattice ) {
  
  						const range = balls / 2;
  						for ( let i = - range; i <= range; i ++ ) {
  
  							for ( let j = - range; j <= range; j ++ ) {
  
  								for ( let k = - range; k <= range; k ++ ) {
  
  									vertices.push( i, j, k );
  
  								}
  
  							}
  
  						}
  
  					} else {
  
  						for ( let m = 0; m < Math.pow( balls, 3 ); m ++ ) {
  
  							const i = balls * Math.random() - balls / 2;
  							const j = balls * Math.random() - balls / 2;
  							const k = balls * Math.random() - balls / 2;
  
  							vertices.push( i, j, k );
  
  						}
  
  					}
  
  					geometry0.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
  					geometry1.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices.slice(), 3 ) );
  
  					const index = Math.floor( colors.length * Math.random() );
  
  					const canvas2 = document.createElement( 'canvas' );
  					canvas2.width = 128;
  					canvas2.height = 128;
  					const context = canvas2.getContext( '2d' );
  					context.arc( 64, 64, 64, 0, 2 * Math.PI );
  					context.fillStyle = colors[ index ];
  					context.fill();
  					const texture = new THREE.CanvasTexture( canvas2 );
  					texture.colorSpace = THREE.SRGBColorSpace;
  
  					const material = new THREE.PointsMaterial( { size: size, map: texture, transparent: true, alphaTest: 0.1 } );
  
  					scene.add( new THREE.Points( geometry0, material ) );
  
  					scene.userData.view = views[ n ];
  					scene.userData.geometry1 = geometry1;
  
  
  
  					scene.userData.camera = camera;
  
  
  					scene.userData.controls = controls;
  
  					scenes.push( scene );
  
  				}
  
  				t = 0;
  
  			function updateSize() {
  
  				const width = canvas.clientWidth;
  				const height = canvas.clientHeight;
  
  				if ( canvas.width !== width || canvas.height != height ) {
  
  
  
  				}
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    {
    const width = canvas.clientWidth;
    				const height = canvas.clientHeight;
    				if ( canvas.width !== width || canvas.height != height ) {
    				}
    }
    				renderer.setClearColor( 0xffffff );
    				renderer.setScissorTest( false );
    				renderer.clear();
    				renderer.setClearColor( 0x000000 );
    				renderer.setScissorTest( true );
    				scenes.forEach( function ( scene ) {
    					const rect = scene.userData.view.getBoundingClientRect();
    					// check if it's offscreen. If so skip it
    					if ( rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
    						 rect.right < 0 || rect.left > renderer.domElement.clientWidth ) {
    						return; // it's off screen
    					}
    					// set the viewport
    					const width = rect.right - rect.left;
    					const height = rect.bottom - rect.top;
    					const left = rect.left;
    					const bottom = renderer.domElement.clientHeight - rect.bottom;
    					renderer.setViewport( left, bottom, width, height );
    					renderer.setScissor( left, bottom, width, height );
    					renderer.render( scene, scene.userData.camera );
    					const points = scene.children[ 0 ];
    					const position = points.geometry.attributes.position;
    					const point = new THREE.Vector3();
    					const offset = new THREE.Vector3();
    					for ( let i = 0; i < position.count; i ++ ) {
    						point.fromBufferAttribute( scene.userData.geometry1.attributes.position, i );
    						scene.userData.view.displacement( point.x, point.y, point.z, t / 5, offset );
    						position.setXYZ( i, point.x + offset.x, point.y + offset.y, point.z + offset.z );
    					}
    					position.needsUpdate = true;
    				} );
    				t += timer.getDelta() * 60;
  })
  
  		
}
</script>
