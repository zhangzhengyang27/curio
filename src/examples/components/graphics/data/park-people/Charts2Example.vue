<template>
  <div class="graphics-root" ref="gContainer">
    <div id="container">
      <div id="square"></div>
      <div id="sections"></div>
      <div id="garden"></div>
      <div id="playground"></div>
    </div>
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
  const square = gContainer.value.querySelector('#square')
  const sections = gContainer.value.querySelector('#sections')
  const garden = gContainer.value.querySelector('#garden')
  const playground = gContainer.value.querySelector('#playground')
  await loadScript("/graphics/data/park-people/spritejs.js");
  await loadScript("/graphics/assets/external/index.js");
  {
    const  {Scene, Sprite, Polyline, SpriteSvg} = spritejs;
        (async function() {
          const data = await (await fetch('data.json')).json();
          console.log(data);
          // group data
    
          function count(d, dataset) {
            let place;
            if(d.x < 300 && d.y < 300) {
              place = 'square';
            } else if (d.x >= 300 && d.y < 300) {
              place = 'sections';
            } else if (d.x >= 300 && d.y >= 300) {
              place = 'garden';
            } else {
              place = 'playground';
            }
            dataset[place] = dataset[place] || [
              {
                gender: '男游客',
                people: 0,
              },
              {
                gender: '女游客',
                people: 0,
              }
            ];
            if(d.gender === 'f') {
              dataset[place][0].people++;
            } else {
              dataset[place][1].people++;
            }
    
            return dataset;
          }
    
          function groupData(data) {
            const dataset = {};
    
            for(let i = 0; i < data.length; i++) {
              const d = data[i];
              
              if(d.time === 12) {
                const p = count(d, dataset);
              }
            }
    
            return dataset;
          }
    
          const dataset = groupData(data);
          console.log(dataset);
    
          const { Chart, Pie, Legend, Tooltip, theme} = qcharts;
    
          theme.set({
            colors: ['#71dac7', '#d57a77'],
          });
    
          Object.entries(dataset).forEach(([key, dataset]) => {
            const chart = new Chart({
              container: `#${key}`
            });
    
            chart.source(dataset, {
              row: 'gender',
              value: 'people',
              text: 'gender'
            });
    
            const pie = new Pie({
              radius: 0.7,
              animation: {
                duration: 700,
                easing: 'bounceOut'
              }
            });
    
            const legend = new Legend({ orient: 'vertical', align: ['right', 'center'] });
            const toolTip = new Tooltip();
    
            chart.append([pie, legend, toolTip]);
          });
        }());
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
    }
    #container {
      width: 600px;
      height: 600px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    #container > div {
      width: 300px;
      height: 300px;
      flex-shrink: 0;
    }
</style>