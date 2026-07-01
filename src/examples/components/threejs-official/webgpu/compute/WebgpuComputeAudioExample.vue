<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 45, near: 0.01, far: 30 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Fn, uniform, instanceIndex, instancedArray, float, texture, screenUV, color } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Audio Processing</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let computeNode;
  			let waveBuffer, sampleRate;
  
  			let currentAudio, currentAnalyser;
  			const analyserBuffer = new Uint8Array( 1024 );
  
  
  			const startButton = document.getElementById( 'startButton' );
  			startButton.addEventListener( 'click', init );
  
  			async function playAudioBuffer() {
  
  				if ( currentAudio ) currentAudio.stop();
  
  				// compute audio
  
  				renderer.compute( computeNode );
  
  				const wave = new Float32Array( await renderer.getArrayBufferAsync( waveArray.value ) );
  
  				// play result
  
  				const audioOutputContext = new AudioContext( { sampleRate } );
  				const audioOutputBuffer = audioOutputContext.createBuffer( 1, wave.length, sampleRate );
  
  				audioOutputBuffer.copyToChannel( wave, 0 );
  
  				const source = audioOutputContext.createBufferSource();
  				source.connect( audioOutputContext.destination );
  				source.buffer = audioOutputBuffer;
  				source.start();
  
  				currentAudio = source;
  
  				// visual feedback
  
  				currentAnalyser = audioOutputContext.createAnalyser();
  				currentAnalyser.fftSize = 2048;
  
  				source.connect( currentAnalyser );
  
  			}
  
  			async 
  
  
  				const overlay = document.getElementById( 'overlay' );
  				overlay.remove();
  
  				// audio buffer
  
  				const soundBuffer = await fetch( ASSET_HOST + 'sounds/webgpu-audio-processing.mp3' ).then( res => res.arrayBuffer() );
  				const audioContext = new AudioContext();
  
  				const audioBuffer = await audioContext.decodeAudioData( soundBuffer );
  
  				waveBuffer = audioBuffer.getChannelData( 0 );
  
  				// adding extra silence to delay and pitch
  				waveBuffer = new Float32Array( [ ...waveBuffer, ...new Float32Array( 200000 ) ] );
  
  				sampleRate = audioBuffer.sampleRate / audioBuffer.numberOfChannels;
  
  				// create webgpu buffers
  
  				waveArray = instancedArray( waveBuffer );
  
  				// read-only buffer
  
  				const originalWave = instancedArray( waveBuffer ).toReadOnly();
  
  				// The Pixel Buffer Object (PBO) is required to get the GPU computed data to the CPU in the WebGL2 fallback.
  				// As used in `renderer.getArrayBufferAsync( waveArray.value )`.
  
  				originalWave.setPBO( true );
  				waveArray.setPBO( true );
  
  				// params
  
  				const pitch = uniform( 1.5 );
  				const delayVolume = uniform( .2 );
  				const delayOffset = uniform( .55 );
  
  
  				// compute (shader-node)
  
  				const computeShaderFn = Fn( () => {
  
  					const index = float( instanceIndex );
  
  					// pitch
  
  					const time = index.mul( pitch );
  
  					let wave = originalWave.element( time );
  
  
  					// delay
  
  					for ( let i = 1; i < 7; i ++ ) {
  
  						const waveOffset = originalWave.element( index.sub( delayOffset.mul( sampleRate ).mul( i ) ).mul( pitch ) );
  						const waveOffsetVolume = waveOffset.mul( delayVolume.div( i * i ) );
  
  						wave = wave.add( waveOffsetVolume );
  
  					}
  
  
  					// store
  
  					const waveStorageElementNode = waveArray.element( instanceIndex );
  
  					waveStorageElementNode.assign( wave );
  
  				} );
  
  
  				// compute
  
  				computeNode = computeShaderFn().compute( waveBuffer.length );
  
  				// renderer
  
  				
  
  				
  
  
  				// nodes
  
  				analyserTexture = new THREE.DataTexture( analyserBuffer, analyserBuffer.length, 1, THREE.RedFormat );
  
  				const spectrum = texture( analyserTexture, screenUV.x ).x.mul( screenUV.y );
  				const backgroundNode = color( 0x0000FF ).mul( spectrum );
  
  
  				// scene
  
  				
  				scene.backgroundNode = backgroundNode;
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				document.addEventListener( 'click', playAudioBuffer );
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Audio' );
  
  				gui.add( pitch, 'value', .5, 2, 0.01 ).name( 'pitch' );
  				gui.add( delayVolume, 'value', 0, 1, .01 ).name( 'delayVolume' );
  				gui.add( delayOffset, 'value', .1, 1, .01 ).name( 'delayOffset' );
  
  				//
  
  				playAudioBuffer();
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    if ( currentAnalyser ) {
    					currentAnalyser.getByteFrequencyData( analyserBuffer );
    					analyserTexture.needsUpdate = true;
    				}
  })
  
  		
}
</script>
