<template>
  <div class="graphics-root" ref="gContainer">
    <div id="container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const gContainer = ref(null)
const gfxLoadedScripts = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
    gfxLoadedScripts.push(s)
  })
}




async function initGraphicsExample() {
  const container = gContainer.value.querySelector('#container')
  await loadScript("/graphics/assets/external/spritejs.js");
  await loadScript("/graphics/assets/external/sprite-extend-3d.js");
  // TODO: missing local script /lib/spritejs.js
  // TODO: missing local script /lib/sprite-extend-3d.js
  // TODO: missing local script /js/sprite-geo-earth.js
  {
    const {Scene} = spritejs;
        const container = gContainer.value.querySelector('#container');
        const scene = new Scene({
          container,
        });
        const layer = scene.layer3d('fglayer', {
          // directionalLight: [0, 0, 1, 0.5],
          pointLightColor: 'white',
          pointLightPosition: [3, 3, 6],
          alpha: false,
          camera: {
            fov: 35,
          },
        });
        layer.camera.attributes.pos = [0, 0, 5000 / Math.min(layer.width, layer.height)];
        layer.camera.lookAt([0, 0, 0]);
        layer.gl.clearColor(0, 0, 0, 1);
    
        const {createGlobe,
          unproject,
          highlightMap,
          launchMissile,
          addMarker,
          cameraTo,
          addCurve,
          addBeam} = spritejs.globe;
        
        const texture = layer.createTexture('/graphics/assets/external/t0134ac9718ebd1a04b.jpg');
        const textureNormal = layer.createTexture('/graphics/assets/external/t01b29b04e3f0583969.jpg');
        const bumpMap = layer.createTexture('/graphics/assets/external/t0124d7369806be89c6.jpg');
    
        const globe = createGlobe(layer, {
          orbit: true,
          raycast: true,
          rotateY: 310,
          texture,
          normalMap: textureNormal,
          bumpMap,
          tick() {
            this.attributes.rotateY += 0.1;
          },
          normalScale: 2,
          highlight: false,
        });
    
        function randomColor() {
          const hue = Math.floor(Math.random() * 360);
          return `hsl(${hue}, 100%, 50%)`;
        }
    
        // setTimeout(() => {
        //   cameraTo(globe, {
        //     latitude: -70,
        //     longitude: 160,
        //     duration: 1500,
        //   });
        // }, 1500);
    
        // for(let i = 0; i < 100; i++) {
        //   // addMarker(globe, {
        //   //   latitude: 90 - Math.random() * 180,
        //   //   longitude: 180 - Math.random() * 360,
        //   //   // lifeTime: 1000,
        //   //   // height: 2.0,
        //   //   color: randomColor(),
        //   //   // speed: 0.5,
        //   //   // segments: 4,
        //   // });
        //   addBeam(globe, {
        //     latitude: 90 - Math.random() * 180,
        //     longitude: 180 - Math.random() * 360,
        //     // lifeTime: 1000,
        //     // height: 2.0,
        //     color: randomColor(),
        //     // speed: 0.5,
        //     // segments: 4,
        //   });
        // }
    
        setInterval(() => {
          const from = {
            latitude: 90 - 180 * Math.random(),
            longitude: 180 - 360 * Math.random(),
          };
          const to = {
            latitude: 90 - 180 * Math.random(),
            longitude: 180 - 360 * Math.random(),
          };
          const color = randomColor();
          const lifeTime = 1000;
          const height = 2.0;
          const width = 1.0;
    
          addMarker(globe, {
            ...from,
            lifeTime,
            height,
            color,
            width,
            // speed: 0.5,
            // segments: 4,
          });
    
          setTimeout(() => {
            addMarker(globe, {
              ...to,
              lifeTime,
              height,
              color,
              width,
              // speed: 0.5,
              segments: 4,
            });
          }, 0.5 * lifeTime);
    
          launchMissile(globe, {
            from,
            to,
            color,
            lifeTime,
            height,
            thickness: 0.75 * width,
          });
        }, 100);
    
        const curve = addCurve(globe, {
          from: {
            latitude: 0,
            longitude: 0,
          },
          to: {
            latitude: 30,
            longitude: 30,
          },
        });
  }
}

onMounted(() => {
  runInit(initGraphicsExample).catch(err => {
    console.error('Graphics example init failed:', err)
  })
})

// cleanup is handled by useGraphicsCleanup
// onUnmounted not needed
</script>

<style scoped>
html, .graphics-root {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      overflow: hidden;
    }
    #container {
      width: 100%;
      height: 100%;
    }
</style>