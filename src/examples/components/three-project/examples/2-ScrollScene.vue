<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import gsap from "gsap"

  // 容器引用
  const containerRef = shallowRef<HTMLDivElement | null>(null)
  const scrollContainerRef = shallowRef<HTMLDivElement | null>(null)

  // 场景对象引用
  let cubeGroup: THREE.Group | null = null
  let sjxGroup: THREE.Group | null = null
  let sphereGroup: THREE.Group | null = null
  let smallBall: THREE.Mesh | null = null
  let cubeArr: THREE.Mesh[] = []
  let arrGroup: THREE.Group[] = []
  let raycaster: THREE.Raycaster | null = null
    let clock: THREE.Clock | null = null
    let currentPage = 0
    let animationId: number | null = null

  // 鼠标位置
  const mouse = new THREE.Vector2()

  // 材质
  let material: THREE.MeshBasicMaterial | null = null
  let redMaterial: THREE.MeshBasicMaterial | null = null

  // 使用封装的场景 (不启用轨道控制器,因为要自定义相机移动)
  const {
    scene,
    camera,
    renderer,
    startAnimation: _startAnimation,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    fov: 75,
    near: 0.1,
    far: 300,
    cameraPosition: { x: 0, y: 0, z: 18 },
    enableControls: false, // 禁用轨道控制器
    showAxesHelper: true,
    axesHelperSize: 5,
    rendererConfig: {
      alpha: true // 渲染器透明
    }
  } as any)

  /**
   * 创建立方体组 - 第一页
   */
  const createCubeGroup = () => {
    if (!scene.value) return

    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2)
    material = new THREE.MeshBasicMaterial({
      wireframe: true
    })
    redMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000
    })

    cubeGroup = new THREE.Group()
    cubeArr = []

    // 创建 5x5x5 的立方体矩阵
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        for (let z = 0; z < 5; z++) {
          const cube = new THREE.Mesh(cubeGeometry, material)
          cube.position.set(i * 2 - 4, j * 2 - 4, z * 2 - 4)
          cubeGroup.add(cube)
          cubeArr.push(cube)
        }
      }
    }

    scene.value.add(cubeGroup)

    // GSAP 动画 - 立方体组旋转
    gsap.to(cubeGroup.rotation, {
      x: "+=" + Math.PI * 2,
      y: "+=" + Math.PI * 2,
      duration: 10,
      ease: "power2.inOut",
      repeat: -1
    })
  }

  /**
   * 创建三角形组 - 第二页
   */
  const createTriangleGroup = () => {
    if (!scene.value) return

    sjxGroup = new THREE.Group()

    for (let i = 0; i < 50; i++) {
      // 每个三角形需要 3 个顶点,每个顶点需要 3 个值
      const geometry = new THREE.BufferGeometry()
      const positionArray = new Float32Array(9)

      for (let j = 0; j < 9; j++) {
        positionArray[j] = Math.random() * 10 - 5
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positionArray, 3))

      const color = new THREE.Color(Math.random(), Math.random(), Math.random())
      const triangleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })

      const sjxMesh = new THREE.Mesh(geometry, triangleMaterial)
      sjxGroup.add(sjxMesh)
    }

    sjxGroup.position.set(0, -30, 0)
    scene.value.add(sjxGroup)

    // GSAP 动画 - 三角形组旋转
    gsap.to(sjxGroup.rotation, {
      x: "-=" + Math.PI * 2,
      z: "+=" + Math.PI * 2,
      duration: 12,
      ease: "power2.inOut",
      repeat: -1
    })
  }

  /**
   * 创建球体场景 - 第三页
   */
  const createSphereGroup = () => {
    if (!scene.value) return

    sphereGroup = new THREE.Group()

    // 创建主球体
    const sphereGeometry = new THREE.SphereGeometry(1, 20, 20)
    const sphereMaterial = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.castShadow = true
    sphereGroup.add(sphere)

    // 创建平面
    const planeGeometry = new THREE.PlaneGeometry(20, 20)
    const plane = new THREE.Mesh(planeGeometry, sphereMaterial)
    plane.position.set(0, -1, 0)
    plane.rotation.x = -Math.PI / 2
    plane.receiveShadow = true
    sphereGroup.add(plane)

    // 环境光
    const light = new THREE.AmbientLight(0xffffff, 0.5)
    sphereGroup.add(light)

    // 创建小球 (点光源载体)
    smallBall = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 20), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
    smallBall.position.set(2, 2, 2)

    // 点光源
    const pointLight = new THREE.PointLight(0xff0000, 3)
    pointLight.castShadow = true
    pointLight.shadow.radius = 20
    pointLight.shadow.mapSize.set(512, 512)

    smallBall.add(pointLight)
    sphereGroup.add(smallBall)

    sphereGroup.position.set(0, -60, 0)
    scene.value.add(sphereGroup)

    // GSAP 动画 - 小球移动
    gsap.to(smallBall.position, {
      x: -3,
      duration: 6,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true
    })
    gsap.to(smallBall.position, {
      y: 0,
      duration: 0.5,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true
    })
  }

  /**
   * 监听鼠标移动
   */
  const handleMouseMove = (event: MouseEvent) => {
    mouse.x = event.clientX / window.innerWidth - 0.5
    mouse.y = event.clientY / window.innerHeight - 0.5
  }

  /**
   * 监听鼠标点击 - Raycaster 交互
   */
  const handleClick = (event: MouseEvent) => {
    if (!raycaster || !camera.value || !scrollContainerRef.value) return

    // 只在第一页（立方体页）处理点击
    const scrollY = scrollContainerRef.value.scrollTop
    const currentPageIndex = Math.round(scrollY / window.innerHeight)
    if (currentPageIndex !== 0) return

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -((event.clientY / window.innerHeight) * 2 - 1)

    raycaster.setFromCamera(mouse, camera.value)
    const result = raycaster.intersectObjects(cubeArr)

    // 将点击到的立方体变红
    result.forEach((item) => {
      if (redMaterial) {
        item.object.material = redMaterial
      }
    })
  }

  /**
   * 监听滚动事件 - 切换页面
   */
  const handleScroll = () => {
    if (!scrollContainerRef.value) return

    const scrollY = scrollContainerRef.value.scrollTop
    const newPage = Math.round(scrollY / window.innerHeight)

    if (newPage !== currentPage) {
      currentPage = newPage
      console.log("切换页面，当前页：" + currentPage)

      // 旋转当前页面的场景
      if (arrGroup[currentPage]) {
        gsap.to(arrGroup[currentPage].rotation, {
          z: "+=" + Math.PI * 2,
          x: "+=" + Math.PI * 2,
          duration: 2,
          onComplete: () => {
            console.log("旋转完成")
          }
        })
      }

      // 页面标题动画
      gsap.fromTo(`.page${currentPage} h1`, { x: -300 }, { x: 0, rotate: "+=360", duration: 1 })
    }
  }

  /**
   * 自定义渲染循环
   */
  const customRender = () => {
    if (!clock || !camera.value || !renderer.value || !scene.value || !scrollContainerRef.value) return

    const deltaTime = clock.getDelta()

    // 根据滚动位置移动相机
    const scrollY = scrollContainerRef.value.scrollTop
    camera.value.position.y = -(scrollY / window.innerHeight) * 30

    // 相机跟随鼠标移动
    camera.value.position.x += (mouse.x * 10 - camera.value.position.x) * deltaTime * 5

    // 渲染场景
    renderer.value.render(scene.value, camera.value)

    // 请求下一帧
      animationId = requestAnimationFrame(customRender)
    }

  /**
   * 初始化场景内容
   */
  const initContent = () => {
    if (!scene.value) return

    // 创建投射光线对象
    raycaster = new THREE.Raycaster()

    // 创建时钟
    clock = new THREE.Clock()

    // 创建三个场景组
    createCubeGroup()
    createTriangleGroup()
    createSphereGroup()

    // 保存场景组数组
    arrGroup = [cubeGroup!, sjxGroup!, sphereGroup!]

    // 启用渲染器阴影
    if (renderer.value) {
      renderer.value.shadowMap.enabled = true
    }

    console.log("场景初始化完成")
  }

  /**
   * 扩展清理函数
   */
  const extendedDispose = () => {
      // 取消自定义渲染循环
      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = null
      }

      // 移除事件监听
      window.removeEventListener("mousemove", handleMouseMove)
      if (scrollContainerRef.value) {
      scrollContainerRef.value.removeEventListener("click", handleClick)
      scrollContainerRef.value.removeEventListener("scroll", handleScroll)
    }

    // 清理场景组
    const disposeMaterial = (mat: THREE.Material | THREE.Material[]) => {
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose())
      } else {
        mat.dispose()
      }
    }

    if (cubeGroup) {
      cubeGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) disposeMaterial(child.material)
      })
      scene.value?.remove(cubeGroup)
    }

    if (sjxGroup) {
      sjxGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) disposeMaterial(child.material)
      })
      scene.value?.remove(sjxGroup)
    }

    if (sphereGroup) {
      sphereGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) disposeMaterial(child.material)
      })
      scene.value?.remove(sphereGroup)
    }

    // 清理材质
    material?.dispose()
    redMaterial?.dispose()

    // 清空引用
    cubeGroup = null
    sjxGroup = null
    sphereGroup = null
    smallBall = null
    cubeArr = []
    arrGroup = []
    raycaster = null
    clock = null

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 初始化场景内容
    initContent()

    // 添加事件监听
    window.addEventListener("mousemove", handleMouseMove)
    if (scrollContainerRef.value) {
      // 监听滚动容器的点击和滚动事件
      scrollContainerRef.value.addEventListener("click", handleClick)
      scrollContainerRef.value.addEventListener("scroll", handleScroll)
    }

    // 启动自定义渲染循环
    customRender()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <div
    ref="scrollContainerRef"
    class="ray-interaction-container"
  >
    <!-- Three.js 容器 (固定定位) -->
    <div
      ref="containerRef"
      class="three-container"
    />

    <!-- 滚动页面内容 -->
    <div class="scroll-content">
      <div class="page page0">
        <h1>THREE.Raycaster 实现 3d 交互效果</h1>
      </div>
      <div class="page page1">
        <h1>THREE.BufferGeometry！</h1>
        <h3>应用打造酷炫的三角形</h3>
      </div>
      <div class="page page2">
        <h1>活泼点光源</h1>
        <h3>点光源围绕照亮小球</h3>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .ray-interaction-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    overflow-x: hidden;
    overflow-y: scroll;
    background-color: rgb(36, 58, 66);
    /* 添加整页滚动效果 */
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
  }

  /* 隐藏滚动条但保持滚动功能 */
  .ray-interaction-container::-webkit-scrollbar {
    display: none;
  }

  /* 固定定位的 Three.js 画布容器 */
  .three-container {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100vh;
    z-index: 1;
    pointer-events: none;
  }

  /* 滚动内容容器 */
  .scroll-content {
    position: relative;
    z-index: 10;
    pointer-events: auto; /* 改为 auto，允许接收事件和滚动 */
    min-height: 300vh; /* 确保有足够的高度触发滚动 (3个页面 x 100vh) */
  }

  /* 每个页面 */
  .page {
    height: 100vh;
    display: flex;
    color: #fff;
    flex-direction: column;
    align-items: center;
    position: relative;
    pointer-events: auto; /* 改为 auto，允许接收事件 */
    /* 整页滚动吸附点 */
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }

  .page h1 {
    margin-top: 60px;
    margin-bottom: 20px;
    font-size: 40px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  .page h3 {
    font-size: 30px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }
</style>
