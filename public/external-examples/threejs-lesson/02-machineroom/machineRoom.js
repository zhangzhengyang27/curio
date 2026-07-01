import {
	MeshBasicMaterial,
	MeshStandardMaterial,
	Mesh,
	PerspectiveCamera,
	Raycaster,
	Scene,
	TextureLoader,
	WebGLRenderer,
	Vector2,
	Color,
	AmbientLight,
	DirectionalLight,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const gltfLoader = new GLTFLoader()
const raycaster = new Raycaster()
const pointer = new Vector2()

const modelPath = '/external-examples/threejs-lesson/02-machineroom/public/models/'

class MachineRoom {
	constructor(canvas) {
		this.renderer = new WebGLRenderer({ canvas, antialias: true })
		this.scene = new Scene()
		this.scene.background = new Color(0x1a1a2a)
		this.camera = new PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
		this.camera.position.set(0, 10, 15)
		this.camera.lookAt(0, 0, 0)
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.maps = new Map()
		this.cabinets = []
		this.curCabinet = null

		const ambient = new AmbientLight(0xffffff, 0.4)
		this.scene.add(ambient)
		const dir = new DirectionalLight(0xffffff, 1)
		dir.position.set(5, 10, 5)
		this.scene.add(dir)

		this.crtTexture('cabinet-hover.jpg')
	}

	loadGLTF(modelName) {
		gltfLoader.load(modelPath + modelName, ({ scene: { children } }) => {
			children.forEach((obj) => {
				const { map, color } = obj.material || {}
				this.changeMat(obj, map, color)
				if (obj.name && obj.name.includes('cabinet')) {
					this.cabinets.push(obj)
				}
			})
			this.scene.add(...children)
		})
	}

	changeMat(obj, map, color) {
		if (map) {
			obj.material = new MeshBasicMaterial({
				map: this.crtTexture(map.name),
			})
		} else {
			obj.material = new MeshBasicMaterial({ color })
		}
	}

	crtTexture(imgName) {
		let curTexture = this.maps.get(imgName)
		if (!curTexture) {
			curTexture = new TextureLoader().load(modelPath + imgName)
			curTexture.flipY = false
			curTexture.wrapS = 1000
			curTexture.wrapT = 1000
			this.maps.set(imgName, curTexture)
		}
		return curTexture
	}

	selectCabinet(x, y) {
		const { cabinets, renderer, camera, maps, curCabinet } = this
		const { width, height } = renderer.domElement
		pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
		raycaster.setFromCamera(pointer, camera)
		const intersect = raycaster.intersectObjects(cabinets)[0]
		const intersectObj = intersect ? intersect.object : null
		if (curCabinet && curCabinet !== intersectObj) {
			curCabinet.material.setValues({
				map: maps.get('cabinet.jpg'),
			})
		}
		if (intersectObj) {
			if (intersectObj !== curCabinet) {
				this.curCabinet = intersectObj
				intersectObj.material.setValues({
					map: maps.get('cabinet-hover.jpg'),
				})
			}
		} else if (curCabinet) {
			this.curCabinet = null
		}
	}

	resize() {
		const { renderer, camera } = this
		const { clientWidth, clientHeight } = renderer.domElement
		renderer.setSize(clientWidth * window.devicePixelRatio, clientHeight * window.devicePixelRatio, false)
		camera.aspect = clientWidth / clientHeight
		camera.updateProjectionMatrix()
	}

	animate() {
		this.controls.update()
		this.renderer.render(this.scene, this.camera)
		requestAnimationFrame(() => {
			this.animate()
		})
	}
}

const canvas = document.getElementById('canvas')
const room = new MachineRoom(canvas)
room.loadGLTF('machineRoom.gltf')
room.animate()

window.addEventListener('resize', () => room.resize())
canvas.addEventListener('mousemove', (e) => {
	room.selectCabinet(e.offsetX, e.offsetY)
})
