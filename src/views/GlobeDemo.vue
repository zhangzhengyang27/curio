<template>
  <div class="demo-root">
    <div class="top-bar">
      <router-link
        to="/three-globe"
        class="back-btn"
      >
        ← 返回示例列表
      </router-link>
      <span class="demo-title">{{ demoTitle }}</span>
      <span
        v-if="loading"
        class="status"
      >加载中...</span>
    </div>
    <div
      ref="container"
      class="globe-container"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import * as THREE from 'three'
import ThreeGlobe from 'three-globe'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

const route = useRoute()
const container = ref(null)
const loading = ref(true)
const demoTitle = computed(() => exampleMeta[route.params.example]?.title || route.params.example)

let renderer, scene, camera, controls, globe, animFrame
let rafIds = []
let cleanupFns = []

const IMG_BASE = 'https://cdn.jsdelivr.net/npm/three-globe/example/img'
const img = name => `${IMG_BASE}/${name}`

const exampleMeta = {
  basic: { title: '基础地球' },
  arcs: { title: '弧线链接' },
  polygons: { title: '国家多边形' },
  paths: { title: '路径线' },
  heatmap: { title: '热力图' },
  hexbin: { title: '六边形分箱' },
  'hexed-polygons': { title: '六边形化多边形' },
  tiles: { title: '瓦片' },
  ripples: { title: '涟漪环' },
  clouds: { title: '云层' },
  'day-night': { title: '昼夜循环' },
  'solar-terminator': { title: '晨昏线' },
  labels: { title: '标签' },
  'html-markers': { title: 'HTML 标记' },
  satellites: { title: '卫星轨道' },
  'tile-engine': { title: '瓦片地图' },
  'custom-material': { title: '自定义材质' },
  'custom-layer': { title: '自定义图层' },
}

function randGeoData(n = 300) {
  return [...Array(n).keys()].map(() => ({
    lat: (Math.random() - 0.5) * 180 * 0.9,
    lng: (Math.random() - 0.5) * 360,
  }))
}

function setupBase() {
  const el = container.value
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(el.clientWidth, el.clientHeight)
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  el.appendChild(renderer.domElement)

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera()
  camera.aspect = el.clientWidth / el.clientHeight
  camera.updateProjectionMatrix()
  camera.position.z = 500

  controls = new TrackballControls(camera, renderer.domElement)
  controls.minDistance = 101
  controls.rotateSpeed = 5
  controls.zoomSpeed = 0.8

  scene.add(new THREE.AmbientLight(0xcccccc, Math.PI))
  scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI))

  const onResize = () => {
    renderer.setSize(el.clientWidth, el.clientHeight)
    camera.aspect = el.clientWidth / el.clientHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)
  cleanupFns.push(() => window.removeEventListener('resize', onResize))
}

function startRender(postRender) {
  function animate() {
    animFrame = requestAnimationFrame(animate)
    controls.update()
    if (postRender) postRender()
    renderer.render(scene, camera)
  }
  animate()
}

function disposeGlobe() {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null }
  rafIds.forEach(id => cancelAnimationFrame(id))
  rafIds = []
  cleanupFns.forEach(fn => fn())
  cleanupFns = []
  if (renderer) { renderer.dispose(); renderer.domElement.remove() }
  if (globe && scene) { scene.remove(globe); globe = null }
  renderer = null; scene = null; camera = null; controls = null
}

async function loadExample(exId) {
  disposeGlobe()
  if (!container.value) return
  loading.value = true
  setupBase()

  switch (exId) {
    case 'basic':
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-blue-marble.jpg'))
        .bumpImageUrl(img('earth-topology.png'))
        .pointsData(randGeoData(500))
        .pointColor(() => '#ff8800')
        .pointAltitude(0.01)
      scene.add(globe)
      break

    case 'arcs':
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-dark.jpg'))
        .bumpImageUrl(img('earth-topology.png'))
        .arcsData([...Array(25).keys()].map(() => ({
          startLat: (Math.random() - 0.5) * 180,
          startLng: (Math.random() - 0.5) * 360,
          endLat: (Math.random() - 0.5) * 180,
          endLng: (Math.random() - 0.5) * 360,
          color: [['#ffffff00', 'red'], ['#ffffff00', 'yellow'], ['#ffffff00', 'green']][Math.round(Math.random() * 2)]
        })))
        .arcColor('color').arcAltitude(0.4).arcStroke(1)
      scene.add(globe)
      break

    case 'polygons': {
      const res = await fetch('/three-globe-data/ne_110m_admin_0_countries.geojson')
      const world = await res.json()
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-blue-marble.jpg'))
        .polygonsData(world.features.filter(d => d.properties.ISO_A2 !== 'AQ'))
        .polygonGeoJsonGeometry('geometry')
        .polygonCapColor(d => ['#330000', '#003300', '#000033'][(d.properties.ISO_A2 || '').length % 3])
        .polygonSideColor(() => 'rgba(0, 100, 0, 0.15)')
        .polygonAltitude(0.01)
      scene.add(globe)
      break
    }

    case 'paths': {
      const paths = [[], []]
      for (let i = 0; i < 60; i++) {
        const t = i / 59
        paths[0].push([t * 360 - 180, 30 * Math.sin(t * Math.PI * 3)])
        paths[1].push([-30 * Math.cos(t * Math.PI * 3), t * 360 - 180])
      }
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-dark.jpg'))
        .pathsData(paths)
        .pathColor(() => ['#ffffaa', '#00ffff'][Math.round(Math.random())])
        .pathPointLat(p => p[1]).pathPointLng(p => p[0])
        .pathDashLength(0.1).pathStroke(1)
      scene.add(globe)
      break
    }

    case 'heatmap': {
      const d = randGeoData(2000)
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-night.jpg'))
        .heatmapsData([d])
        .heatmapPointLat('lat').heatmapPointLng('lng')
        .heatmapBandwidth(2.5)
        .heatmapColorFn(() => (t) => `rgba(100,255,0,${0.3 + 0.5 * (1 - t)})`)
        .heatmapBaseAltitude(0.01).heatmapTopAltitude(0.06)
      scene.add(globe)
      break
    }

    case 'hexbin': {
      const d = randGeoData(6000)
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-night.jpg'))
        .bumpImageUrl(img('earth-topology.png'))
        .hexBinPointsData(d)
        .hexBinPointWeight(3).hexBinResolution(2).hexMargin(0.2)
        .hexTopColor(() => 'red')
        .hexSideColor(() => 'rgba(0,255,0,0.8)')
        .hexBinMerge(true)
      scene.add(globe)
      break
    }

    case 'hexed-polygons': {
      const res = await fetch('/three-globe-data/ne_110m_admin_0_countries.geojson')
      const world = await res.json()
      globe = new ThreeGlobe()
        .hexPolygonsData(world.features.filter(d => d.properties.ISO_A2 !== 'AQ'))
        .hexPolygonGeoJsonGeometry('geometry')
        .hexPolygonColor(() => `#${Math.round(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}`)
        .hexPolygonAltitude(0.01).hexPolygonResolution(3)
      scene.add(globe)
      break
    }

    case 'tiles': {
      const tiles = [...Array(20).keys()].map(() => ({
        lat: (Math.random() - 0.5) * 180,
        lng: (Math.random() - 0.5) * 360,
        size: Math.random() * 0.5,
        color: ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
      }))
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-blue-marble.jpg'))
        .tilesData(tiles)
        .tileAltitude(d => d.size * 0.1)
        .tileWidth(d => d.size * 20).tileHeight(d => d.size * 20)
        .tileMaterial(d => new THREE.MeshLambertMaterial({ color: d.color }))
      scene.add(globe)
      break
    }

    case 'ripples': {
      const rings = [...Array(5).keys()].map(() => ({
        lat: (Math.random() - 0.5) * 180,
        lng: (Math.random() - 0.5) * 360,
        maxR: Math.random() * 25 + 3,
        propagationSpeed: (Math.random() - 0.5) * 3 + 1,
        repeatPeriod: Math.random() * 3000 + 200
      }))
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-dark.jpg'))
        .ringsData(rings)
        .ringColor(() => ['#ffff00', '#ff0000'][Math.round(Math.random())])
        .ringMaxRadius('maxR').ringPropagationSpeed('propagationSpeed').ringRepeatPeriod('repeatPeriod')
      scene.add(globe)
      break
    }

    case 'clouds': {
      const CLOUDS_ALT = 0.004
      const cloudsTexture = new THREE.TextureLoader().load('/three-globe-data/clouds.png')
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-blue-marble.jpg'))
        .bumpImageUrl(img('earth-topology.png'))
      scene.add(globe)
      const cloudGeom = new THREE.SphereGeometry(1 + CLOUDS_ALT, 75, 75)
      const cloudMat = new THREE.MeshPhongMaterial({
        map: cloudsTexture, transparent: true, opacity: 0.4,
        blending: THREE.AdditiveBlending, side: THREE.FrontSide
      })
      const cloudMesh = new THREE.Mesh(cloudGeom, cloudMat)
      globe.add(cloudMesh)
      rafIds.push(requestAnimationFrame(function rotate() {
        cloudMesh.rotation.y -= 0.006
        if (!globe) return; rafIds.push(requestAnimationFrame(rotate))
      }))
      break
    }

    case 'day-night': {
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-blue-marble.jpg'))
        .bumpImageUrl(img('earth-topology.png'))
      scene.add(globe)
      scene.children.forEach(c => { if (c instanceof THREE.DirectionalLight) scene.remove(c) })
      const light = new THREE.DirectionalLight(0xffffff, Math.PI * 0.7)
      scene.add(light)
      let angle = 0
      rafIds.push(requestAnimationFrame(function rotate() {
        angle += 0.002
        light.position.set(600 * Math.cos(angle), 0, 600 * Math.sin(angle))
        if (!globe) return; rafIds.push(requestAnimationFrame(rotate))
      }))
      break
    }

    case 'solar-terminator': {
      const VELOCITY = 9
      let dt = +new Date()
      const sunPosAt = d => {
        const day = new Date(+d).setUTCHours(0, 0, 0, 0)
        return [(day - d) / 864e5 * 360 - 180, 0]
      }
      const tile = { pos: sunPosAt(dt) }
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-dark.jpg'))
        .tilesData([tile])
        .tileLng(d => d.pos[0]).tileLat(d => d.pos[1])
        .tileAltitude(0.005).tileWidth(180).tileHeight(180)
        .tileUseGlobeProjection(false)
        .tileMaterial(() => new THREE.MeshLambertMaterial({
          color: '#ffff00', opacity: 0.3, transparent: true
        }))
        .tilesTransitionDuration(0)
      scene.add(globe)
      rafIds.push(requestAnimationFrame(function anim() {
        if (!globe) return; rafIds.push(requestAnimationFrame(anim))
        dt += VELOCITY * 60 * 1000
        tile.pos = sunPosAt(dt)
        globe.tilesData([tile])
      }))
      break
    }

    case 'labels': {
      const labels = [
        { lat: 40.7, lng: -74, text: 'New York', color: 'white' },
        { lat: 51.5, lng: -0.1, text: 'London', color: 'white' },
        { lat: 35.7, lng: 139.7, text: 'Tokyo', color: 'white' },
        { lat: -33.9, lng: 151.2, text: 'Sydney', color: 'white' },
        { lat: -1.3, lng: 36.8, text: 'Nairobi', color: 'white' },
        { lat: 55.8, lng: 37.6, text: 'Moscow', color: 'white' },
        { lat: -22.9, lng: -43.2, text: 'Rio', color: 'white' },
        { lat: 39.9, lng: 116.4, text: 'Beijing', color: 'white' },
        { lat: 19.0, lng: 72.8, text: 'Mumbai', color: 'white' },
        { lat: 48.9, lng: 2.3, text: 'Paris', color: 'white' },
      ]
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-dark.jpg'))
        .labelsData(labels)
        .labelLat('lat').labelLng('lng').labelText('text').labelColor('color')
        .labelAltitude(0.01).labelSize(1.5).labelDotRadius(0.4).labelResolution(2)
      scene.add(globe)
      break
    }

    case 'html-markers': {
      const { CSS2DRenderer, CSS2DObject } = await import('three/examples/jsm/renderers/CSS2DRenderer.js')
      const markers = [
        { lat: 40.7, lng: -74, text: 'New York', color: '#ffdd00' },
        { lat: 51.5, lng: -0.1, text: 'London', color: '#ff8800' },
        { lat: 35.7, lng: 139.7, text: 'Tokyo', color: '#00ff88' },
        { lat: 39.9, lng: 116.4, text: 'Beijing', color: '#ff4444' },
      ]
      const els = markers.map(m => {
        const el = document.createElement('div')
        el.innerHTML = `<div style="color:${m.color};font-size:14px;font-weight:bold;text-shadow:0 0 8px ${m.color};white-space:nowrap">📍 ${m.text}</div>`
        return { ...m, obj: new CSS2DObject(el) }
      })
      const data = els.map(m => ({ lat: m.lat, lng: m.lng, obj: m.obj }))
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-dark.jpg'))
        .customLayerData(data)
        .customThreeObject(d => d.obj)
        .customThreeObjectUpdate((obj, d) => Object.assign(obj.position, globe.getCoords(d.lat, d.lng, 0.02)))
      scene.add(globe)
      const lr = new CSS2DRenderer()
      lr.setSize(container.value.clientWidth, container.value.clientHeight)
      lr.domElement.style.cssText = 'position:absolute;top:0;pointer-events:none'
      container.value.appendChild(lr.domElement)
      cleanupFns.push(() => lr.domElement.remove())
      animFrame = requestAnimationFrame(function render() {
        controls.update()
        renderer.render(scene, camera)
        lr.render(scene, camera)
        animFrame = requestAnimationFrame(render)
      })
      loading.value = false
      return
    }

    case 'satellites': {
      const sat = await import('satellite.js')
      const tleText = await fetch('/three-globe-data/space-track-leo.txt').then(r => r.text())
      const lines = tleText.split('\n').filter(l => l.trim())
      const sats = []
      for (let i = 0; i + 2 < lines.length; i += 3) {
        try { sats.push({ name: lines[i].trim(), satrec: sat.twoline2satrec(lines[i + 1].trim(), lines[i + 2].trim()) }) } catch {}
      }
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-dark.jpg'))
        .pointsData(sats.map(() => ({ lat: 0, lng: 0, alt: 0 })))
        .pointColor(() => '#ff4444').pointAltitude('alt').pointRadius(0.3)
      scene.add(globe)
      rafIds.push(requestAnimationFrame(function update() {
        if (!globe) return; rafIds.push(requestAnimationFrame(update))
        const now = new Date()
        const gmst = sat.gstime(now)
        const posData = sats.map(s => {
          const pv = sat.propagate(s.satrec, now)
          if (!pv) return { lat: 0, lng: 0, alt: 0 }
          const geo = sat.eciToGeodetic(pv.position, gmst)
          return { lat: sat.degreesLat(geo.latitude), lng: sat.degreesLong(geo.longitude), alt: geo.height / 6371 / 100 }
        })
        globe.pointsData(posData).pointsTransitionDuration(0)
      }))
      break
    }

    case 'tile-engine':
      globe = new ThreeGlobe()
        .globeTileEngineUrl((x, y, z) => `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`)
      scene.add(globe)
      break

    case 'custom-material':
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-blue-marble.jpg'))
        .bumpImageUrl(img('earth-topology.png'))
        .globeMaterial(new THREE.MeshPhongMaterial({
          color: 0x112244, emissive: 0x001122, shininess: 10
        }))
      scene.add(globe)
      break

    case 'custom-layer': {
      const gData = [...Array(300).keys()].map(() => ({
        lat: (Math.random() - 0.5) * 180,
        lng: (Math.random() - 0.5) * 360,
        alt: Math.random(),
        radius: Math.random() * 5,
        color: ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
      }))
      globe = new ThreeGlobe()
        .globeImageUrl(img('earth-blue-marble.jpg'))
        .bumpImageUrl(img('earth-topology.png'))
        .customLayerData(gData)
        .customThreeObject(d => new THREE.Mesh(
          new THREE.SphereGeometry(d.radius),
          new THREE.MeshLambertMaterial({ color: d.color })
        ))
        .customThreeObjectUpdate((obj, d) => Object.assign(obj.position, globe.getCoords(d.lat, d.lng, d.alt)))
      scene.add(globe)
      rafIds.push(requestAnimationFrame(function move() {
        if (!globe) return; rafIds.push(requestAnimationFrame(move))
        gData.forEach(d => d.lat += 0.2)
        globe.customLayerData(gData)
      }))
      break
    }
  }

  startRender()
  loading.value = false
}

onMounted(() => loadExample(route.params.example))
onUnmounted(() => disposeGlobe())
</script>

<style scoped>
.demo-root { position: fixed; top: var(--tv-top-nav-height); left: 0; right: 0; bottom: 0; background: var(--tv-background); }
.top-bar { position: absolute; top: 0; left: 0; right: 0; z-index: 10; display: flex; align-items: center; height: 44px; padding: 0 var(--tv-md); background: color-mix(in srgb, var(--tv-surface-container-lowest) 80%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--tv-outline-variant); }
.back-btn { display: inline-flex; align-items: center; gap: var(--tv-xs); color: var(--tv-primary); text-decoration: none; font-size: 13px; font-weight: 500; margin-right: var(--tv-md); flex-shrink: 0; transition: color 0.2s; }
.back-btn:hover { color: var(--tv-primary-container); }
.demo-title { color: var(--tv-on-surface); font-size: 14px; font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status { color: var(--tv-secondary); font-size: 12px; font-weight: 500; }
.globe-container { width: 100%; height: 100%; position: relative; }

html.dark .top-bar { background: color-mix(in srgb, var(--tv-surface-container-lowest) 60%, transparent); }
</style>
