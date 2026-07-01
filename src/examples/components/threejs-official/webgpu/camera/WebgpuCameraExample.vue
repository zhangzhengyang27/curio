<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :clear-color="0x000000"
    :camera-options="{ fov: 50, near: 1, far: 10000 }"
    custom-render
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

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Camera</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let SCREEN_WIDTH = (__stage.container?.clientWidth || window.innerWidth);
  			let SCREEN_HEIGHT = (__stage.container?.clientHeight || window.innerHeight);
  			let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  
  
  			let mesh;
  			let cameraRig, activeCamera, activeHelper;
  			let cameraPerspective, cameraOrtho;
  			let cameraPerspectiveHelper, cameraOrthoHelper;
  			const frustumSize = 600;
  
  			
  
  
  				
  
  				//
  
  				
  				camera.position.z = 2500;
  
  				cameraPerspective = new THREE.PerspectiveCamera( 50, 0.5 * aspect, 150, 1000 );
  
  				cameraPerspectiveHelper = new THREE.CameraHelper( cameraPerspective );
  				scene.add( cameraPerspectiveHelper );
  
  				//
  				cameraOrtho = new THREE.OrthographicCamera( 0.5 * frustumSize * aspect / - 2, 0.5 * frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 150, 1000 );
  
  				cameraOrthoHelper = new THREE.CameraHelper( cameraOrtho );
  				scene.add( cameraOrthoHelper );
  
  				//
  
  				activeCamera = cameraPerspective;
  				activeHelper = cameraPerspectiveHelper;
  
  
  				// counteract different front orientation of cameras vs rig
  
  				cameraOrtho.rotation.y = Math.PI;
  				cameraPerspective.rotation.y = Math.PI;
  
  				cameraRig = new THREE.Group();
  
  				cameraRig.add( cameraPerspective );
  				cameraRig.add( cameraOrtho );
  
  				scene.add( cameraRig );
  
  				//
  
  				mesh = new THREE.Mesh(
  					new THREE.SphereGeometry( 100, 16, 8 ),
  					new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } )
  				);
  				scene.add( mesh );
  
  				const mesh2 = new THREE.Mesh(
  					new THREE.SphereGeometry( 50, 16, 8 ),
  					new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } )
  				);
  				mesh2.position.y = 150;
  				mesh.add( mesh2 );
  
  				const mesh3 = new THREE.Mesh(
  					new THREE.SphereGeometry( 5, 16, 8 ),
  					new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } )
  				);
  				mesh3.position.z = 150;
  				cameraRig.add( mesh3 );
  
  				//
  
  				const geometry = new THREE.BufferGeometry();
  				const vertices = [];
  
  				for ( let i = 0; i < 10000; i ++ ) {
  
  					vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // x
  					vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // y
  					vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // z
  
  				}
  
  				geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
  
  				const particles = new THREE.Points( geometry, new THREE.PointsMaterial( { color: 0xffffff } ) );
  				scene.add( particles );
  
  				//
  
  				
  
  
  				renderer.setScissorTest( true );
  				renderer.setClearColor( 0x000000, 1 );
  
  				//
  
  				
  				document.addEventListener( 'keydown', onKeyDown );
  
  			
  
  
  			//
  
  			function onKeyDown( event ) {
  
  				switch ( event.keyCode ) {
  
  					case 79: /*O*/
  
  						activeCamera = cameraOrtho;
  						activeHelper = cameraOrthoHelper;
  
  						break;
  
  					case 80: /*P*/
  
  						activeCamera = cameraPerspective;
  						activeHelper = cameraPerspectiveHelper;
  
  						break;
  
  				}
  
  			}
  
  			//
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const r = Date.now() * 0.0005;
    				mesh.position.x = 700 * Math.cos( r );
    				mesh.position.z = 700 * Math.sin( r );
    				mesh.position.y = 700 * Math.sin( r );
    				mesh.children[ 0 ].position.x = 70 * Math.cos( 2 * r );
    				mesh.children[ 0 ].position.z = 70 * Math.sin( r );
    				if ( activeCamera === cameraPerspective ) {
    					cameraPerspective.fov = 35 + 30 * Math.sin( 0.5 * r );
    					cameraPerspective.far = mesh.position.length();
    					cameraPerspective.updateProjectionMatrix();
    					cameraPerspectiveHelper.update();
    					cameraPerspectiveHelper.visible = true;
    					cameraOrthoHelper.visible = false;
    				} else {
    					cameraOrtho.far = mesh.position.length();
    					cameraOrtho.updateProjectionMatrix();
    					cameraOrthoHelper.update();
    					cameraOrthoHelper.visible = true;
    					cameraPerspectiveHelper.visible = false;
    				}
    				cameraRig.lookAt( mesh.position );
    				//
    				activeHelper.visible = false;
    				renderer.setClearColor( 0x000000, 1 );
    				renderer.setScissor( 0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT );
    				renderer.setViewport( 0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT );
    				renderer.render( scene, activeCamera );
    				//
    				activeHelper.visible = true;
    				renderer.setClearColor( 0x111111, 1 );
    				renderer.setScissor( SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT );
    				renderer.setViewport( SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT );
    }
  })
  
  
  			function render() {
  
  				const r = Date.now() * 0.0005;
  
  				mesh.position.x = 700 * Math.cos( r );
  				mesh.position.z = 700 * Math.sin( r );
  				mesh.position.y = 700 * Math.sin( r );
  
  				mesh.children[ 0 ].position.x = 70 * Math.cos( 2 * r );
  				mesh.children[ 0 ].position.z = 70 * Math.sin( r );
  
  				if ( activeCamera === cameraPerspective ) {
  
  					cameraPerspective.fov = 35 + 30 * Math.sin( 0.5 * r );
  					cameraPerspective.far = mesh.position.length();
  					cameraPerspective.updateProjectionMatrix();
  
  					cameraPerspectiveHelper.update();
  					cameraPerspectiveHelper.visible = true;
  
  					cameraOrthoHelper.visible = false;
  
  				} else {
  
  					cameraOrtho.far = mesh.position.length();
  					cameraOrtho.updateProjectionMatrix();
  
  					cameraOrthoHelper.update();
  					cameraOrthoHelper.visible = true;
  
  					cameraPerspectiveHelper.visible = false;
  
  				}
  
  				cameraRig.lookAt( mesh.position );
  
  				//
  
  				activeHelper.visible = false;
  
  				renderer.setClearColor( 0x000000, 1 );
  				renderer.setScissor( 0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT );
  				renderer.setViewport( 0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT );
  				renderer.render( scene, activeCamera );
  
  				//
  
  				activeHelper.visible = true;
  
  				renderer.setClearColor( 0x111111, 1 );
  				renderer.setScissor( SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT );
  				renderer.setViewport( SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT );
  
  
  			}
  
  		
}
</script>
