<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="1024" height="512"></canvas>
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
  await loadScript("/graphics/assets/external/topojson.min.js");
  {
    
          const width = 1024;
          const height = 512;
          function projection([longitude, latitude]: any) {
            const x = (width * (180 + longitude)) / 360;
            const y = height * (1.0 - (90 + latitude) / 180); // Canvas坐标系y轴朝下
            return [x, y];
          }
    
          function drawPoints(ctx: any, points: any) {
            ctx.beginPath();
            ctx.moveTo(...points[0]);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(...points[i]);
            }
            ctx.fill();
          }
    
          function mapDataToCountries(geoData: any, covidData: any) {
            const covidDataMap: any = {};
            covidData.dailyReports.forEach((d: any) => {
              const date = d.updatedDate;
              const countries = d.countries;
              countries.forEach((country: any) => {
                const name = country.country;
                covidDataMap[name] = covidDataMap[name] || {};
                covidDataMap[name][date] = country;
              });
            });
            geoData.features.forEach((d: any) => {
              const name = d.properties.name;
              d.properties.covid = covidDataMap[name];
            });
          }
    
          function mapColor(confirmed: any) {
            if (confirmed < 10) {
              return "rgb(250, 247, 171)";
            }
            if (confirmed < 100) {
              return "rgb(255, 186, 66)";
            }
            if (confirmed < 500) {
              return "rgb(234, 110, 41)";
            }
            if (confirmed < 1000) {
              return "rgb(224, 81, 57)";
            }
            if (confirmed < 10000) {
              return "rgb(192, 50, 39)";
            }
            return "rgb(151, 32, 19)";
          }
    
          function drawMap(ctx: any, countries: any, date: any) {
            ctx.fillStyle = "#3ac";
            countries.features.forEach(({ geometry, properties }: any) => {
              const covid = properties.covid ? properties.covid[date] : null;
              if (covid) {
                const confirmed = covid.confirmed;
                if (confirmed) {
                  ctx.fillStyle = mapColor(confirmed);
                }
              }
              if (geometry.type === "MultiPolygon") {
                const coordinates = geometry.coordinates;
                if (coordinates) {
                  coordinates.forEach((contours: any) => {
                    contours.forEach((path: any) => {
                      const points = path.map(projection);
                      drawPoints(ctx, points);
                    });
                  });
                }
              } else if (geometry.type === "Polygon") {
                const contours = geometry.coordinates;
                contours.forEach((path: any) => {
                  const points = path.map(projection);
                  drawPoints(ctx, points);
                });
              }
            });
          }
    
          const canvas = gContainer.value!.querySelector('canvas') as HTMLCanvasElement;
          const ctx = canvas.getContext("2d");
    
          (async function () {
            const worldData = await (
              await fetch("/graphics/covid-vis/assets/data/world-topojson.json")
            ).json();
            const countries = topojson.feature(
              worldData,
              worldData.objects.countries
            );
    
            const covidData = await (
              await fetch("/graphics/covid-vis/assets/data/covid-data.json")
            ).json();
            mapDataToCountries(countries, covidData);
            drawMap(ctx, countries, "2020-01-22");
          })();
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