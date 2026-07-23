import { computed } from 'vue'
import { getAllExamples } from '../registry/index.js'

export const techGroups = [
  { key: 'all', label: '全部技术', match: () => true },
  { key: 'threejs', label: 'Three.js', match: ex => ['threejs-official', 'threejs-lesson', 'earth-lessons', 'three-project', 'granary-3d'].includes(ex.source) || ex.category === 'threejsOfficialExamples' },
  { key: 'cesium', label: 'Cesium', match: ex => ['three-cesium-examples', 'cesium-examples'].includes(ex.source) || ex.category === 'threeCesiumExamples' || (ex.category && ex.category.startsWith('cesiumExamples/')) },
  { key: 'webgl', label: 'WebGL', match: ex => ex.source === 'webgl' || ex.source === 'city-realtime-webgl' || ex.category === 'webglExamples' },
  { key: 'graphics', label: 'Graphics / MyGrapics', match: ex => ex.source === 'graphics' || ex.source === 'mygrapics' }
]

export const subCategoryDefinitions = [
  { key: 'all', label: '全部', match: () => true },
  { key: 'basics', label: '基础入门', match: ex => ex.category && /(basic|base|scene|start|入门|machineroom|cleanup|scenegraph|helpers|mesh|simple|watch)/i.test(ex.category) },
  { key: 'geometry', label: '几何体 / 线条', match: ex => ex.category && /(geometry|geometries|polygon|polyline|curve|triangluations|lines|3d-model)/i.test(ex.category) },
  { key: 'materials', label: '材质 / 纹理', match: ex => ex.category && /(material|materials|texture|textures|normal-maps|pmrem|cubemap|decals|clearcoat|mirror|reflection|refraction|panorama|portal|video|backdrop|caustics|ocean|water|sky|fog|procedural|hdr|display|renderer)/i.test(ex.category) },
  { key: 'lights', label: '灯光 / 阴影', match: ex => ex.category && /(light|lights|lightprobe|shadow|shadowmap|lensflares)/i.test(ex.category) },
  { key: 'shader', label: '着色器 / GLSL', match: ex => ex.category && /(kaikeba-webgl|study-webgl|shader|shaders|tsl|glsl|shaping|noise|pixels|polar-shader|gpgpu|custom|ubo|compute|sandbox|centroid|compile)/i.test(ex.category) },
  { key: 'animation', label: '动画 / 粒子', match: ex => ex.category && /(animat|particle|particles|morphtargets|skinning|instanc|points|batch|sprites)/i.test(ex.category) },
  { key: 'post-effects', label: '后期处理 / 特效', match: ex => ex.category && /(postprocessing|effect|effects|effectComposer|pass|furnace|tonemapping|worker|lod|upscaling)/i.test(ex.category) },
  { key: 'render-target', label: '渲染目标', match: ex => ex.category && /(framebuffer|rendertarget|rtt|multisampled|depth|read|reversed|volume|mrt|occlusion|storage|struct|layers)/i.test(ex.category) },
  { key: 'interaction', label: '交互 / 相机', match: ex => ex.category && /(control|controls|interactive|camera|raycaster|boxselection|uv|multiple)/i.test(ex.category) },
  { key: 'loader', label: '加载器 / 资源', match: ex => ex.category && /(loader|exporter|performance)/i.test(ex.category) },
  { key: 'physics', label: '物理引擎', match: ex => ex.category && /(physics|ammo|rapier|jolt)/i.test(ex.category) },
  { key: 'data-viz', label: '数据可视化', match: ex => ex.category && (/(data|qcharts|d3|covid|github|graph|weather|park-people|vis-geo-earth|earth-lessons)/i.test(ex.category) || ['data-graph-css', 'data-graph-svg'].includes(ex.category)) },
  { key: 'xr-vr', label: 'XR / VR / AR', match: ex => ex.category && /(xr|vr|ar|webxr)/i.test(ex.category) },
  { key: 'audio', label: '音频', match: ex => ex.category && /(webaudio|audio)/i.test(ex.category) },
  { key: 'math', label: '数学 / 变换', match: ex => ex.category && /(quaternion|matrix|vector|math|easing|spline|bezier|random)/i.test(ex.category) },
  { key: 'expand', label: '扩展 / 综合', match: ex => ex.category && /(expand|other|svg|css2d|css3d|misc|test|canvas|color-hints|coordinates|raffle|sketch)/i.test(ex.category) }
]

export function getSubCategoriesByTech(techKey) {
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
  const allExamples = computed(() => getAllExamples())

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
    getSubCategoriesByTech
  }
}
