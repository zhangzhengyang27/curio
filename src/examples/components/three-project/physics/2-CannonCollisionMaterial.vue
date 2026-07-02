<script setup lang="ts">
  import { shallowRef, onUnmounted } from "vue"
  import * as THREE from "three"
  import { useThreeScene } from "@/examples/components/three-project/_shared/useThreeScene"
  import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
  import PageLayout from "@/examples/components/three-project/_shared/PageLayout.vue"
  import * as CANNON from "cannon-es"

  // 容器引用
  const containerRef = shallowRef(null)

  // 物理引擎和场景对象引用
  let world: CANNON.World | null = null
  let sphere: THREE.Mesh | null = null
  let sphereBody: CANNON.Body | null = null
  let floor: THREE.Mesh | null = null
  let floorBody: CANNON.Body | null = null
  let sphereWorldMaterial: CANNON.Material | null = null
  let floorMaterial: CANNON.Material | null = null
  let contactMaterial: CANNON.ContactMaterial | null = null
  let hitSound: HTMLAudioElement | null = null
  let clock: THREE.Clock | null = null
  let gui: GUI | null = null
  let animationId: number | null = null

  // 使用公共的 Three.js 场景逻辑
  const {
    scene,
    camera,
    renderer,
    controls,
    onSceneReady,
    dispose: baseDispose
  } = useThreeScene(containerRef, {
    cameraPosition: { x: 0, y: 0, z: 18 },
    enableControls: true,
    controlsConfig: {
      enableDamping: true,
      dampingFactor: 0.05
    },
    showAxesHelper: true,
    axesHelperSize: 5
  })

  /**
   * 创建碰撞音效
   */
  const createHitSound = () => {
    // 注意：音频文件路径需要放在 public 目录下
    hitSound = new Audio("/three-project/assets/metalHit.mp3")
  }

  /**
   * 碰撞事件处理
   */
  const handleCollision = (e: any) => {
    // 获取碰撞的强度
    const impactStrength = e.contact.getImpactVelocityAlongNormal()
    console.log("碰撞强度:", impactStrength)

    // 当碰撞强度大于2时播放声音
    if (impactStrength > 2 && hitSound) {
      // 重新从零开始播放
      hitSound.currentTime = 0
      hitSound.volume = Math.min(impactStrength / 100, 1) // 根据碰撞强度调整音量
      hitSound.play()
    }
  }

  /**
   * 创建物理世界
   */
  const createPhysicsWorld = () => {
    world = new CANNON.World()
    world.gravity.set(0, -9.8, 0)
  }

  /**
   * 创建球体和物理体
   */
  const createSphere = () => {
    if (!scene.value || !world) return

    // 创建 Three.js 球体（渲染用）
    const sphereGeometry = new THREE.SphereGeometry(1, 20, 20)
    const sphereMaterial = new THREE.MeshStandardMaterial()
    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.castShadow = true
    scene.value.add(sphere)

    // 创建物理小球形状
    const sphereShape = new CANNON.Sphere(1)

    // 设置物体材质（带名称）
    sphereWorldMaterial = new CANNON.Material("sphere")

    // 创建物理世界的物体
    sphereBody = new CANNON.Body({
      shape: sphereShape,
      position: new CANNON.Vec3(0, 0, 0),
      mass: 1, // 小球质量
      material: sphereWorldMaterial // 物体材质
    })

    // 添加碰撞事件监听
    sphereBody.addEventListener("collide", handleCollision)

    // 将物体添加至物理世界
    world.addBody(sphereBody)
  }

  /**
   * 创建地板和物理地面
   */
  const createFloor = () => {
    if (!scene.value || !world) return

    // 创建 Three.js 地面（渲染用）
    floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial())
    floor.position.set(0, -5, 0)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.value.add(floor)

    // 物理世界创建地面
    const floorShape = new CANNON.Plane()
    floorMaterial = new CANNON.Material("floor")
    floorBody = new CANNON.Body()
    floorBody.material = floorMaterial
    // 当质量为0的时候，可以使得物体保持不动
    floorBody.mass = 0
    floorBody.addShape(floorShape)
    // 地面位置
    floorBody.position.set(0, -5, 0)
    // 旋转地面的位置
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    world.addBody(floorBody)
  }

  /**
   * 设置材质碰撞参数
   */
  const setupContactMaterial = () => {
    if (!world || !sphereWorldMaterial || !floorMaterial) return

    // 设置2种材质碰撞的参数
    contactMaterial = new CANNON.ContactMaterial(sphereWorldMaterial, floorMaterial, {
      friction: 0.1, // 摩擦力
      restitution: 0.7 // 弹性（反弹系数）
    })

    // 将材料的关联设置添加到物理世界
    world.addContactMaterial(contactMaterial)
  }

  /**
   * 添加光源
   */
  const addLights = () => {
    if (!scene.value) return

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambientLight)

    // 添加平行光
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
    dirLight.castShadow = true
    scene.value.add(dirLight)
  }

  /**
   * 初始化 GUI 调试面板
   */
  const initGUI = () => {
    gui = new GUI()
    gui.title("物理引擎控制")

    // 球体控制
    const sphereFolder = gui.addFolder("⚽ 球体属性")

    const sphereSettings = {
      resetPosition: () => {
        if (sphereBody) {
          sphereBody.position.set(0, 5, 0) // 从高处落下
          sphereBody.velocity.set(0, 0, 0)
          sphereBody.angularVelocity.set(0, 0, 0)
        }
      },
      addForce: () => {
        if (sphereBody) {
          sphereBody.applyLocalForce(
            new CANNON.Vec3(0, 300, 0), // 力的大小和方向
            new CANNON.Vec3(0, 0, 0) // 作用点
          )
        }
      }
    }

    sphereFolder.add(sphereSettings, "resetPosition").name("从高处落下")
    sphereFolder.add(sphereSettings, "addForce").name("施加向上的力")
    sphereFolder.open()

    // 物理世界控制
    const worldFolder = gui.addFolder("🌍 物理世界")

    const worldSettings = {
      gravity: -9.8
    }

    worldFolder
      .add(worldSettings, "gravity", -20, 0, 0.1)
      .name("重力")
      .onChange((value) => {
        if (world) {
          world.gravity.set(0, value, 0)
        }
      })

    worldFolder.open()

    // 材质属性控制
    const materialFolder = gui.addFolder("🎨 碰撞材质属性")

    const materialSettings = {
      friction: 0.1,
      restitution: 0.7
    }

    materialFolder
      .add(materialSettings, "friction", 0, 1, 0.01)
      .name("摩擦力")
      .onChange((value) => {
        if (contactMaterial) {
          contactMaterial.friction = value
        }
      })

    materialFolder
      .add(materialSettings, "restitution", 0, 1, 0.01)
      .name("弹性（反弹）")
      .onChange((value) => {
        if (contactMaterial) {
          contactMaterial.restitution = value
        }
      })

    materialFolder.open()
  }

  /**
   * 自定义渲染循环
   */
  const customRender = () => {
    if (!clock || !world || !sphere || !sphereBody || !renderer.value || !scene.value || !camera.value) return

    const deltaTime = clock.getDelta()

    // 更新物理引擎世界,1 / 120 表示每秒120帧,deltaTime 表示时间差
    world.step(1 / 120, deltaTime)

    // 同步 Three.js 球体位置到物理引擎
    sphere.position.copy(sphereBody.position)

    // 更新控制器
    if (controls.value) {
      controls.value.update()
    }

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

    // 创建时钟
    clock = new THREE.Clock()

    // 创建碰撞音效
    createHitSound()

    // 创建物理世界
    createPhysicsWorld()

    // 创建球体
    createSphere()

    // 创建地板
    createFloor()

    // 设置材质碰撞参数
    setupContactMaterial()

    // 添加光源
    addLights()

    // 初始化 GUI
    initGUI()

    // 启用渲染器阴影
    if (renderer.value) {
      renderer.value.shadowMap.enabled = true
    }
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

    // 移除碰撞事件监听
    if (sphereBody) {
      sphereBody.removeEventListener("collide", handleCollision)
    }

    // 清理物理世界
    if (world && sphereBody) {
      world.removeBody(sphereBody)
    }
    if (world && floorBody) {
      world.removeBody(floorBody)
    }
    if (world && contactMaterial) {
      world.removeContactMaterial(contactMaterial)
    }

    // 清理场景对象
    if (sphere && scene.value) {
      scene.value.remove(sphere)
      sphere.geometry.dispose()
      if (Array.isArray(sphere.material)) {
        sphere.material.forEach((m) => m.dispose())
      } else {
        sphere.material.dispose()
      }
    }

    if (floor && scene.value) {
      scene.value.remove(floor)
      floor.geometry.dispose()
      if (Array.isArray(floor.material)) {
        floor.material.forEach((m) => m.dispose())
      } else {
        floor.material.dispose()
      }
    }

    // 清理音频
    if (hitSound) {
      hitSound.pause()
      hitSound = null
    }

    // 清理 GUI
    gui?.destroy()

    // 清空引用
    world = null
    sphere = null
    sphereBody = null
    floor = null
    floorBody = null
    sphereWorldMaterial = null
    floorMaterial = null
    contactMaterial = null
    clock = null
    gui = null

    // 调用基础清理函数
    baseDispose()
  }

  // 场景准备好后初始化
  onSceneReady(() => {
    // 初始化场景内容
    initContent()

    // 启动自定义渲染循环
    animationId = requestAnimationFrame(customRender)
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    extendedDispose()
  })
</script>

<template>
  <PageLayout
    title="🎾 Cannon 材质与碰撞"
    description="Cannon.js 材质系统 - 摩擦力、弹性、碰撞事件监听和音效"
  >
    <!-- 自定义内容插槽 -->
    <template #content>
      <div class="features">
        <h3>功能特性：</h3>
        <ul>
          <li>🎨 <strong>物理材质</strong> - CANNON.Material 定义物体表面属性</li>
          <li>🤝 <strong>接触材质</strong> - ContactMaterial 设置碰撞参数</li>
          <li>🔄 <strong>摩擦力</strong> - friction 控制物体间的摩擦（0-1）</li>
          <li>🎾 <strong>弹性系数</strong> - restitution 控制反弹效果（0-1）</li>
          <li>💥 <strong>碰撞事件</strong> - addEventListener("collide") 监听碰撞</li>
          <li>🔊 <strong>碰撞音效</strong> - 根据碰撞强度播放声音</li>
          <li>🎛️ GUI 实时调整物理参数</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 核心概念：</h3>
        <ul>
          <li><strong>Material</strong>：物理材质，定义物体表面属性（如"sphere"、"floor"）</li>
          <li><strong>ContactMaterial</strong>：接触材质，定义两种材质碰撞时的物理行为</li>
          <li><strong>Friction</strong>：摩擦力，值越大物体越难滑动（0 = 无摩擦，1 = 高摩擦）</li>
          <li><strong>Restitution</strong>：弹性系数，值越大反弹越强（0 = 不反弹，1 = 完全弹性碰撞）</li>
          <li><strong>Impact Velocity</strong>：碰撞速度，用于判断碰撞强度</li>
        </ul>
      </div>

      <div class="code-tip">
        <p>💡 核心代码：</p>
        <p><code>// 创建物理材质</code></p>
        <p><code>const sphereMaterial = new CANNON.Material("sphere")</code></p>
        <p><code>const floorMaterial = new CANNON.Material("floor")</code></p>
        <p><code /></p>
        <p><code>// 设置材质碰撞参数</code></p>
        <p><code>const contactMaterial = new CANNON.ContactMaterial(</code></p>
        <p><code>&nbsp;&nbsp;sphereMaterial,</code></p>
        <p><code>&nbsp;&nbsp;floorMaterial,</code></p>
        <p><code>&nbsp;&nbsp;{</code></p>
        <p><code>&nbsp;&nbsp;&nbsp;&nbsp;friction: 0.1, // 摩擦力</code></p>
        <p><code>&nbsp;&nbsp;&nbsp;&nbsp;restitution: 0.7 // 弹性</code></p>
        <p><code>&nbsp;&nbsp;}</code></p>
        <p><code>)</code></p>
        <p><code>world.addContactMaterial(contactMaterial)</code></p>
        <p><code /></p>
        <p><code>// 监听碰撞事件</code></p>
        <p><code>sphereBody.addEventListener("collide", (e) => {</code></p>
        <p><code>&nbsp;&nbsp;const strength = e.contact.getImpactVelocityAlongNormal()</code></p>
        <p><code>&nbsp;&nbsp;console.log("碰撞强度:", strength)</code></p>
        <p><code>})</code></p>
      </div>

      <div class="info-section">
        <h3>🔧 摩擦力（Friction）：</h3>
        <ul>
          <li><strong>定义</strong>：阻碍物体相对运动的力</li>
          <li><strong>取值范围</strong>：0（完全光滑）到 1（高摩擦）</li>
          <li><strong>0.0</strong>：冰面效果，物体会一直滑动</li>
          <li><strong>0.1</strong>：低摩擦，物体会滑行一段距离</li>
          <li><strong>0.5</strong>：中等摩擦，正常物体</li>
          <li><strong>1.0</strong>：高摩擦，物体很快停止</li>
          <li>💡 试试调整 GUI 中的摩擦力参数！</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎾 弹性系数（Restitution）：</h3>
        <ul>
          <li><strong>定义</strong>：物体碰撞后的反弹能力</li>
          <li><strong>取值范围</strong>：0（不反弹）到 1（完全弹性）</li>
          <li><strong>0.0</strong>：完全非弹性碰撞，落地后不反弹（如泥巴）</li>
          <li><strong>0.3</strong>：低弹性，轻微反弹（如篮球）</li>
          <li><strong>0.7</strong>：中等弹性，明显反弹（如乒乓球）</li>
          <li><strong>0.9-1.0</strong>：高弹性，几乎完全反弹（如超级弹力球）</li>
          <li>💡 现实中很少有 1.0，总会损失能量</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💥 碰撞事件监听：</h3>
        <ul>
          <li><strong>addEventListener</strong>：监听物理对象的事件</li>
          <li><strong>"collide"</strong>：碰撞事件，当物体发生碰撞时触发</li>
          <li><strong>event.contact</strong>：碰撞接触信息</li>
          <li><strong>getImpactVelocityAlongNormal()</strong>：获取碰撞强度（法向速度）</li>
          <li><strong>应用场景</strong>：音效播放、粒子效果、计分系统</li>
          <li>💡 本例中：碰撞强度 > 2 时播放金属碰撞音效</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎨 ContactMaterial 工作原理：</h3>
        <ul>
          <li><strong>1. 创建材质</strong> - 为球体和地面分别创建 Material</li>
          <li><strong>2. 定义碰撞规则</strong> - 使用 ContactMaterial 设置参数</li>
          <li><strong>3. 添加到世界</strong> - world.addContactMaterial()</li>
          <li><strong>4. 自动匹配</strong> - 引擎自动根据材质匹配碰撞规则</li>
          <li>💡 可以为不同材质组合设置不同的物理参数</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>💡 使用技巧：</h3>
        <ul>
          <li>🎛️ 点击「从高处落下」观察球体下落和反弹效果</li>
          <li>🎛️ 调整摩擦力参数，观察球体滚动速度变化</li>
          <li>🎛️ 调整弹性参数，观察反弹高度变化</li>
          <li>🔊 打开音量，听碰撞音效（需要音频文件）</li>
          <li>💡 摩擦力 = 0 + 弹性 = 1 = 永动机效果</li>
          <li>💡 摩擦力 = 1 + 弹性 = 0 = 完全吸收碰撞</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>🎵 音效说明：</h3>
        <ul>
          <li>📁 音频文件需要放在 <code>public/assets/metalHit.mp3</code></li>
          <li>🔊 碰撞强度 > 2 时播放音效</li>
          <li>🎚️ 音量根据碰撞强度自动调整</li>
          <li>💡 如果没有音频文件，不影响物理模拟</li>
          <li>💡 可以在浏览器控制台看到碰撞强度数值</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>⚡ 性能优化建议：</h3>
        <ul>
          <li>💡 合理设置 ContactMaterial，避免过多的材质组合</li>
          <li>💡 使用默认材质处理大多数碰撞</li>
          <li>💡 只在需要特殊效果时创建自定义材质</li>
          <li>💡 音效播放要限制频率，避免同时播放过多</li>
          <li>💡 碰撞事件回调要轻量，避免复杂计算</li>
        </ul>
      </div>
    </template>

    <!-- Three.js 容器 -->
    <div ref="containerRef" />
  </PageLayout>
</template>

<style scoped>
  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: "Courier New", monospace;
    font-size: 11px;
    color: #42b983;
  }
</style>
