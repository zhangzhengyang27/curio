import threeCesiumExamples from './threeCesiumExamples.js'
import cesiumExamples from './cesiumExamples.js'
import threejsLesson from './threejsLesson.js'
import earthLessons from './earthLessons.js'
import threejsOfficialExamples from './threejsOfficialExamples.js'
import granary3dExamples from './granary3dExamples.js'

const registries = [threeCesiumExamples, cesiumExamples, threejsLesson, earthLessons, threejsOfficialExamples, granary3dExamples]

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
