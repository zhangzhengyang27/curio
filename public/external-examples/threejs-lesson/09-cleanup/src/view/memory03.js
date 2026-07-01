import Box from '../component/Box.js'

const box = new Box('Memory03')
box.init()
box.addEventListener('beforerender', ({ time }) => {
  box.rotate(time * 0.001)
})

document.body.appendChild(box.renderer.domElement)
box.resize(window.innerWidth, window.innerHeight)
box.animate()
