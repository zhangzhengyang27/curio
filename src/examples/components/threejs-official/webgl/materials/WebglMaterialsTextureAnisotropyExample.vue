<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 35, near: 1, far: 25000 }"
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

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - anisotropic texture filtering example"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			const SCREEN_WIDTH = (__stage.container?.clientWidth || window.innerWidth);
  			const SCREEN_HEIGHT = (__stage.container?.clientHeight || window.innerHeight);
  
  			let container, stats;
  
  			let scene1, scene2;
  
  			let mouseX = 0, mouseY = 0;
  
  			const windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			const windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			
  
  
  				
  
  				//
  
  				
  				camera.position.z = 1500;
  
  				scene1 = new THREE.Scene();
  				scene1.background = new THREE.Color( 0xf2f7ff );
  				scene1.fog = new THREE.Fog( 0xf2f7ff, 1, 25000 );
  
  				scene2 = new THREE.Scene();
  				scene2.background = new THREE.Color( 0xf2f7ff );
  				scene2.fog = new THREE.Fog( 0xf2f7ff, 1, 25000 );
  
  				scene1.add( new THREE.AmbientLight( 0xeef0ff, 3 ) );
  				scene2.add( new THREE.AmbientLight( 0xeef0ff, 3 ) );
  
  				const light1 = new THREE.DirectionalLight( 0xffffff, 6 );
  				light1.position.set( 1, 1, 1 );
  				scene1.add( light1 );
  
  				const light2 = new THREE.DirectionalLight( 0xffffff, 6 );
  				light2.position.set( 1, 1, 1 );
  				scene2.add( light2 );
  
  				// GROUND
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  
  				const texture1 = textureLoader.load( ASSET_HOST + 'textures/crate.gif' );
  				const material1 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture1 } );
  
  				texture1.colorSpace = THREE.SRGBColorSpace;
  				texture1.anisotropy = maxAnisotropy;
  				texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
  				texture1.repeat.set( 512, 512 );
  
  				const texture2 = textureLoader.load( ASSET_HOST + 'textures/crate.gif' );
  				const material2 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture2 } );
  
  				texture2.colorSpace = THREE.SRGBColorSpace;
  				texture2.anisotropy = 1;
  				texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
  				texture2.repeat.set( 512, 512 );
  
  				const valLeftEl = document.createElement( 'span' );
  				const valRightEl = document.createElement( 'span' );
  				const infoDiv = document.createElement( 'div' );
  				infoDiv.style.cssText = 'position:absolute;top:10px;left:10px;color:#fff;font-size:12px;';
  				infoDiv.appendChild( valLeftEl );
  				infoDiv.appendChild( document.createTextNode( ' | ' ) );
  				infoDiv.appendChild( valRightEl );
  				__stage.overlay?.appendChild( infoDiv );
  
  				if ( maxAnisotropy > 0 ) {
  
  					valLeftEl.innerHTML = texture1.anisotropy;
  					valRightEl.innerHTML = texture2.anisotropy;
  
  				} else {
  
  					valLeftEl.innerHTML = 'not supported';
  					valRightEl.innerHTML = 'not supported';
  
  				}
  
  				//
  
  				const geometry = new THREE.PlaneGeometry( 100, 100 );
  
  				const mesh1 = new THREE.Mesh( geometry, material1 );
  				mesh1.rotation.x = - Math.PI / 2;
  				mesh1.scale.set( 1000, 1000, 1000 );
  
  				const mesh2 = new THREE.Mesh( geometry, material2 );
  				mesh2.rotation.x = - Math.PI / 2;
  				mesh2.scale.set( 1000, 1000, 1000 );
  
  				scene1.add( mesh1 );
  				scene2.add( mesh2 );
  
  				// RENDERER
  
  
  
  				renderer.autoClear = false;
  
  				renderer.domElement.style.position = 'relative';
  
  
  				// STATS1
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				document.addEventListener( 'mousemove', onDocumentMouseMove );
  
  			
  
  
  
  			function onDocumentMouseMove( event ) {
  
  				mouseX = ( event.clientX - windowHalfX );
  				mouseY = ( event.clientY - windowHalfY );
  
  			}
  
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    camera.position.x += ( mouseX - camera.position.x ) * .05;
    				camera.position.y = THREE.MathUtils.clamp( camera.position.y + ( - ( mouseY - 200 ) - camera.position.y ) * .05, 50, 1000 );
    				renderer.clear();
    				renderer.setScissorTest( true );
    				renderer.setScissor( 0, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT );
    				renderer.render( scene1, camera );
    				renderer.setScissor( SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT );
    				renderer.render( scene2, camera );
    				renderer.setScissorTest( false );
    }
    				stats.update();
  })
  
  			function render() {
  
  				camera.position.x += ( mouseX - camera.position.x ) * .05;
  				camera.position.y = THREE.MathUtils.clamp( camera.position.y + ( - ( mouseY - 200 ) - camera.position.y ) * .05, 50, 1000 );
  
  
  
  				renderer.clear();
  				renderer.setScissorTest( true );
  
  				renderer.setScissor( 0, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT );
  				renderer.render( scene1, camera );
  
  				renderer.setScissor( SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2 - 2, SCREEN_HEIGHT );
  				renderer.render( scene2, camera );
  
  				renderer.setScissorTest( false );
  
  
  			}
  
  		
}
</script>
