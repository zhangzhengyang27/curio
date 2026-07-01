import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

function tag() {
  const div = document.createElement('div')
  div.style.visibility = 'hidden'
  div.innerHTML = 'GDP'
  div.style.padding = '4px 10px'
  div.style.color = '#fff'
  div.style.fontSize = '16px'
  div.style.position = 'absolute'
  div.style.backgroundColor = 'rgba(25,25,25,0.5)'
  div.style.borderRadius = '5px'
  const label = new CSS2DObject(div)
  div.style.pointerEvents = 'none'
  return label
}

const labelRenderer = new CSS2DRenderer()
labelRenderer.setSize(window.innerWidth, window.innerHeight)
labelRenderer.domElement.style.position = 'absolute'
labelRenderer.domElement.style.top = '-16px'
labelRenderer.domElement.style.left = '0px'
labelRenderer.domElement.style.pointerEvents = 'none'
document.body.appendChild(labelRenderer.domElement)

window.addEventListener('resize', () => {
  labelRenderer.setSize(window.innerWidth, window.innerHeight)
})

export { tag, labelRenderer }
