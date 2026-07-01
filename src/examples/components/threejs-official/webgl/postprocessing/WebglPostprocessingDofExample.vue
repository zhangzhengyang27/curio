<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 70, near: 1, far: 3000 }"
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

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl depth-of-field with bokeh example<br/>\n\t\t\tshader by <a href=\"http://artmartinsh.blogspot.com/2010/02/glsl-lens-blur-filter-with-bokeh.html\">Martins Upitis</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats, singleMaterial, zmaterial, parameters, nobjects, cubeMaterial;
  
  			let mouseX = 0, mouseY = 0;
  
  			let windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			let windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			let width = (__stage.container?.clientWidth || window.innerWidth);
  			let height = (__stage.container?.clientHeight || window.innerHeight);
  
  			const materials = [], objects = [];
  
  			const postprocessing = {};
  
  			
  
  
  				
  
  				
  				camera.position.z = 200;
  
  				
  
  				
  
  
  				const path = ASSET_HOST + 'textures/cube/SwedishRoyalCastle/';
  				const format = '.jpg';
  				const urls = [
  					path + 'px' + format, path + 'nx' + format,
  					path + 'py' + format, path + 'ny' + format,
  					path + 'pz' + format, path + 'nz' + format
  				];
  
  				const textureCube = new THREE.CubeTextureLoader().load( urls );
  
  				parameters = { color: 0xff4900, envMap: textureCube };
  				cubeMaterial = new THREE.MeshBasicMaterial( parameters );
  
  				singleMaterial = false;
  
  				if ( singleMaterial ) zmaterial = [ cubeMaterial ];
  
  				const geo = new THREE.SphereGeometry( 1, 20, 10 );
  
  				const xgrid = 14, ygrid = 9, zgrid = 14;
  
  				nobjects = xgrid * ygrid * zgrid;
  
  				const s = 60;
  				let count = 0;
  
  				for ( let i = 0; i < xgrid; i ++ ) {
  
  					for ( let j = 0; j < ygrid; j ++ ) {
  
  						for ( let k = 0; k < zgrid; k ++ ) {
  
  							let mesh;
  
  							if ( singleMaterial ) {
  
  								mesh = new THREE.Mesh( geo, zmaterial );
  
  							} else {
  
  								mesh = new THREE.Mesh( geo, new THREE.MeshBasicMaterial( parameters ) );
  								materials[ count ] = mesh.material;
  
  							}
  
  							const x = 200 * ( i - xgrid / 2 );
  							const y = 200 * ( j - ygrid / 2 );
  							const z = 200 * ( k - zgrid / 2 );
  
  							mesh.position.set( x, y, z );
  							mesh.scale.set( s, s, s );
  
  							mesh.matrixAutoUpdate = false;
  							mesh.updateMatrix();
  
  							scene.add( mesh );
  							objects.push( mesh );
  
  							count ++;
  
  						}
  
  					}
  
  				}
  
  				initPostprocessing();
  
  				renderer.autoClear = false;
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				container.style.touchAction = 'none';
  				container.addEventListener( 'pointermove', onPointerMove );
  
  				
  
  				const effectController = {
  
  					focus: 500.0,
  					aperture: 5,
  					maxblur: 0.01
  
  				};
  
  				const matChanger = function ( ) {
  
  					postprocessing.bokeh.uniforms[ 'focus' ].value = effectController.focus;
  					postprocessing.bokeh.uniforms[ 'aperture' ].value = effectController.aperture * 0.00001;
  					postprocessing.bokeh.uniforms[ 'maxblur' ].value = effectController.maxblur;
  
  				};
  
  				const gui = new GUI();
  				gui.add( effectController, 'focus', 10.0, 3000.0, 10 ).onChange( matChanger );
  				gui.add( effectController, 'aperture', 0, 10, 0.1 ).onChange( matChanger );
  				gui.add( effectController, 'maxblur', 0.0, 0.01, 0.001 ).onChange( matChanger );
  				gui.close();
  
  				matChanger();
  
  			
  
  
  			function onPointerMove( event ) {
  
  				if ( event.isPrimary === false ) return;
  
  				mouseX = event.clientX - windowHalfX;
  				mouseY = event.clientY - windowHalfY;
  
  			}
  
  			
  
  			function initPostprocessing() {
  
  				const renderPass = new RenderPass( scene, camera );
  
  				const bokehPass = new BokehPass( scene, camera, {
  					focus: 1.0,
  					aperture: 0.025,
  					maxblur: 0.01
  				} );
  
  				const outputPass = new OutputPass();
  
  				const composer = new EffectComposer( renderer );
  
  				composer.addPass( renderPass );
  				composer.addPass( bokehPass );
  				composer.addPass( outputPass );
  
  				postprocessing.composer = composer;
  				postprocessing.bokeh = bokehPass;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.begin();
    {
    const time = Date.now() * 0.00005;
    				camera.position.x += ( mouseX - camera.position.x ) * 0.036;
    				camera.position.y += ( - ( mouseY ) - camera.position.y ) * 0.036;
    				if ( ! singleMaterial ) {
    					for ( let i = 0; i < nobjects; i ++ ) {
    						const h = ( 360 * ( i / nobjects + time ) % 360 ) / 360;
    						materials[ i ].color.setHSL( h, 1, 0.5 );
    					}
    				}
    				postprocessing.composer.render( 0.1 );
    }
    				stats.end();
  })
  
  			function render() {
  
  				const time = Date.now() * 0.00005;
  
  				camera.position.x += ( mouseX - camera.position.x ) * 0.036;
  				camera.position.y += ( - ( mouseY ) - camera.position.y ) * 0.036;
  
  
  
  				if ( ! singleMaterial ) {
  
  					for ( let i = 0; i < nobjects; i ++ ) {
  
  						const h = ( 360 * ( i / nobjects + time ) % 360 ) / 360;
  						materials[ i ].color.setHSL( h, 1, 0.5 );
  
  					}
  
  				}
  
  				postprocessing.composer.render( 0.1 );
  
  			}
  
  		
}
</script>
