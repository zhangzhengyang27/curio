import threeCesiumExamples from './threeCesiumExamples.js'
import cesiumExamples from './cesiumExamples.js'
import threejsLesson from './threejsLesson.js'
import earthLessons from './earthLessons.js'
import threejsOfficialExamples from './threejsOfficialExamples.js'
import granary3dExamples from './granary3dExamples.js'
import webglExamples from './webglExamples.js'
import mygrapicsExamples from './mygrapicsExamples.js'
import graphicsExamples from './graphicsExamples.js'
import threeProjectExamples from './threeProjectExamples.js'

const registries = [threeCesiumExamples, cesiumExamples, threejsLesson, earthLessons, threejsOfficialExamples, granary3dExamples, webglExamples, mygrapicsExamples, graphicsExamples, threeProjectExamples]

export function getAllExamples() {
  const list = []
  registries.forEach(registry => {
    registry.examples.forEach(ex => {
      list.push({
        source: registry.source,
        ...ex,
      })
    })
  })
  return list
}

export function getExampleById(source, category, id) {
  const registry = registries.find(r => r.source === source)
  if (!registry) return null
  return registry.examples.find(ex => ex.category === category && ex.id === id) || null
}

export function getExamplesBySource(source) {
  const registry = registries.find(r => r.source === source)
  return registry ? registry.examples.map(ex => ({ source, ...ex })) : []
}

export function getCategories() {
  const cats = new Map()
  cats.set('all', { key: 'all', label: '全部' })
  getAllExamples().forEach(ex => {
    if (!cats.has(ex.category)) {
      cats.set(ex.category, { key: ex.category, label: ex.categoryLabel || ex.category })
    }
  })
  return Array.from(cats.values())
}

export function getSources() {
  return registries.map(r => ({ source: r.source, label: r.label }))
}
