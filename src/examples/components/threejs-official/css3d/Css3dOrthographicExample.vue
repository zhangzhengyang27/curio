<template>
  <CSS3DExampleScene
    camera="perspective"
    :camera-position="[-200, 200, 200]"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </CSS3DExampleScene>
</template>

<script setup lang="ts">
import CSS3DExampleScene from '@/examples/components/CSS3DExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let width: any;
let height: any;


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> css3d - orthographic"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  			let scene2: any, renderer2;
  
  			const frustumSize = 500;
  
  				const aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				
  
  
  
  				
  				scene.background = new THREE.Color( 0xf0f0f0 );
  
  				scene2 = new THREE.Scene();
  
  				const material = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, wireframeLinewidth: 1, side: THREE.DoubleSide } );
  
  				// left
  				createPlane(
  					100, 100,
  					'chocolate',
  					new THREE.Vector3( - 50, 0, 0 ),
  					new THREE.Euler( 0, - 90 * THREE.MathUtils.DEG2RAD, 0 )
  				);
  				// right
  				createPlane(
  					100, 100,
  					'saddlebrown',
  					new THREE.Vector3( 0, 0, 50 ),
  					new THREE.Euler( 0, 0, 0 )
  				);
  				// top
  				createPlane(
  					100, 100,
  					'yellowgreen',
  					new THREE.Vector3( 0, 50, 0 ),
  					new THREE.Euler( - 90 * THREE.MathUtils.DEG2RAD, 0, 0 )
  				);
  				// bottom
  				createPlane(
  					300, 300,
  					'seagreen',
  					new THREE.Vector3( 0, - 50, 0 ),
  					new THREE.Euler( - 90 * THREE.MathUtils.DEG2RAD, 0, 0 )
  				);
  
  				//
  
  				
  
  
  
  
  				renderer2 = new CSS3DRenderer();
  				renderer2.setSize( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  				renderer2.domElement.style.position = 'absolute';
  				(renderer2.domElement.style.top as any) = 0;
  				document.body.appendChild( renderer2.domElement );
  
  
  				controls.minZoom = 0.5;
  				controls.maxZoom = 2;
  
  				function createPlane( width: any, height: any, cssColor: any, pos: any, rot: any ) {
  
  					const element = document.createElement( 'div' );
  					element.style.width = width + 'px';
  					element.style.height = height + 'px';
  					(element.style.opacity as any) = 0.75;
  					element.style.background = cssColor;
  
  					const object = new CSS3DObject( element );
  					object.position.copy( pos );
  					object.rotation.copy( rot );
  					scene2.add( object );
  
  					const geometry = new THREE.PlaneGeometry( width, height );
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.copy( object.position );
  					mesh.rotation.copy( object.rotation );
  					scene.add( mesh );
  
  				}
  
  				
  				createPanel();
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    renderer2.render( scene2, camera );
  })
  
  			function createPanel() {
  
  				const panel = new GUI();
  				const folder1 = panel.addFolder( 'camera setViewOffset' ).close();
  
  				const settings = {
  					'setViewOffset'() {
  
  						(folder1.children[ 1 ] as any).enable().setValue( (__stage.container?.clientWidth || window.innerWidth) );
  						(folder1.children[ 2 ] as any).enable().setValue( (__stage.container?.clientHeight || window.innerHeight) );
  						(folder1.children[ 3 ] as any).enable().setValue( 0 );
  						(folder1.children[ 4 ] as any).enable().setValue( 0 );
  						(folder1.children[ 5 ] as any).enable().setValue( (__stage.container?.clientWidth || window.innerWidth) );
  						(folder1.children[ 6 ] as any).enable().setValue( (__stage.container?.clientHeight || window.innerHeight) );
  
  					},
  					'fullWidth': 0,
  					'fullHeight': 0,
  					'offsetX': 0,
  					'offsetY': 0,
  					'width': 0,
  					'height': 0,
  					'clearViewOffset'() {
  
  						(folder1.children[ 1 ] as any).setValue( 0 ).disable();
  						(folder1.children[ 2 ] as any).setValue( 0 ).disable();
  						(folder1.children[ 3 ] as any).setValue( 0 ).disable();
  						(folder1.children[ 4 ] as any).setValue( 0 ).disable();
  						(folder1.children[ 5 ] as any).setValue( 0 ).disable();
  						(folder1.children[ 6 ] as any).setValue( 0 ).disable();
  						camera.clearViewOffset();
  
  					}
  				};
  
  				folder1.add( settings, 'setViewOffset' );
  				folder1.add( settings, 'fullWidth', window.screen.width / 4, window.screen.width * 2, 1 ).onChange( ( val ) => updateCameraViewOffset( { fullWidth: val } ) ).disable();
  				folder1.add( settings, 'fullHeight', window.screen.height / 4, window.screen.height * 2, 1 ).onChange( ( val ) => updateCameraViewOffset( { fullHeight: val } ) ).disable();
  				folder1.add( settings, 'offsetX', 0, 256, 1 ).onChange( ( val ) => updateCameraViewOffset( { x: val } ) ).disable();
  				folder1.add( settings, 'offsetY', 0, 256, 1 ).onChange( ( val ) => updateCameraViewOffset( { y: val } ) ).disable();
  				folder1.add( settings, 'width', window.screen.width / 4, window.screen.width * 2, 1 ).onChange( ( val ) => updateCameraViewOffset( { width: val } ) ).disable();
  				folder1.add( settings, 'height', window.screen.height / 4, window.screen.height * 2, 1 ).onChange( ( val ) => updateCameraViewOffset( { height: val } ) ).disable();
  				folder1.add( settings, 'clearViewOffset' );
  
  			}
  
  			function updateCameraViewOffset( { fullWidth, fullHeight, x, y, width, height }: any ) {
  
  				if ( ! camera.view ) {
  
  					camera.setViewOffset( fullWidth || (__stage.container?.clientWidth || window.innerWidth), fullHeight || (__stage.container?.clientHeight || window.innerHeight), x || 0, y || 0, width || (__stage.container?.clientWidth || window.innerWidth), height || (__stage.container?.clientHeight || window.innerHeight) );
  
  				} else {
  
  					camera.setViewOffset( fullWidth || camera.view.fullWidth, fullHeight || camera.view.fullHeight, x || camera.view.offsetX, y || camera.view.offsetY, width || camera.view.width, height || camera.view.height );
  
  				}
  
  			}
  
  		
}
</script>
