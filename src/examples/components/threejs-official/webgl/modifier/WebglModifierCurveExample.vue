<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[2, 2, 4]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
    :enable-controls="false"
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
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Flow } from 'three/examples/jsm/modifiers/CurveModifier.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - curve modifier"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  			const ACTION_SELECT = 1, ACTION_NONE = 0;
  			const curveHandles = [];
  			const mouse = new THREE.Vector2();
  
  			let stats;
  			let rayCaster, control, flow, action = ACTION_NONE;
  
  			
  
  
  				
  
  				
  
  
  
  				const initialPoints = [
  					{ x: 1, y: 0, z: - 1 },
  					{ x: 1, y: 0, z: 1 },
  					{ x: - 1, y: 0, z: 1 },
  					{ x: - 1, y: 0, z: - 1 },
  				];
  
  				const boxGeometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
  				const boxMaterial = new THREE.MeshBasicMaterial();
  
  				for ( const handlePos of initialPoints ) {
  
  					const handle = new THREE.Mesh( boxGeometry, boxMaterial );
  					handle.position.copy( handlePos );
  					curveHandles.push( handle );
  					scene.add( handle );
  
  				}
  
  				const curve = new THREE.CatmullRomCurve3(
  					curveHandles.map( ( handle ) => handle.position )
  				);
  				curve.curveType = 'centripetal';
  				curve.closed = true;
  
  				const points = curve.getPoints( 50 );
  				const line = new THREE.LineLoop(
  					new THREE.BufferGeometry().setFromPoints( points ),
  					new THREE.LineBasicMaterial( { color: 0x00ff00 } )
  				);
  
  				scene.add( line );
  
  				//
  
  				const light = new THREE.DirectionalLight( 0xffaa33, 3 );
  				light.position.set( - 10, 10, 10 );
  				scene.add( light );
  
  				const light2 = new THREE.AmbientLight( 0x003973, 3 );
  				scene.add( light2 );
  
  				//
  
  				const loader = new FontLoader();
  				loader.load( ASSET_HOST + 'fonts/helvetiker_regular.typeface.json', function ( font ) {
  
  					const geometry = new TextGeometry( 'Hello three.js!', {
  						font: font,
  						size: 0.2,
  						depth: 0.05,
  						curveSegments: 12,
  						bevelEnabled: true,
  						bevelThickness: 0.02,
  						bevelSize: 0.01,
  						bevelOffset: 0,
  						bevelSegments: 5,
  					} );
  
  					geometry.rotateX( Math.PI );
  
  					const material = new THREE.MeshStandardMaterial( {
  						color: 0x99ffff
  					} );
  
  					const objectToCurve = new THREE.Mesh( geometry, material );
  
  					flow = new Flow( objectToCurve );
  					flow.updateCurve( 0, curve );
  					scene.add( flow.object3D );
  
  				} );
  
  				//
  
  				
  
  
  				renderer.domElement.addEventListener( 'pointerdown', onPointerDown );
  
  				rayCaster = new THREE.Raycaster();
  				control = new TransformControls( camera, renderer.domElement );
  				control.addEventListener( 'dragging-changed', function ( event ) {
  
  					if ( ! event.value ) {
  
  						const points = curve.getPoints( 50 );
  						line.geometry.setFromPoints( points );
  						flow.updateCurve( 0, curve );
  
  					}
  
  				} );
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  			
  
  
  			
  
  			function onPointerDown( event ) {
  
  				action = ACTION_SELECT;
  				mouse.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  				mouse.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    if ( action === ACTION_SELECT ) {
    					rayCaster.setFromCamera( mouse, camera );
    					action = ACTION_NONE;
    					const intersects = rayCaster.intersectObjects( curveHandles, false );
    					if ( intersects.length ) {
    						const target = intersects[ 0 ].object;
    						control.attach( target );
    						scene.add( control.getHelper() );
    					}
    				}
    				if ( flow ) {
    					flow.moveAlongCurve( 0.001 );
    				}
    {
    stats.update();
    }
  })
  
  			function render() {
  
  
  
  				stats.update();
  
  			}
  		
}
</script>
