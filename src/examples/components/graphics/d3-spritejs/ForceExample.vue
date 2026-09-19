<template>
  <div class="graphics-root" ref="gContainer">
    <div id="stage"></div>
      
    <!--  -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const gContainer = ref<HTMLElement | null>(null)
const gfxLoadedScripts: any[] = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)

async function loadScript(src: string) {
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
  const stage = gContainer.value!.querySelector('#stage')
  await loadScript("/graphics/assets/external/spritejs.min.js");
  await loadScript("/graphics/assets/external/d3.js");
  await loadScript("/graphics/assets/external/d3.v6.js");
  const d3: any = (globalThis as any).d3 // d3 由上方 loadScript 注入为全局；用局部 any 别名屏蔽 UMD 全局类型，保持脚本加载通道不变
  {
    const {Scene} = spritejs;
        const container = gContainer.value!.querySelector('#stage');
        const scene = new Scene({
          container,
          width: 1200,
          height: 900,
          mode: 'stickyWidth',
        });
    
        const layer = scene.layer('fglayer', {
          handleEvent: false,
          autoRender: false,
        });
    
        const simulation = d3.forceSimulation()
          .force('link', d3.forceLink().id((d: any) => d.id))
          .force('charge', d3.forceManyBody())
          .force('center', d3.forceCenter(400, 300));
    
        d3.json('/graphics/assets/external/f74a79ccf53d8147.json').then((graph: any) => {
          function ticked() {
            d3.select(layer).selectAll('path')
              .attr('d', (d: any) => {
                const [sx, sy] = [d.source.x, d.source.y];
                const [tx, ty] = [d.target.x, d.target.y];
                return `M${sx} ${sy} L ${tx} ${ty}`;
              })
              .attr('strokeColor', 'white')
              .attr('lineWidth', 1);
            d3.select(layer).selectAll('sprite')
              .attr('pos', (d: any) => {
                return [d.x, d.y];
              });
            layer.render();
          }
    
          simulation
            .nodes(graph.nodes)
            .on('tick', ticked);
    
          simulation.force('link')
            .links(graph.links);
    
          // draw spots
          // ! due to d3 rules, you have to set attributes seperatly
          d3.select(layer).selectAll('sprite')
            .data(graph.nodes)
            .enter()
            .append('sprite')
            .attr('pos', (d: any) => {
              return [d.x, d.y];
            })
            .attr('size', [10, 10])
            .attr('border', [1, 'white'])
            .attr('borderRadius', 5)
            .attr('anchor', 0.5);
    
          // draw lines
          d3.select(layer).selectAll('path')
            .data(graph.links)
            .enter()
            .append('path')
            .attr('d', (d: any) => {
              const [sx, sy] = [d.source.x, d.source.y];
              const [tx, ty] = [d.target.x, d.target.y];
              return `M${sx} ${sy} L ${tx} ${ty}`;
            })
            .attr('name', (d: any, index: any) => {
              return `path${index}`;
            })
            .attr('strokeColor', 'white');
    
          d3.select(layer.canvas)
            .call(d3.drag()
              .container(layer.canvas)
              .subject(dragsubject)
              .on('start', dragstarted)
              .on('drag', dragged)
              .on('end', dragended));
    
          function dragsubject() {
            const [x, y] = layer.toLocalPos((event as any).x, (event as any).y);
            return simulation.find(x, y);
          }
        });
    
        function dragstarted(event: any) {
          if(!event.active) simulation.alphaTarget(0.3).restart();
    
          const [x, y] = [event.subject.x, event.subject.y];
          event.subject.fx0 = x;
          event.subject.fy0 = y;
          event.subject.fx = x;
          event.subject.fy = y;
    
          const [x0, y0] = layer.toLocalPos(event.x, event.y);
          event.subject.x0 = x0;
          event.subject.y0 = y0;
        }
    
        function dragged(event: any) {
          const [x, y] = layer.toLocalPos(event.x, event.y),
            {x0, y0, fx0, fy0} = event.subject;
          const [dx, dy] = [x - x0, y - y0];
    
          event.subject.fx = fx0 + dx;
          event.subject.fy = fy0 + dy;
        }
    
        function dragended(event: any) {
          if(!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }
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
      overflow: hidden;
      padding: 0;
      margin: 0;
    }
    #stage {
      display: inline-block;
      width: 100%;
      height: 0;
      padding-bottom: 75%;
    }
    #stage canvas {
      background-color: #313131;
    }
</style>