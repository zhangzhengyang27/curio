<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 25, 0]"
    :camera-options="{ fov: 50, near: 1, far: 10000 }"
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
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webaudio - sandbox<br/>\n\t\t\tmusic by <a href=\"http://www.newgrounds.com/audio/listen/358232\" target=\"_blank\" rel=\"noopener\">larrylarrybb</a>,\n\t\t\t<a href=\"http://www.newgrounds.com/audio/listen/376737\" target=\"_blank\" rel=\"noopener\">skullbeatz</a> and\n\t\t\t<a href=\"http://opengameart.org/content/project-utopia-seamless-loop\" target=\"_blank\" rel=\"noopener\">congusbongus</a><br/><br/>\n\t\t\tnavigate with WASD / arrows / mouse"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let light;
  
  			let material1, material2, material3;
  
  			let analyser1, analyser2, analyser3;
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			const startButton = document.createElement( 'button' );
  			startButton.textContent = 'Click to Start';
  			startButton.style.cssText = 'padding:12px 24px;font-size:16px;cursor:pointer;';
  			__stage.overlay?.appendChild( startButton );
  			startButton.addEventListener( 'click', init );
  
  			function init() {
  				startButton.remove();
  
  				
  
  
  				const listener = new THREE.AudioListener();
  				camera.add( listener );
  
  				
  				scene.fog = new THREE.FogExp2( 0x000000, 0.0025 );
  
  				light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 0, 0.5, 1 ).normalize();
  				scene.add( light );
  
  				const sphere = new THREE.SphereGeometry( 20, 32, 16 );
  
  				material1 = new THREE.MeshPhongMaterial( { color: 0xffaa00, flatShading: true, shininess: 0 } );
  				material2 = new THREE.MeshPhongMaterial( { color: 0xff2200, flatShading: true, shininess: 0 } );
  				material3 = new THREE.MeshPhongMaterial( { color: 0x6622aa, flatShading: true, shininess: 0 } );
  
  				// sound spheres
  
  				const mesh1 = new THREE.Mesh( sphere, material1 );
  				mesh1.position.set( - 250, 30, 0 );
  				scene.add( mesh1 );
  
  				const sound1 = new THREE.PositionalAudio( listener );
  				const songElement = new Audio( ASSET_HOST + 'sounds/358232_j_s_song.mp3' );
  				songElement.loop = true;
  				sound1.setMediaElementSource( songElement );
  				sound1.setRefDistance( 20 );
  				songElement.play();
  				mesh1.add( sound1 );
  
  				//
  
  				const mesh2 = new THREE.Mesh( sphere, material2 );
  				mesh2.position.set( 250, 30, 0 );
  				scene.add( mesh2 );
  
  				const sound2 = new THREE.PositionalAudio( listener );
  				const skullbeatzElement = new Audio( ASSET_HOST + 'sounds/376737_Skullbeatz___Bad_Cat_Maste.mp3' );
  				skullbeatzElement.loop = true;
  				sound2.setMediaElementSource( skullbeatzElement );
  				sound2.setRefDistance( 20 );
  				skullbeatzElement.play();
  				mesh2.add( sound2 );
  
  				//
  
  				const mesh3 = new THREE.Mesh( sphere, material3 );
  				mesh3.position.set( 0, 30, - 250 );
  				scene.add( mesh3 );
  
  				const sound3 = new THREE.PositionalAudio( listener );
  				const oscillator = listener.context.createOscillator();
  				oscillator.type = 'sine';
  				oscillator.frequency.setValueAtTime( 144, sound3.context.currentTime );
  				oscillator.start( 0 );
  				sound3.setNodeSource( oscillator );
  				sound3.setRefDistance( 20 );
  				sound3.setVolume( 0.5 );
  				mesh3.add( sound3 );
  
  				// analysers
  
  				analyser1 = new THREE.AudioAnalyser( sound1, 32 );
  				analyser2 = new THREE.AudioAnalyser( sound2, 32 );
  				analyser3 = new THREE.AudioAnalyser( sound3, 32 );
  
  				// global ambient audio
  
  				const sound4 = new THREE.Audio( listener );
  				const utopiaElement = new Audio( ASSET_HOST + 'sounds/utopia.mp3' );
  				utopiaElement.loop = true;
  				sound4.setMediaElementSource( utopiaElement );
  				sound4.setVolume( 0.5 );
  				utopiaElement.play();
  
  				// ground
  
  				const helper = new THREE.GridHelper( 1000, 10, 0x444444, 0x444444 );
  				helper.position.y = 0.1;
  				scene.add( helper );
  
  				//
  
  				const SoundControls = function () {
  
  					this.master = listener.getMasterVolume();
  					this.firstSphere = sound1.getVolume();
  					this.secondSphere = sound2.getVolume();
  					this.thirdSphere = sound3.getVolume();
  					this.Ambient = sound4.getVolume();
  
  				};
  
  				const GeneratorControls = function () {
  
  					this.frequency = oscillator.frequency.value;
  					this.wavetype = oscillator.type;
  
  				};
  
  				gui = new GUI();
  				const soundControls = new SoundControls();
  				const generatorControls = new GeneratorControls();
  				const volumeFolder = gui.addFolder( 'sound volume' );
  				const generatorFolder = gui.addFolder( 'sound generator' );
  
  				volumeFolder.add( soundControls, 'master' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
  
  					listener.setMasterVolume( soundControls.master );
  
  				} );
  				volumeFolder.add( soundControls, 'firstSphere' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
  
  					sound1.setVolume( soundControls.firstSphere );
  
  				} );
  				volumeFolder.add( soundControls, 'secondSphere' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
  
  					sound2.setVolume( soundControls.secondSphere );
  
  				} );
  
  				volumeFolder.add( soundControls, 'thirdSphere' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
  
  					sound3.setVolume( soundControls.thirdSphere );
  
  				} );
  				volumeFolder.add( soundControls, 'Ambient' ).min( 0.0 ).max( 1.0 ).step( 0.01 ).onChange( function () {
  
  					sound4.setVolume( soundControls.Ambient );
  
  				} );
  				volumeFolder.open();
  				generatorFolder.add( generatorControls, 'frequency' ).min( 50.0 ).max( 5000.0 ).step( 1.0 ).onChange( function () {
  
  					oscillator.frequency.setValueAtTime( generatorControls.frequency, listener.context.currentTime );
  
  				} );
  				generatorFolder.add( generatorControls, 'wavetype', [ 'sine', 'square', 'sawtooth', 'triangle' ] ).onChange( function () {
  
  					oscillator.type = generatorControls.wavetype;
  
  				} );
  
  				generatorFolder.open();
  
  				//
  
  				
  
  
  				//
  
  				
  
  				controls.movementSpeed = 70;
  				controls.lookSpeed = 0.05;
  				controls.lookVertical = false;
  
  				//
		}
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				controls.update( delta );
    				material1.emissive.b = analyser1.getAverageFrequency() / 256;
    				material2.emissive.b = analyser2.getAverageFrequency() / 256;
    				material3.emissive.b = analyser3.getAverageFrequency() / 256;
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
