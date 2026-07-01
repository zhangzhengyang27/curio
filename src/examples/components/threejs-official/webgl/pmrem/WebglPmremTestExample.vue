<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 16]"
    :camera-options="{ fov: 40, near: 1, far: 30 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> -\n\t\t\t\tPMREM test by <a href=\"https://github.com/elalish\" target=\"_blank\" rel=\"noopener\">Emmett Lalish</a>\n\t\t\t\t<br>\n\t\t\t\t<br>1: white metal. 2: white dielectric. 3: black dielectric.\n\t\t\t\t<br>PMREM on: HDR with a single bright pixel. PMREM off: DirectionalLight.\n\t\t\t\t<br>The difference between these renders indicates the error in the PMREM approximations."
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			
  
  
  				const width = (__stage.container?.clientWidth || window.innerWidth);
  				const height = (__stage.container?.clientHeight || window.innerHeight);
  				const aspect = width / height;
  
  				// renderer
  
  				
  
  
  
  				// tonemapping
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 1;
  
  
  
  				
  
  				// scene
  
  				
  
  				// camera
  
  				
  				updateCamera();
  
  
  				// controls
  
  				
  				controls.addEventListener( 'change', render ); // use if there is no animation loop
  				controls.minDistance = 4;
  				controls.maxDistance = 20;
  
  				// light
  
  				const directionalLight = new THREE.DirectionalLight( 0xffffff, 0 ); // set intensity to 0 to start
  				const x = 597;
  				const y = 213;
  				const theta = ( x + 0.5 ) * Math.PI / 512;
  				const phi = ( y + 0.5 ) * Math.PI / 512;
  
  				directionalLight.position.setFromSphericalCoords( 100, - phi, Math.PI / 2 - theta );
  
  				scene.add( directionalLight );
  				// scene.add( new THREE.DirectionalLightHelper( directionalLight ) );
  
  				// The spot1Lux HDR environment map is expressed in nits (lux / sr). The directional light has units of lux,
  				// so to match a 1 lux light, we set a single pixel with a value equal to 1 divided by the solid
  				// angle of the pixel in steradians. This image is 1024 x 512,
  				// so the value is 1 / ( sin( phi ) * ( pi / 512 ) ^ 2 ) = 27,490 nits.
  
  				const gui = new GUI();
  				gui.add( { enabled: true }, 'enabled' )
  					.name( 'PMREM' )
  					.onChange( value => {
  
  						directionalLight.intensity = value ? 0 : 1;
  
  						scene.traverse( function ( child ) {
  
  							if ( child.isMesh ) {
  
  								child.material.envMapIntensity = 1 - directionalLight.intensity;
  
  							}
  
  						} );
  
  						render();
  
  					} );
  
  			
  
  
  			function createObjects() {
  
  				let radianceMap = null;
  				new HDRLoader()
  					// .setDataType( THREE.FloatType )
  					.setPath( ASSET_HOST + 'textures/equirectangular/' )
  					.load( 'spot1Lux.hdr', function ( texture ) {
  
  						radianceMap = pmremGenerator.fromEquirectangular( texture ).texture;
  						pmremGenerator.dispose();
  
  						scene.background = radianceMap;
  
  						const geometry = new THREE.SphereGeometry( 0.4, 32, 32 );
  
  						for ( let x = 0; x <= 10; x ++ ) {
  
  							for ( let y = 0; y <= 2; y ++ ) {
  
  								const material = new THREE.MeshPhysicalMaterial( {
  									roughness: x / 10,
  									metalness: y < 1 ? 1 : 0,
  									color: y < 2 ? 0xffffff : 0x000000,
  									envMap: radianceMap,
  									envMapIntensity: 1
  								} );
  
  								const mesh = new THREE.Mesh( geometry, material );
  								mesh.position.x = x - 5;
  								mesh.position.y = 1 - y;
  								scene.add( mesh );
  
  							}
  
  						}
  
  						render();
  
  					} );
  
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  				pmremGenerator.compileEquirectangularShader();
  
  			}
  
  			
  
  			function updateCamera() {
  
  				const horizontalFoV = 40;
  				const verticalFoV = 2 * Math.atan( Math.tan( horizontalFoV / 2 * Math.PI / 180 ) / camera.aspect ) * 180 / Math.PI;
  				camera.fov = verticalFoV;
  				camera.updateProjectionMatrix();
  
  			}
  
  			function render() {
  
  
  
  			}
  
  			Promise.resolve()
  				.then( init )
  				.then( createObjects )
  				.then( render );
  
  		
}
</script>
