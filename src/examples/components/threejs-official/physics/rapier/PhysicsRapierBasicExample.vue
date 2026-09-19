<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 3, 10]"
    :camera-options="{ fov: 60, near: 0.1, far: 100 }"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RapierPhysics } from 'three/examples/jsm/physics/RapierPhysics.js';
import { RapierHelper } from 'three/examples/jsm/helpers/RapierHelper.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let _intervalId: any = null

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> physics - <a href=\"https://github.com/dimforge/rapier.js\" target=\"_blank\">rapier</a> basic"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			let stats;
  			let physics: any, physicsHelper: any;
  
  			
  
  
  				
  				scene.background = new THREE.Color( 0xbfd1e5 );
  
  				
  
  
  				const ambient = new THREE.HemisphereLight( 0x555555, 0xFFFFFF );
  
  				scene.add( ambient );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 4 );
  
  				light.position.set( 0, 12.5, 12.5 );
  				light.castShadow = true;
  				light.shadow.radius = 3;
  				light.shadow.blurSamples = 8;
  				light.shadow.mapSize.width = 1024;
  				light.shadow.mapSize.height = 1024;
  
  				const size = 10;
  				light.shadow.camera.left = - size;
  				light.shadow.camera.bottom = - size;
  				light.shadow.camera.right = size;
  				light.shadow.camera.top = size;
  				light.shadow.camera.near = 1;
  				light.shadow.camera.far = 50;
  
  				scene.add( light );
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  
  				controls.enableDamping = true;
  				controls.target = new THREE.Vector3( 0, 2, 0 );
  				controls.update();
  
  				const geometry = new THREE.BoxGeometry( 10, 0.5, 10 );
  				const material = new THREE.MeshStandardMaterial( { color: 0xFFFFFF } );
  
  				const floor = new THREE.Mesh( geometry, material );
  				floor.receiveShadow = true;
  
  				floor.position.y = - 0.25;
  				floor.userData.physics = { mass: 0 };
  
  				scene.add( floor );
  
  				new THREE.TextureLoader().load( ASSET_HOST + 'textures/grid.png', function ( texture ) {
  
  					texture.wrapS = THREE.RepeatWrapping;
  					texture.wrapT = THREE.RepeatWrapping;
  					texture.repeat.set( 20, 20 );
  					floor.material.map = texture;
  					floor.material.needsUpdate = true;
  
  				} );
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				initPhysics();
  
  				onWindowResize();
  
  				window.addEventListener( 'resize', onWindowResize, false );
  
  			
  
  
  			async function initPhysics() {
  
  				//Initialize physics engine using the script in the jsm/physics folder
  				physics = await RapierPhysics();
  
  				physics.addScene( scene );
  
  				addBody( );
  
  				//Optionally display collider outlines
  				physicsHelper = new RapierHelper( physics.world );
  				scene.add( physicsHelper );
  
  				_intervalId = setInterval( addBody, 1000 );
  
  			}
  
  			const geometries = [
  				new THREE.BoxGeometry( 1, 1, 1 ),
  				new THREE.SphereGeometry( 0.5 ),
  				new RoundedBoxGeometry( 1, 1, 1, 2, 0.25 )
  			];
  
  			function addBody( ) {
  
  				const geometry = geometries[ Math.floor( Math.random() * geometries.length ) ];
  				const material = new THREE.MeshStandardMaterial( { color: Math.floor( Math.random() * 0xFFFFFF ) } );
  
  				const mesh = new THREE.Mesh( geometry, material );
  				mesh.castShadow = true;
  
  				mesh.position.set( Math.random() * 2 - 1, Math.random() * 3 + 6, Math.random() * 2 - 1 );
  
  				scene.add( mesh );
  
  				//parameter 2 - mass, parameter 3 - restitution ( how bouncy )
  				physics.addMesh( mesh, 1, 0.5 );
  
  			}
  
  			function onWindowResize( ) {
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  
  
  			}
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    for ( const object of scene.children ) {
    					if ( object.isMesh ) {
    						if ( object.position.y < - 10 ) {
    							scene.remove( object );
    							physics.removeMesh( object );
    						}
    					}
    				}
    				if ( physicsHelper ) physicsHelper.update();
    				stats.update();
  })
  
  		
}
function onBeforeDispose() { if (_intervalId) { clearInterval(_intervalId); _intervalId = null } }
</script>
