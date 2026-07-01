<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 40, near: 1, far: 10000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
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

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Video Material</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  			let video, texture, material, mesh;
  
  			let mouseX = 0;
  			let mouseY = 0;
  
  			let windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			let windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			let cube_count;
  
  			const meshes = [],
  				materials = [],
  
  				xgrid = 20,
  				ygrid = 10;
  
  			
  
  
  				
  				camera.position.z = 500;
  
  				
  
  				const light = new THREE.DirectionalLight( 0xffffff, 7 );
  				light.position.set( 0.5, 1, 1 ).normalize();
  				scene.add( light );
  
  				
  
  
  				video = document.getElementById( 'video' );
  				video.play();
  				video.addEventListener( 'play', function () {
  
  					this.currentTime = 3;
  
  				} );
  
  				texture = new THREE.VideoTexture( video );
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				//
  
  				let i, j, ox, oy, geometry;
  
  				const ux = 1 / xgrid;
  				const uy = 1 / ygrid;
  
  				const xsize = 480 / xgrid;
  				const ysize = 204 / ygrid;
  
  				const parameters = { color: 0xffffff, map: texture };
  
  				cube_count = 0;
  
  				for ( i = 0; i < xgrid; i ++ ) {
  
  					for ( j = 0; j < ygrid; j ++ ) {
  
  						ox = i;
  						oy = j;
  
  						geometry = new THREE.BoxGeometry( xsize, ysize, xsize );
  
  						change_uvs( geometry, ux, uy, ox, oy );
  
  						materials[ cube_count ] = new THREE.MeshPhongMaterial( parameters );
  
  						material = materials[ cube_count ];
  
  						material.hue = i / xgrid;
  						material.saturation = 1 - j / ygrid;
  
  						material.color.setHSL( material.hue, material.saturation, 0.5 );
  
  						mesh = new THREE.Mesh( geometry, material );
  
  						mesh.position.x = ( i - xgrid / 2 ) * xsize;
  						mesh.position.y = ( j - ygrid / 2 ) * ysize;
  						mesh.position.z = 0;
  
  						mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;
  
  						scene.add( mesh );
  
  						mesh.dx = 0.001 * ( 0.5 - Math.random() );
  						mesh.dy = 0.001 * ( 0.5 - Math.random() );
  
  						meshes[ cube_count ] = mesh;
  
  						cube_count += 1;
  
  					}
  
  				}
  
  				document.addEventListener( 'mousemove', onDocumentMouseMove );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function change_uvs( geometry, unitx, unity, offsetx, offsety ) {
  
  				const uvs = geometry.attributes.uv.array;
  
  				for ( let i = 0; i < uvs.length; i += 2 ) {
  
  					uvs[ i ] = ( uvs[ i ] + offsetx ) * unitx;
  					uvs[ i + 1 ] = ( uvs[ i + 1 ] + offsety ) * unity;
  
  				}
  
  			}
  
  
  			function onDocumentMouseMove( event ) {
  
  				mouseX = ( event.clientX - windowHalfX );
  				mouseY = ( event.clientY - windowHalfY ) * 0.3;
  
  			}
  
  			//
  
  			let h, counter = 1;
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = Date.now() * 0.00005;
    				camera.position.x += ( mouseX - camera.position.x ) * 0.05;
    				camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
    				for ( let i = 0; i < cube_count; i ++ ) {
    					material = materials[ i ];
    					h = ( 360 * ( material.hue + time ) % 360 ) / 360;
    					material.color.setHSL( h, material.saturation, 0.5 );
    				}
    				if ( counter % 1000 > 200 ) {
    					for ( let i = 0; i < cube_count; i ++ ) {
    						mesh = meshes[ i ];
    						mesh.rotation.x += 10 * mesh.dx;
    						mesh.rotation.y += 10 * mesh.dy;
    						mesh.position.x -= 150 * mesh.dx;
    						mesh.position.y += 150 * mesh.dy;
    						mesh.position.z += 300 * mesh.dx;
    					}
    				}
    				if ( counter % 1000 === 0 ) {
    					for ( let i = 0; i < cube_count; i ++ ) {
    						mesh = meshes[ i ];
    						mesh.dx *= - 1;
    						mesh.dy *= - 1;
    					}
    				}
    				counter ++;
  })
  
  		
}
</script>
