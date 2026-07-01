<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 30, near: 1, far: 10000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> render-to-texture webgl example"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let container, stats;
  
  			let cameraRTT, sceneRTT, sceneScreen, zmesh1, zmesh2;
  
  			let mouseX = 0, mouseY = 0;
  
  			const windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			const windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			let rtTexture, material, quad;
  
  			let delta = 0.01;
  
  			
  
  
  				container = document.getElementById( 'container' );
  
  				
  				camera.position.z = 100;
  
  				cameraRTT = new THREE.OrthographicCamera( (__stage.container?.clientWidth || window.innerWidth) / - 2, (__stage.container?.clientWidth || window.innerWidth) / 2, (__stage.container?.clientHeight || window.innerHeight) / 2, (__stage.container?.clientHeight || window.innerHeight) / - 2, 1, 1000 );
  				cameraRTT.position.z = 500;
  
  				//
  
  				
  				sceneRTT = new THREE.Scene();
  				sceneScreen = new THREE.Scene();
  
  				let light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 0, 0, 1 ).normalize();
  				sceneRTT.add( light );
  
  				light = new THREE.DirectionalLight( 0xffd5d5, 4.5 );
  				light.position.set( 0, 0, - 1 ).normalize();
  				sceneRTT.add( light );
  
  				rtTexture = new THREE.WebGLRenderTarget( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  
  				material = new THREE.ShaderMaterial( {
  
  					uniforms: { time: { value: 0.0 } },
  					vertexShader: document.getElementById( 'vertexShader' ).textContent,
  					fragmentShader: document.getElementById( 'fragment_shader_pass_1' ).textContent
  
  				} );
  
  				const materialScreen = new THREE.ShaderMaterial( {
  
  					uniforms: { tDiffuse: { value: rtTexture.texture } },
  					vertexShader: document.getElementById( 'vertexShader' ).textContent,
  					fragmentShader: document.getElementById( 'fragment_shader_screen' ).textContent,
  
  					depthWrite: false
  
  				} );
  
  				const plane = new THREE.PlaneGeometry( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  
  				quad = new THREE.Mesh( plane, material );
  				quad.position.z = - 100;
  				sceneRTT.add( quad );
  
  				const torusGeometry = new THREE.TorusGeometry( 100, 25, 15, 30 );
  
  				const mat1 = new THREE.MeshPhongMaterial( { color: 0x9c9c9c, specular: 0xffaa00, shininess: 5 } );
  				const mat2 = new THREE.MeshPhongMaterial( { color: 0x9c0000, specular: 0xff2200, shininess: 5 } );
  
  				zmesh1 = new THREE.Mesh( torusGeometry, mat1 );
  				zmesh1.position.set( 0, 0, 100 );
  				zmesh1.scale.set( 1.5, 1.5, 1.5 );
  				sceneRTT.add( zmesh1 );
  
  				zmesh2 = new THREE.Mesh( torusGeometry, mat2 );
  				zmesh2.position.set( 0, 150, 100 );
  				zmesh2.scale.set( 0.75, 0.75, 0.75 );
  				sceneRTT.add( zmesh2 );
  
  				quad = new THREE.Mesh( plane, materialScreen );
  				quad.position.z = - 100;
  				sceneScreen.add( quad );
  
  				const n = 5,
  					geometry = new THREE.SphereGeometry( 10, 64, 32 ),
  					material2 = new THREE.MeshBasicMaterial( { color: 0xffffff, map: rtTexture.texture } );
  
  				for ( let j = 0; j < n; j ++ ) {
  
  					for ( let i = 0; i < n; i ++ ) {
  
  						const mesh = new THREE.Mesh( geometry, material2 );
  
  						mesh.position.x = ( i - ( n - 1 ) / 2 ) * 20;
  						mesh.position.y = ( j - ( n - 1 ) / 2 ) * 20;
  						mesh.position.z = 0;
  
  						mesh.rotation.y = - Math.PI / 2;
  
  						scene.add( mesh );
  
  					}
  
  				}
  
  				
  
  
  				renderer.autoClear = false;
  
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				document.addEventListener( 'mousemove', onDocumentMouseMove );
  
  			
  
  
  			function onDocumentMouseMove( event ) {
  
  				mouseX = ( event.clientX - windowHalfX );
  				mouseY = ( event.clientY - windowHalfY );
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const time = Date.now() * 0.0015;
    				camera.position.x += ( mouseX - camera.position.x ) * .05;
    				camera.position.y += ( - mouseY - camera.position.y ) * .05;
    				if ( zmesh1 && zmesh2 ) {
    					zmesh1.rotation.y = - time;
    					zmesh2.rotation.y = - time + Math.PI / 2;
    				}
    				if ( material.uniforms[ 'time' ].value > 1 || material.uniforms[ 'time' ].value < 0 ) {
    					delta *= - 1;
    				}
    				material.uniforms[ 'time' ].value += delta;
    				// Render first scene into texture
    				renderer.setRenderTarget( rtTexture );
    				renderer.clear();
    				// Render full screen quad with generated texture
    				renderer.setRenderTarget( null );
    				renderer.clear();
    				// Render second scene to screen
    				// (using first scene as regular texture)
    }
    				stats.update();
  })
  
  			function render() {
  
  				const time = Date.now() * 0.0015;
  
  				camera.position.x += ( mouseX - camera.position.x ) * .05;
  				camera.position.y += ( - mouseY - camera.position.y ) * .05;
  
  
  
  				if ( zmesh1 && zmesh2 ) {
  
  					zmesh1.rotation.y = - time;
  					zmesh2.rotation.y = - time + Math.PI / 2;
  
  				}
  
  				if ( material.uniforms[ 'time' ].value > 1 || material.uniforms[ 'time' ].value < 0 ) {
  
  					delta *= - 1;
  
  				}
  
  				material.uniforms[ 'time' ].value += delta;
  
  
  				// Render first scene into texture
  
  				renderer.setRenderTarget( rtTexture );
  				renderer.clear();
  				renderer.render( sceneRTT, cameraRTT );
  
  				// Render full screen quad with generated texture
  
  				renderer.setRenderTarget( null );
  				renderer.clear();
  				renderer.render( sceneScreen, cameraRTT );
  
  				// Render second scene to screen
  				// (using first scene as regular texture)
  
  
  
  			}
  
  		
}
</script>
