<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[-600, 550, 1300]"
    :camera-options="{ fov: 45, near: 1, far: 80000 }"
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
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - the Utah Teapot<br />\n\t\t\tfrom <a href=\"https://www.udacity.com/course/interactive-3d-graphics--cs291\" target=\"_blank\" rel=\"noopener\">Udacity Interactive 3D Graphics</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let cameraControls;
  
  			const teapotSize = 300;
  			let ambientLight, light;
  
  			let tess = - 1;	// force initialization
  			let bBottom;
  			let bLid;
  			let bBody;
  			let bFitLid;
  			let bNonBlinn;
  			let shading;
  
  			let teapot, textureCube;
  			const materials = {};
  
  			
  			render();
  
  			
  
  
  				
  
  				const canvasWidth = (__stage.container?.clientWidth || window.innerWidth);
  				const canvasHeight = (__stage.container?.clientHeight || window.innerHeight);
  
  				// CAMERA
  				
  
  
  				// LIGHTS
  				ambientLight = new THREE.AmbientLight( 0x7c7c7c, 2.0 );
  
  				light = new THREE.DirectionalLight( 0xFFFFFF, 2.0 );
  				light.position.set( 0.32, 0.39, 0.7 );
  
  				// RENDERER
  				
  
  
  
  
  				// EVENTS
  				
  
  				// CONTROLS
  				cameraControls = new OrbitControls( camera, renderer.domElement );
  				cameraControls.addEventListener( 'change', render );
  
  				// TEXTURE MAP
  				const textureMap = new THREE.TextureLoader().load( ASSET_HOST + 'textures/uv_grid_opengl.jpg' );
  				textureMap.wrapS = textureMap.wrapT = THREE.RepeatWrapping;
  				textureMap.anisotropy = 16;
  				textureMap.colorSpace = THREE.SRGBColorSpace;
  
  				// REFLECTION MAP
  				const path = ASSET_HOST + 'textures/cube/pisa/';
  				const urls = [ 'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png' ];
  
  				textureCube = new THREE.CubeTextureLoader().setPath( path ).load( urls );
  
  				materials[ 'wireframe' ] = new THREE.MeshBasicMaterial( { wireframe: true } );
  				materials[ 'flat' ] = new THREE.MeshPhongMaterial( { specular: 0x000000, flatShading: true, side: THREE.DoubleSide } );
  				materials[ 'smooth' ] = new THREE.MeshLambertMaterial( { side: THREE.DoubleSide } );
  				materials[ 'glossy' ] = new THREE.MeshPhongMaterial( { color: 0xc0c0c0, specular: 0x404040, shininess: 300, side: THREE.DoubleSide } );
  				materials[ 'textured' ] = new THREE.MeshPhongMaterial( { map: textureMap, side: THREE.DoubleSide } );
  				materials[ 'reflective' ] = new THREE.MeshPhongMaterial( { envMap: textureCube, side: THREE.DoubleSide } );
  
  				// scene itself
  				
  				scene.background = new THREE.Color( 0xAAAAAA );
  
  				scene.add( ambientLight );
  				scene.add( light );
  
  				// GUI
  				setupGui();
  
  			
  
  
  			// EVENT HANDLERS
  
  			
  
  			function setupGui() {
  
  				effectController = {
  					newTess: 15,
  					bottom: true,
  					lid: true,
  					body: true,
  					fitLid: false,
  					nonblinn: false,
  					newShading: 'glossy'
  				};
  
  				gui = new GUI();
  				gui.add( effectController, 'newTess', [ 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40, 50 ] ).name( 'Tessellation Level' ).onChange( render );
  				gui.add( effectController, 'lid' ).name( 'display lid' ).onChange( render );
  				gui.add( effectController, 'body' ).name( 'display body' ).onChange( render );
  				gui.add( effectController, 'bottom' ).name( 'display bottom' ).onChange( render );
  				gui.add( effectController, 'fitLid' ).name( 'snug lid' ).onChange( render );
  				gui.add( effectController, 'nonblinn' ).name( 'original scale' ).onChange( render );
  				gui.add( effectController, 'newShading', [ 'wireframe', 'flat', 'smooth', 'glossy', 'textured', 'reflective' ] ).name( 'Shading' ).onChange( render );
  
  			}
  
  
  			//
  
  			function render() {
  
  				if ( effectController.newTess !== tess ||
  					effectController.bottom !== bBottom ||
  					effectController.lid !== bLid ||
  					effectController.body !== bBody ||
  					effectController.fitLid !== bFitLid ||
  					effectController.nonblinn !== bNonBlinn ||
  					effectController.newShading !== shading ) {
  
  					tess = effectController.newTess;
  					bBottom = effectController.bottom;
  					bLid = effectController.lid;
  					bBody = effectController.body;
  					bFitLid = effectController.fitLid;
  					bNonBlinn = effectController.nonblinn;
  					shading = effectController.newShading;
  
  					createNewTeapot();
  
  				}
  
  				// skybox is rendered separately, so that it is always behind the teapot.
  				if ( shading === 'reflective' ) {
  
  					scene.background = textureCube;
  
  				} else {
  
  					scene.background = null;
  
  				}
  
  
  
  			}
  
  			// Whenever the teapot changes, the scene is rebuilt from scratch (not much to it).
  			function createNewTeapot() {
  
  				if ( teapot !== undefined ) {
  
  					teapot.geometry.dispose();
  					scene.remove( teapot );
  
  				}
  
  				const geometry = new TeapotGeometry( teapotSize,
  					tess,
  					effectController.bottom,
  					effectController.lid,
  					effectController.body,
  					effectController.fitLid,
  					! effectController.nonblinn );
  
  				teapot = new THREE.Mesh( geometry, materials[ shading ] );
  
  				scene.add( teapot );
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
