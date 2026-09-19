<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 1, 4]"
    :camera-options="{ fov: 40, near: 0.25, far: 50 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { color, screenUV, hue, reflector, time, Fn, vec2, length, atan, float, sin, cos, vec3, sub, mul, pow, blendDodge, normalWorldGeometry } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Animation Retargeting</span>"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			const [ sourceModel, targetModel ] = await Promise.all( [
  
  				new Promise( ( resolve, reject ) => {
  
  					new GLTFLoader().load( ASSET_HOST + 'models/gltf/Michelle.glb', resolve, undefined, reject );
  
  				} ),
  
  				new Promise( ( resolve, reject ) => {
  
  					new GLTFLoader().load( ASSET_HOST + 'models/gltf/Soldier.glb', resolve, undefined, reject );
  
  				} )
  
  			] ) as any;
  
  			//
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			const lightSpeed = /*#__PURE__*/ Fn( ( [ suv_immutable ]: any ) => {
  
  				// forked from https://www.shadertoy.com/view/7ly3D1
  
  				const suv = vec2( suv_immutable );
  				const uv = vec2( length( suv ), atan( suv.y, suv.x ) );
  				const offset = float( float( .1 ).mul( sin( uv.y.mul( 10. ).sub( time.mul( .6 ) ) ) ).mul( cos( uv.y.mul( 48. ).add( time.mul( .3 ) ) ) ).mul( cos( uv.y.mul( 3.7 ).add( time ) ) ) );
  				const rays = vec3( vec3( sin( uv.y.mul( 150. ).add( time ) ).mul( .5 ).add( .5 ) ).mul( vec3( sin( uv.y.mul( 80. ).sub( time.mul( 0.6 ) ) ).mul( .5 ).add( .5 ) ) ).mul( vec3( sin( uv.y.mul( 45. ).add( time.mul( 0.8 ) ) ).mul( .5 ).add( .5 ) ) ).mul( vec3( sub( 1., cos( uv.y.add( mul( 22., time ).sub( pow( uv.x.add( offset ), .3 ).mul( 60. ) ) ) ) ) ) ).mul( vec3( uv.x.mul( 2. ) ) ) );
  
  				return rays;
  
  			} ).setLayout( {
  				name: 'lightSpeed',
  				type: 'vec3',
  				inputs: [
  					{ name: 'suv', type: 'vec2' }
  				]
  			} );
  
  			// scene
  
  
  
  			// background
  
  			const coloredVignette = screenUV.distance( .5 ).mix( hue( color( 0x0175ad ), time.mul( .1 ) ), hue( color( 0x02274f ), time.mul( .5 ) ) );
  			const lightSpeedEffect = (lightSpeed as any)( normalWorldGeometry ).clamp();
  			const lightSpeedSky = normalWorldGeometry.y.remapClamp( - .1, 1 ).mix( 0, lightSpeedEffect );
  			const composedBackground = blendDodge( coloredVignette, lightSpeedSky );
  
  			scene.backgroundNode = composedBackground;
  
  			//
  
  			const helpers = new THREE.Group();
  			helpers.visible = false;
  			scene.add( helpers );
  
  			const light = new THREE.HemisphereLight( 0xe9c0a5, 0x0175ad, 5 );
  			scene.add( light );
  
  			const dirLight = new THREE.DirectionalLight( 0xfff9ea, 4 );
  			dirLight.position.set( 2, 5, 2 );
  			scene.add( dirLight );
  
  
  
  
  			// add models to scene
  			scene.add( sourceModel.scene );
  			scene.add( targetModel.scene );
  
  			// reposition models
  			sourceModel.scene.position.x -= .8;
  			targetModel.scene.position.x += .7;
  
  			targetModel.scene.position.z -= .1;
  
  			// reajust model
  			targetModel.scene.scale.setScalar( .01 );
  
  			// flip model
  			sourceModel.scene.rotation.y = Math.PI / 2;
  			targetModel.scene.rotation.y = - Math.PI / 2;
  
  			// retarget
  			const source = getSource( sourceModel );
  			const mixer = retargetModel( source, targetModel );
  
  			// floor
  			const reflection = reflector();
  			reflection.target.rotateX( - Math.PI / 2 );
  			scene.add( reflection.target );
  
  			const floorMaterial = new THREE.NodeMaterial();
  			floorMaterial.colorNode = reflection;
  			floorMaterial.opacity = .2;
  			floorMaterial.transparent = true;
  
  			const floor = new THREE.Mesh( new THREE.BoxGeometry( 50, .001, 50 ), floorMaterial );
  			floor.receiveShadow = true;
  
  			floor.position.set( 0, 0, 0 );
  			scene.add( floor );
  
  			// renderer
  
  
  
  			renderer.toneMapping = THREE.NeutralToneMapping;
  			renderer.inspector = new Inspector();
  
  
  
  			controls.minDistance = 3;
  			controls.maxDistance = 12;
  			controls.target.set( 0, 1, 0 );
  			controls.maxPolarAngle = Math.PI / 2;
  
  			const gui = renderer.inspector.createParameters( 'Scene settings' );
  			gui.add( helpers, 'visible' ).name( 'show helpers' );
  
  			//
  
  			function getSource( sourceModel: any ) {
  
  				const clip = sourceModel.animations[ 0 ];
  
  				const helper = new THREE.SkeletonHelper( sourceModel.scene );
  				helpers.add( helper );
  
  				const skeleton = new THREE.Skeleton( helper.bones );
  
  				const mixer = new THREE.AnimationMixer( sourceModel.scene );
  				mixer.clipAction( sourceModel.animations[ 0 ] ).play();
  
  				return { clip, skeleton, mixer };
  
  			}
  
  			function retargetModel( sourceModel: any, targetModel: any ) {
  
  				const targetSkin = targetModel.scene.children[ 0 ].children[ 0 ];
  
  				const targetSkelHelper = new THREE.SkeletonHelper( targetModel.scene );
  				helpers.add( targetSkelHelper );
  
  				const rotateCW45 = new THREE.Matrix4().makeRotationY( THREE.MathUtils.degToRad( 45 ) );
  				const rotateCCW180 = new THREE.Matrix4().makeRotationY( THREE.MathUtils.degToRad( - 180 ) );
  				const rotateCW180 = new THREE.Matrix4().makeRotationY( THREE.MathUtils.degToRad( 180 ) );
  				const rotateFoot = new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler( THREE.MathUtils.degToRad( 45 ), THREE.MathUtils.degToRad( 180 ), THREE.MathUtils.degToRad( 0 ) ) );
  
  				const retargetOptions = {
  
  					// specify the name of the source's hip bone.
  					hip: 'mixamorigHips',
  
  					// specify the influence of the source's hip bone.
  					// use ( 0, 1, 0 ) to ignore xz hip movement.
  					//hipInfluence: new THREE.Vector3( 0, 1, 0 ),
  
  					// specify an animation range in seconds.
  					//trim: [ 3.0, 4.0 ],
  
  					// preserve the scale of the target model
  					scale: 1 / targetModel.scene.scale.y,
  
  					// offset target bones -> { targetBoneName: offsetMatrix }
  					localOffsets: {
  
  						mixamorigLeftShoulder: rotateCW45,
  						mixamorigRightShoulder: rotateCCW180,
  						mixamorigLeftArm: rotateCW45,
  						mixamorigRightArm: rotateCCW180,
  						mixamorigLeftForeArm: rotateCW45,
  						mixamorigRightForeArm: rotateCCW180,
  						mixamorigLeftHand: rotateCW45,
  						mixamorigRightHand: rotateCCW180,
  
  						mixamorigLeftUpLeg: rotateCW180,
  						mixamorigRightUpLeg: rotateCW180,
  						mixamorigLeftLeg: rotateCW180,
  						mixamorigRightLeg: rotateCW180,
  						mixamorigLeftFoot: rotateFoot,
  						mixamorigRightFoot: rotateFoot,
  						mixamorigLeftToeBase: rotateCW180,
  						mixamorigRightToeBase: rotateCW180
  
  					},
  
  					// Map of target's bone names to source's bone names -> { targetBoneName: sourceBoneName }
  					names: {
  
  						mixamorigHips: 'mixamorigHips',
  
  						mixamorigSpine: 'mixamorigSpine',
  						mixamorigSpine2: 'mixamorigSpine2',
  						mixamorigHead: 'mixamorigHead',
  
  						mixamorigLeftShoulder: 'mixamorigLeftShoulder',
  						mixamorigRightShoulder: 'mixamorigRightShoulder',
  						mixamorigLeftArm: 'mixamorigLeftArm',
  						mixamorigRightArm: 'mixamorigRightArm',
  						mixamorigLeftForeArm: 'mixamorigLeftForeArm',
  						mixamorigRightForeArm: 'mixamorigRightForeArm',
  						mixamorigLeftHand: 'mixamorigLeftHand',
  						mixamorigRightHand: 'mixamorigRightHand',
  
  						mixamorigLeftUpLeg: 'mixamorigLeftUpLeg',
  						mixamorigRightUpLeg: 'mixamorigRightUpLeg',
  						mixamorigLeftLeg: 'mixamorigLeftLeg',
  						mixamorigRightLeg: 'mixamorigRightLeg',
  						mixamorigLeftFoot: 'mixamorigLeftFoot',
  						mixamorigRightFoot: 'mixamorigRightFoot',
  						mixamorigLeftToeBase: 'mixamorigLeftToeBase',
  						mixamorigRightToeBase: 'mixamorigRightToeBase'
  
  					}
  
  				};
  
  				const retargetedClip = SkeletonUtils.retargetClip( targetSkin, sourceModel.skeleton, sourceModel.clip, retargetOptions );
  
  				// Apply the mixer directly to the SkinnedMesh, not any
  				// ancestor node, because that's what
  				// SkeletonUtils.retargetClip outputs the clip to be
  				// compatible with.
  				const mixer = new THREE.AnimationMixer( targetSkin );
  				mixer.clipAction( retargetedClip ).play();
  
  				return mixer;
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const delta = timer.getDelta();
    				source.mixer.update( delta );
    				mixer.update( delta );
  })
  
  		
}
</script>
