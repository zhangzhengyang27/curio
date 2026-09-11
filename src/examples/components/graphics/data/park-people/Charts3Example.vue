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
  await loadScript("/graphics/data/park-people/spritejs.js");
  await loadScript("/graphics/assets/external/index.js");
  {
    const  {Scene, Sprite, Polyline, SpriteSvg} = spritejs;
        (async function() {
          const data = await (await fetch('data.json')).json();
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
    
          const dataset = [];
          Object.entries(groupData(data)).forEach(([place, d]) => {
            d[0].place = `${place}: 男`;
            d[1].place = `${place}: 女`;
            dataset.push(...d);
          });
    
          const { Chart, Pie, Legend, Tooltip, theme} = qcharts;
            const chart = new Chart({
              container: `#container`
            });
    
          chart.source(dataset, {
            row: 'place',
            value: 'people'
          });
          const ds = chart.dataset;
    
          const pie = new Pie({
            radius: 0.4,
            pos: [0, 0]
          }).source(ds.selectRows(dataset.filter(d => d.gender === '女游客').map(d => d.place)));
    
          const pie2 = new Pie({
            innerRadius: 0.5,
            radius: 0.7
          }).source(ds.selectRows(dataset.filter(d => d.gender === '男游客').map(d => d.place)));
    
          const legend = new Legend({ orient: 'vertical', align: ['right', 'center'] });
    
          chart.append([pie2, pie, legend]);
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
    }
</style>