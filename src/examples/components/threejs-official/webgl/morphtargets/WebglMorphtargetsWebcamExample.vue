<template>
  <ExampleScene
    camera="perspective"
    antialias
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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - morph targets - webcam<br/>\n\t\t\tmodel by <a href=\"https://www.bannaflak.com/face-cap\" target=\"_blank\" rel=\"noopener\">Face Cap</a>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			// Mediapipe
  
  
  			const blendshapesMap = {
  				// '_neutral': '',
  				'browDownLeft': 'browDown_L',
  				'browDownRight': 'browDown_R',
  				'browInnerUp': 'browInnerUp',
  				'browOuterUpLeft': 'browOuterUp_L',
  				'browOuterUpRight': 'browOuterUp_R',
  				'cheekPuff': 'cheekPuff',
  				'cheekSquintLeft': 'cheekSquint_L',
  				'cheekSquintRight': 'cheekSquint_R',
  				'eyeBlinkLeft': 'eyeBlink_L',
  				'eyeBlinkRight': 'eyeBlink_R',
  				'eyeLookDownLeft': 'eyeLookDown_L',
  				'eyeLookDownRight': 'eyeLookDown_R',
  				'eyeLookInLeft': 'eyeLookIn_L',
  				'eyeLookInRight': 'eyeLookIn_R',
  				'eyeLookOutLeft': 'eyeLookOut_L',
  				'eyeLookOutRight': 'eyeLookOut_R',
  				'eyeLookUpLeft': 'eyeLookUp_L',
  				'eyeLookUpRight': 'eyeLookUp_R',
  				'eyeSquintLeft': 'eyeSquint_L',
  				'eyeSquintRight': 'eyeSquint_R',
  				'eyeWideLeft': 'eyeWide_L',
  				'eyeWideRight': 'eyeWide_R',
  				'jawForward': 'jawForward',
  				'jawLeft': 'jawLeft',
  				'jawOpen': 'jawOpen',
  				'jawRight': 'jawRight',
  				'mouthClose': 'mouthClose',
  				'mouthDimpleLeft': 'mouthDimple_L',
  				'mouthDimpleRight': 'mouthDimple_R',
  				'mouthFrownLeft': 'mouthFrown_L',
  				'mouthFrownRight': 'mouthFrown_R',
  				'mouthFunnel': 'mouthFunnel',
  				'mouthLeft': 'mouthLeft',
  				'mouthLowerDownLeft': 'mouthLowerDown_L',
  				'mouthLowerDownRight': 'mouthLowerDown_R',
  				'mouthPressLeft': 'mouthPress_L',
  				'mouthPressRight': 'mouthPress_R',
  				'mouthPucker': 'mouthPucker',
  				'mouthRight': 'mouthRight',
  				'mouthRollLower': 'mouthRollLower',
  				'mouthRollUpper': 'mouthRollUpper',
  				'mouthShrugLower': 'mouthShrugLower',
  				'mouthShrugUpper': 'mouthShrugUpper',
  				'mouthSmileLeft': 'mouthSmile_L',
  				'mouthSmileRight': 'mouthSmile_R',
  				'mouthStretchLeft': 'mouthStretch_L',
  				'mouthStretchRight': 'mouthStretch_R',
  				'mouthUpperUpLeft': 'mouthUpperUp_L',
  				'mouthUpperUpRight': 'mouthUpperUp_R',
  				'noseSneerLeft': 'noseSneer_L',
  				'noseSneerRight': 'noseSneer_R',
  				// '': 'tongueOut'
  			};
  
  			// MediaPipe returns the head pose in a metric 3D space that assumes a
  			// fixed virtual camera: right-handed, at the origin, looking down -Z, with
  			// units in centimeters and a vertical field of view of 63 degrees. The
  			// camera, the video plane and the model all have to share that frame for
  			// the rendered face to register with the webcam image.
  
  			const MP_FOV = 63; // vertical field of view, in degrees
  			const MP_NEAR = 1; // 1 cm
  			const MP_FAR = 10000; // 100 m
  
  			const VIDEO_DISTANCE = 100; // depth of the video plane, in cm
  
  			//
  
  
  
  
  			renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  			// The render camera matches MediaPipe's virtual camera: at the origin,
  			// looking down -Z. It must not be moved, otherwise the overlay drifts. Its
  			// aspect switches to the video's once the webcam is running.
  
  
  
  			scene.background = new THREE.Color( 0x666666 );
  			scene.scale.x = - 1; // mirror the whole scene for a selfie view ( flips video and pose together )
  
  			scene.add( new THREE.AmbientLight( 0xffffff, 5 ) );
  
  			// Face
  
  			let face, eyeL, eyeR;
  			const eyeRotationLimit = THREE.MathUtils.degToRad( 30 );
  
  			// MediaPipe's facial transformation matrix is copied here verbatim. Until
  			// the webcam delivers one, the face rests at a default frontal pose ( in
  			// front of the camera, in centimeters ) so it is framed before tracking.
  			const faceContainer = new THREE.Object3D();
  			faceContainer.matrixAutoUpdate = false;
  			faceContainer.matrix.makeTranslation( 0, 0, - 50 );
  			faceContainer.matrixWorldNeedsUpdate = true;
  			scene.add( faceContainer );
  
  			// The Face Cap model is not MediaPipe's canonical face mesh, so this fixed
  			// transform registers it into the canonical frame ( centimeters, +Y up,
  			// +Z out of the face ) before the pose matrix is applied. The values are
  			// derived from the model's eye positions.
  			const registration = new THREE.Object3D();
  			registration.scale.setScalar( 0.958 );
  			registration.rotation.x = Math.PI / 2;
  			registration.position.set( 0, 0.12, 1.18 );
  			faceContainer.add( registration );
  
  			const ktx2Loader = new KTX2Loader()
  				.detectSupport( renderer );
  
  			new GLTFLoader()
  				.setKTX2Loader( ktx2Loader )
  				.setMeshoptDecoder( MeshoptDecoder )
  				.load( ASSET_HOST + 'models/gltf/facecap.glb', ( gltf ) => {
  
  					// Reparent the head/eyes/teeth and drop the model's own scale rig.
  					const group = gltf.scene.getObjectByName( 'grp_transform' );
  					registration.add( group );
  
  					const head = group.getObjectByName( 'mesh_2' );
  					head.material = new THREE.MeshNormalMaterial();
  
  					const teeth = group.getObjectByName( 'mesh_3' );
  					teeth.material = new THREE.MeshNormalMaterial();
  
  					face = head;
  					eyeL = group.getObjectByName( 'eyeLeft' );
  					eyeR = group.getObjectByName( 'eyeRight' );
  
  					// GUI
  
  					const gui = new GUI();
  					gui.close();
  
  					const influences = head.morphTargetInfluences;
  
  					for ( const [ key, value ] of Object.entries( head.morphTargetDictionary ) ) {
  
  						gui.add( influences, value, 0, 1, 0.01 )
  							.name( key.replace( 'blendShape1.', '' ) )
  							.listen( influences );
  
  					}
  
  					} );
  
  			// Video Texture
  
  			const video = document.createElement( 'video' );
  
  			const texture = new THREE.VideoTexture( video );
  			texture.colorSpace = THREE.SRGBColorSpace;
  
  			const geometry = new THREE.PlaneGeometry( 1, 1 );
  			const material = new THREE.MeshBasicMaterial( { map: texture, depthTest: false, depthWrite: false } );
  			const videomesh = new THREE.Mesh( geometry, material );
  			videomesh.position.z = - VIDEO_DISTANCE;
  			videomesh.renderOrder = - 1;
  			scene.add( videomesh );
  
  			// MediaPipe
  
  			const filesetResolver = await FilesetResolver.forVisionTasks(
  				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
  			);
  
  			const faceLandmarker = await FaceLandmarker.createFromOptions( filesetResolver, {
  				baseOptions: {
  					modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  					delegate: 'GPU'
  				},
  				outputFaceBlendshapes: true,
  				outputFacialTransformationMatrixes: true,
  				runningMode: 'VIDEO',
  				numFaces: 1
  			} );
  
  			if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {
  
  				navigator.mediaDevices.getUserMedia( { video: { facingMode: 'user' } } )
  					.then( function ( stream ) {
  
  						video.srcObject = stream;
  						video.play();
  
  					} )
  					.catch( function ( error ) {
  
  						console.warn( 'Unable to access the camera/webcam.', error );
  
  					} );
  
  			}
  
  			// The camera matches the video aspect; the canvas is sized to that aspect
  			// and centered, so the grey body shows through as letterbox/pillarbox bars.
  
  			video.addEventListener( 'loadedmetadata', function () {
  
  				const aspect = video.videoWidth / video.videoHeight;
  
  				camera.aspect = aspect;
  				camera.updateProjectionMatrix();
  
  				// Size the plane so it exactly fills the frustum at its depth.
  				const height = 2 * VIDEO_DISTANCE * Math.tan( THREE.MathUtils.degToRad( MP_FOV / 2 ) );
  				videomesh.scale.set( height * aspect, height, 1 );
  
  				resize();
  
  			} );
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    if ( video.readyState >= HTMLMediaElement.HAVE_METADATA ) {
    					const results = faceLandmarker.detectForVideo( video, Date.now() );
    					if ( results.facialTransformationMatrixes.length > 0 ) {
    						// Apply MediaPipe's metric pose matrix directly.
    						faceContainer.matrix.fromArray( results.facialTransformationMatrixes[ 0 ].data );
    						faceContainer.matrixWorldNeedsUpdate = true;
    					}
    					if ( results.faceBlendshapes.length > 0 ) {
    						const faceBlendshapes = results.faceBlendshapes[ 0 ].categories;
    						// Morph values does not exist on the eye meshes, so we map the eyes blendshape score into rotation values
    						const eyeScore = {
    							leftHorizontal: 0,
    							rightHorizontal: 0,
    							leftVertical: 0,
    							rightVertical: 0,
    						};
    						for ( const blendshape of faceBlendshapes ) {
    							const categoryName = blendshape.categoryName;
    							const score = blendshape.score;
    							const index = face.morphTargetDictionary[ blendshapesMap[ categoryName ] ];
    							if ( index !== undefined ) {
    								face.morphTargetInfluences[ index ] = score;
    							}
    							// There are two blendshape for movement on each axis (up/down , in/out)
    							// Add one and subtract the other to get the final score in -1 to 1 range
    							switch ( categoryName ) {
    								case 'eyeLookInLeft':
    									eyeScore.leftHorizontal += score;
    									break;
    								case 'eyeLookOutLeft':
    									eyeScore.leftHorizontal -= score;
    									break;
    								case 'eyeLookInRight':
    									eyeScore.rightHorizontal -= score;
    									break;
    								case 'eyeLookOutRight':
    									eyeScore.rightHorizontal += score;
    									break;
    								case 'eyeLookUpLeft':
    									eyeScore.leftVertical -= score;
    									break;
    								case 'eyeLookDownLeft':
    									eyeScore.leftVertical += score;
    									break;
    								case 'eyeLookUpRight':
    									eyeScore.rightVertical -= score;
    									break;
    								case 'eyeLookDownRight':
    									eyeScore.rightVertical += score;
    									break;
    							}
    						}
    						eyeL.rotation.z = eyeScore.leftHorizontal * eyeRotationLimit;
    						eyeR.rotation.z = eyeScore.rightHorizontal * eyeRotationLimit;
    						eyeL.rotation.x = eyeScore.leftVertical * eyeRotationLimit;
    						eyeR.rotation.x = eyeScore.rightVertical * eyeRotationLimit;
    					}
    				}
  })
  
  			function resize() {
  
  				// Largest video-aspect rectangle that fits inside the window.
  				let width = (__stage.container?.clientWidth || window.innerWidth);
  				let height = (__stage.container?.clientHeight || window.innerHeight);
  
  				if ( width / height > camera.aspect ) {
  
  					width = height * camera.aspect;
  
  				} else {
  
  					height = width / camera.aspect;
  
  				}
  
  
  
  			}
  
  			
  
  		
}
</script>
