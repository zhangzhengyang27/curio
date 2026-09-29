import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

/**
 * 首页地球 · 后处理（Bloom）。
 *
 * 两条历史问题：
 *   1) UnrealBloomPass 在 onMounted 里无条件创建（11 个 HalfFloat 渲染目标 + 4 个材质），
 *      而 Bloom 默认关着；卸载时只调 composer.dispose()，它并不替 addPass 进去的
 *      pass 收尾 —— 每进一次 / 就漏一批渲染目标。
 *   2) composer.setSize 从不调用，RT 尺寸停在创建时的值。
 * 现在改成首次开启 Bloom 时才建，并按画布实际尺寸创建。
 *
 * 判别式断言：开启 Bloom 前后 renderer.info.memory.textures 必须**增加** ——
 * 惰性创建才成立；旧实现里 Bloom 的纹理在挂载时就已计入，前后差为 0。
 */

const IS_PREVIEW = process.env.E2E_TARGET === 'preview'

/** 从组件实例拿 renderer 的资源计数（defineExpose 的 getRenderer） */
async function texCount(page) {
  return page.evaluate(() => {
    const el = document.querySelector('canvas')
    const inst = el && el.__vueParentComponent
    if (!inst || !inst.exposed || !inst.exposed.getRenderer) return null
    return inst.exposed.getRenderer().info.memory.textures
  })
}

/** 画布上「有内容」的像素占比（背景清屏色 0x0a0a1a） */
async function sceneInkRatio(page) {
  const b64 = (await page.screenshot({ type: 'png' })).toString('base64')
  return page.evaluate(async (s) => {
    const bin = atob(s)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
    const bmp = await createImageBitmap(new Blob([buf], { type: 'image/png' }))
    const cv = new OffscreenCanvas(bmp.width, bmp.height)
    const g = cv.getContext('2d')
    g.drawImage(bmp, 0, 0)
    const d = g.getImageData(0, 57, bmp.width, bmp.height - 57).data
    let fg = 0
    let tot = 0
    for (let i = 0; i < d.length; i += 28) {
      tot++
      if (!(d[i] < 30 && d[i + 1] < 30 && d[i + 2] < 46)) fg++
    }
    return fg / tot
  }, b64)
}

const bloomBtn = (page) => page.locator('.tool-btn[aria-label="辉光"]')

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

test.describe('首页地球 · 后处理', () => {
  // getRenderer 走的是组件实例上的 exposed 句柄，产物构建不保证可及，只在 dev 下跑
  test.skip(IS_PREVIEW, '依赖 dev 模式下的 __vueParentComponent 句柄')

  test('Bloom 的渲染目标按需创建，开关与 resize 后画面仍正常', async ({ page }) => {
    // 三次整页截图 + 页内 PNG 解码算像素占比，本身就重；
    // 再叠上「等出帧」轮询（预算 60s）已经越过默认用例超时
    test.slow()
    const errs = []
    page.on('console', (m) => {
      if (m.type() === 'error') errs.push(m.text())
    })
    page.on('pageerror', (e) => errs.push(String(e)))

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const before0 = await texCount(page)
    expect(before0, '需要能从组件实例读到 renderer.info').not.toBeNull()
    // 等到真的出帧再操作：初始化要跑好几秒，早于渲染循环建立时点辉光是空转
    await expect
      .poll(() => page.evaluate(() => document.querySelector('.earth-canvas')?.__vueParentComponent?.exposed?.getRenderer()?.info?.render?.frame ?? 0), { timeout: 60_000 })
      .toBeGreaterThan(0)
    // 基线要在就绪之后再取，否则把初始化过程中陆续上传的纹理算成 Bloom 的增量
    const before = await texCount(page)

    await bloomBtn(page).evaluate((el) => el.click())
    // 惰性创建：开 Bloom 才会多出 UnrealBloomPass 的那批渲染目标。
    // 轮询而不是固定 sleep —— 那三个 chunk 是动态 import 的，
    // 满载时创建完成时间不稳（实测固定等 1.8s 在 loadavg 34 下会假红）
    await expect.poll(() => texCount(page), { timeout: 30_000 }).toBeGreaterThan(before)
    expect(await sceneInkRatio(page)).toBeGreaterThan(0.15)

    // resize 后 composer 必须跟着 setSize，否则 Bloom 按旧尺寸渲染
    await page.setViewportSize({ width: 1000, height: 720 })
    await page.waitForTimeout(1500)
    expect(await sceneInkRatio(page)).toBeGreaterThan(0.15)

    await bloomBtn(page).evaluate((el) => el.click())
    await page.waitForTimeout(1200)
    expect(await sceneInkRatio(page)).toBeGreaterThan(0.15)

    expect(errs).toEqual([])
  })
})
