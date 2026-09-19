import { computed, ref, shallowRef } from 'vue'
import { getAllExamples, loadAllRegistries } from '../registry/index.ts'
import type { RegistryExample } from '../registry/index.ts'

// 全局响应式加载状态
const registryReady = ref(false)
const allExamplesList = shallowRef<RegistryExample[]>([])

let _initPromise: Promise<RegistryExample[]> | null = null
export function ensureRegistryLoaded() {
  if (!_initPromise) {
    _initPromise = loadAllRegistries().then((list: RegistryExample[]) => {
      allExamplesList.value = list
      registryReady.value = true
      return list
    })
  }
  return _initPromise
}

export const techGroups = [
  { key: 'all', label: '全部技术', match: () => true },
  { key: 'threejs', label: 'Three.js', match: (ex: RegistryExample) => ['threejs-official', 'threejs-lesson', 'earth-lessons', 'three-project', 'granary-3d'].includes(ex.source) || ex.category === 'threejsOfficialExamples' },
  { key: 'cesium', label: 'Cesium', match: (ex: RegistryExample) => ['three-cesium-examples', 'cesium-examples'].includes(ex.source) || ex.category === 'threeCesiumExamples' || (ex.category && ex.category.startsWith('cesiumExamples/')) },
  { key: 'webgl', label: 'WebGL', match: (ex: RegistryExample) => ex.source === 'webgl' || ex.source === 'city-realtime-webgl' || ex.category === 'webglExamples' },
  { key: 'graphics', label: 'Graphics / MyGrapics', match: (ex: RegistryExample) => ex.source === 'graphics' || ex.source === 'mygrapics' }
]

export const subCategoryDefinitions = [
  { key: 'all', label: '全部', match: () => true },
  { key: 'basics', label: '基础入门', match: (ex: RegistryExample) => ex.category && /(basic|base|scene|start|入门|machineroom|cleanup|scenegraph|helpers|mesh|simple|watch)/i.test(ex.category) },
  { key: 'geometry', label: '几何体 / 线条', match: (ex: RegistryExample) => ex.category && /(geometry|geometries|polygon|polyline|curve|triangluations|lines|3d-model)/i.test(ex.category) },
  { key: 'materials', label: '材质 / 纹理', match: (ex: RegistryExample) => ex.category && /(material|materials|texture|textures|normal-maps|pmrem|cubemap|decals|clearcoat|mirror|reflection|refraction|panorama|portal|video|backdrop|caustics|ocean|water|sky|fog|procedural|hdr|display|renderer)/i.test(ex.category) },
  { key: 'lights', label: '灯光 / 阴影', match: (ex: RegistryExample) => ex.category && /(light|lights|lightprobe|shadow|shadowmap|lensflares)/i.test(ex.category) },
  { key: 'shader', label: '着色器 / GLSL', match: (ex: RegistryExample) => ex.category && /(kaikeba-webgl|study-webgl|shader|shaders|tsl|glsl|shaping|noise|pixels|polar-shader|gpgpu|custom|ubo|compute|sandbox|centroid|compile)/i.test(ex.category) },
  { key: 'animation', label: '动画 / 粒子', match: (ex: RegistryExample) => ex.category && /(animat|particle|particles|morphtargets|skinning|instanc|points|batch|sprites)/i.test(ex.category) },
  { key: 'post-effects', label: '后期处理 / 特效', match: (ex: RegistryExample) => ex.category && /(postprocessing|effect|effects|effectComposer|pass|furnace|tonemapping|worker|lod|upscaling)/i.test(ex.category) },
  { key: 'render-target', label: '渲染目标', match: (ex: RegistryExample) => ex.category && /(framebuffer|rendertarget|rtt|multisampled|depth|read|reversed|volume|mrt|occlusion|storage|struct|layers)/i.test(ex.category) },
  { key: 'interaction', label: '交互 / 相机', match: (ex: RegistryExample) => ex.category && /(control|controls|interactive|camera|raycaster|boxselection|uv|multiple)/i.test(ex.category) },
  { key: 'loader', label: '加载器 / 资源', match: (ex: RegistryExample) => ex.category && /(loader|exporter|performance)/i.test(ex.category) },
  { key: 'physics', label: '物理引擎', match: (ex: RegistryExample) => ex.category && /(physics|ammo|rapier|jolt)/i.test(ex.category) },
  { key: 'data-viz', label: '数据可视化', match: (ex: RegistryExample) => ex.category && (/(data|qcharts|d3|covid|github|graph|weather|park-people|vis-geo-earth|earth-lessons)/i.test(ex.category) || ['data-graph-css', 'data-graph-svg'].includes(ex.category)) },
  { key: 'xr-vr', label: 'XR / VR / AR', match: (ex: RegistryExample) => ex.category && /(xr|vr|ar|webxr)/i.test(ex.category) },
  { key: 'audio', label: '音频', match: (ex: RegistryExample) => ex.category && /(webaudio|audio)/i.test(ex.category) },
  { key: 'math', label: '数学 / 变换', match: (ex: RegistryExample) => ex.category && /(quaternion|matrix|vector|math|easing|spline|bezier|random)/i.test(ex.category) },
  { key: 'expand', label: '扩展 / 综合', match: (ex: RegistryExample) => ex.category && /(expand|other|svg|css2d|css3d|misc|test|canvas|color-hints|coordinates|raffle|sketch)/i.test(ex.category) }
]

export function getSubCategoriesByTech(techKey: string) {
  const tech = techGroups.find(t => t.key === techKey)
  if (!tech) return []

  const allExamples = getAllExamples()
  const techExamples = allExamples.filter(ex => tech.match(ex))

  const counts = new Map()
  counts.set('all', techExamples.length)

  techExamples.forEach(ex => {
    subCategoryDefinitions.forEach(sub => {
      if (sub.key !== 'all' && sub.match(ex)) {
        counts.set(sub.key, (counts.get(sub.key) || 0) + 1)
      }
    })
  })

  return subCategoryDefinitions
    .filter(sub => sub.key === 'all' || (counts.get(sub.key) || 0) > 0)
    .map(sub => ({ ...sub, count: counts.get(sub.key) || 0 }))
}

export function useExampleFilters() {
  // 刻意 **不在** setup 阶段触发 ensureRegistryLoaded()。
  //
  // 本 composable 被 App.vue 的全局顶栏使用，而顶栏在所有路由（含首页）都会挂载；
  // 在 setup 里触发一次，就等于把 11 个 registry（约 43 KB，见 docs/PERF_BASELINE.md）
  // 钉进首屏依赖图 —— 而首页根本不需要它，顶栏的示例分类菜单要等用户打开才渲染。
  //
  // 约定：需要数据时由调用方在合适时机主动调用返回的 ensureRegistryLoaded
  // （悬停/打开下拉、聚焦搜索框、进入 /examples）。/examples 下的页面本身
  // 也会在 setup 阶段调用 ensureRegistryLoaded，不依赖这里。
  const allExamples = computed(() => allExamplesList.value)

  const techList = computed(() => {
    return techGroups.map(tech => {
      const count = tech.key === 'all'
        ? allExamples.value.length
        : allExamples.value.filter(ex => tech.match(ex)).length
      return { ...tech, count }
    })
  })

  return {
    techGroups,
    subCategoryDefinitions,
    techList,
    registryReady,
    getSubCategoriesByTech,
    ensureRegistryLoaded
  }
}
