<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="1024" height="512"></canvas>
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
  await loadScript("/graphics/assets/external/topojson.min.js");
  {
    
          const width = 1024;
          const height = 512;
          function projection([longitude, latitude]) {
            const x = (width * (180 + longitude)) / 360;
            const y = height * (1.0 - (90 + latitude) / 180); // Canvas坐标系y轴朝下
            return [x, y];
          }
    
          function drawPoints(ctx, points) {
            ctx.beginPath();
            ctx.moveTo(...points[0]);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(...points[i]);
            }
            ctx.fill();
          }
    
          function mapDataToCountries(geoData, covidData) {
            const covidDataMap = {};
            covidData.dailyReports.forEach((d) => {
              const date = d.updatedDate;
              const countries = d.countries;
              countries.forEach((country) => {
                const name = country.country;
                covidDataMap[name] = covidDataMap[name] || {};
                covidDataMap[name][date] = country;
              });
            });
            geoData.features.forEach((d) => {
              const name = d.properties.name;
              d.properties.covid = covidDataMap[name];
            });
          }
    
          function mapColor(confirmed) {
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
    
          function drawMap(ctx, countries, date) {
            ctx.fillStyle = "#3ac";
            countries.features.forEach(({ geometry, properties }) => {
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
                  coordinates.forEach((contours) => {
                    contours.forEach((path) => {
                      const points = path.map(projection);
                      drawPoints(ctx, points);
                    });
                  });
                }
              } else if (geometry.type === "Polygon") {
                const contours = geometry.coordinates;
                contours.forEach((path) => {
                  const points = path.map(projection);
                  drawPoints(ctx, points);
                });
              }
            });
          }
    
          const canvas = gContainer.value.querySelector('canvas');
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