<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0.9728517749133652, 1.1044765132727201, 0.7316689528482836]"
    :camera-options="{ fov: 55, near: 0.001, far: 5000 }"
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
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CCDIKSolver, CCDIKHelper } from 'three/examples/jsm/animation/CCDIKSolver.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl - inverse kinematics<br />\n\t\t\tCharacter model by <a href=\"https://assetstore.unity.com/packages/3d/characters/humanoids/humans/kira-lowpoly-character-100303\" target=\"_blank\" rel=\"noopener\">Aki</a>, furnitures from <a href=\"https://poly.pizza\" target=\"_blank\" rel=\"noopener\">poly.pizza</a>, scene by <a href=\"https://abernier.link/edin\" target=\"_blank\" rel=\"noopener\">abernier</a>. CC0."
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  		let orbitControls, transformControls;
  		let mirrorSphereCamera;
  
  		const OOI = {};
  		let IKSolver;
  
  		let stats, gui, conf;
  		const v0 = new THREE.Vector3();
  
  		
  		async 
  
  
  			conf = {
  				followSphere: false,
  				turnHead: true,
  				ik_solver: true,
  				update: updateIK
  			};
  
  			
  			scene.fog = new THREE.FogExp2( 0xffffff, .17 );
  			scene.background = new THREE.Color( 0xffffff );
  
  			
  
  
  
  			const ambientLight = new THREE.AmbientLight( 0xffffff, 8 ); // soft white light
  			scene.add( ambientLight );
  
  			const dracoLoader = new DRACOLoader();
  			const gltfLoader = new GLTFLoader();
  			gltfLoader.setDRACOLoader( dracoLoader );
  
  			const gltf = await gltfLoader.loadAsync( ASSET_HOST + 'models/gltf/kira.glb' );
  			gltf.scene.traverse( n => {
  
  				if ( n.name === 'head' ) OOI.head = n;
  				if ( n.name === 'lowerarm_l' ) OOI.lowerarm_l = n;
  				if ( n.name === 'Upperarm_l' ) OOI.Upperarm_l = n;
  				if ( n.name === 'hand_l' ) OOI.hand_l = n;
  				if ( n.name === 'target_hand_l' ) OOI.target_hand_l = n;
  
  				if ( n.name === 'boule' ) OOI.sphere = n;
  				if ( n.name === 'Kira_Shirt_left' ) OOI.kira = n;
  
  			} );
  			scene.add( gltf.scene );
  
  			const targetPosition = OOI.sphere.position.clone(); // for orbit controls
  			OOI.hand_l.attach( OOI.sphere );
  
  			// mirror sphere cube-camera
  			const cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 1024 );
  			mirrorSphereCamera = new THREE.CubeCamera( 0.05, 50, cubeRenderTarget );
  			scene.add( mirrorSphereCamera );
  			const mirrorSphereMaterial = new THREE.MeshBasicMaterial( { envMap: cubeRenderTarget.texture } );
  			OOI.sphere.material = mirrorSphereMaterial;
  
  			OOI.kira.add( OOI.kira.skeleton.bones[ 0 ] );
  			const iks = [
  				{
  					target: 22, // "target_hand_l"
  					effector: 6, // "hand_l"
  					links: [
  						{
  							index: 5, // "lowerarm_l"
  							rotationMin: new THREE.Vector3( 1.2, - 1.8, - .4 ),
  							rotationMax: new THREE.Vector3( 1.7, - 1.1, .3 )
  						},
  						{
  							index: 4, // "Upperarm_l"
  							rotationMin: new THREE.Vector3( 0.1, - 0.7, - 1.8 ),
  							rotationMax: new THREE.Vector3( 1.1, 0, - 1.4 )
  						},
  					],
  				}
  			];
  			IKSolver = new CCDIKSolver( OOI.kira, iks );
  			const ccdikhelper = new CCDIKHelper( OOI.kira, iks, 0.01 );
  			scene.add( ccdikhelper );
  
  			gui = new GUI();
  			gui.add( conf, 'followSphere' ).name( 'follow sphere' );
  			gui.add( conf, 'turnHead' ).name( 'turn head' );
  			gui.add( conf, 'ik_solver' ).name( 'IK auto update' );
  			gui.add( conf, 'update' ).name( 'IK manual update()' );
  			gui.open();
  
  			//
  
  			
  
  
  			//
  
  			orbitControls = new OrbitControls( camera, renderer.domElement );
  			orbitControls.minDistance = 0.2;
  			orbitControls.maxDistance = 1.5;
  			orbitControls.enableDamping = true;
  			orbitControls.target.copy( targetPosition );
  
  			transformControls = new TransformControls( camera, renderer.domElement );
  			transformControls.size = 0.75;
  			transformControls.showX = false;
  			transformControls.space = 'world';
  			transformControls.attach( OOI.target_hand_l );
  			scene.add( transformControls.getHelper() );
  
  			// disable orbitControls while using transformControls
  			transformControls.addEventListener( 'mouseDown', () => orbitControls.enabled = false );
  			transformControls.addEventListener( 'mouseUp', () => orbitControls.enabled = true );
  
  			//
  
  			stats = new Stats();
  			__stage.overlay?.appendChild(stats.dom)
  
  			window.addEventListener( 'resize', onWindowResize, false );
  
  		
  
  
  		__stage.addUpdateCallback((_delta, _elapsed) => {
    if ( OOI.sphere && mirrorSphereCamera ) {
    				OOI.sphere.visible = false;
    				OOI.sphere.getWorldPosition( mirrorSphereCamera.position );
    				mirrorSphereCamera.update( renderer, scene );
    				OOI.sphere.visible = true;
    			}
    			if ( OOI.sphere && conf.followSphere ) {
    				// orbitControls follows the sphere
    				OOI.sphere.getWorldPosition( v0 );
    				orbitControls.target.lerp( v0, 0.1 );
    			}
    			if ( OOI.head && OOI.sphere && conf.turnHead ) {
    				// turn head
    				OOI.sphere.getWorldPosition( v0 );
    				OOI.head.lookAt( v0 );
    				OOI.head.rotation.set( OOI.head.rotation.x, OOI.head.rotation.y + Math.PI, OOI.head.rotation.z );
    			}
    			if ( conf.ik_solver ) {
    {
    if ( IKSolver ) IKSolver.update();
    			scene.traverse( function ( object ) {
    				if ( object.isSkinnedMesh ) object.computeBoundingSphere();
    			} );
    }
    			}
    			orbitControls.update();
    			stats.update(); // fps stats
  })
  
  		function updateIK() {
  
  			if ( IKSolver ) IKSolver.update();
  
  			scene.traverse( function ( object ) {
  
  				if ( object.isSkinnedMesh ) object.computeBoundingSphere();
  
  			} );
  
  		}
  
  		function onWindowResize() {
  
  			camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  			camera.updateProjectionMatrix();
  
  
  
  		}
  		
  __stage.setCamera(camera)
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
