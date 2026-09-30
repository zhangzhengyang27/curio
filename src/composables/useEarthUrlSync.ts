import { watch } from 'vue'
import type { Ref } from 'vue'

/**
 * 首页可视化模式的 URL 同步(自 EarthView 原样迁出,行为等价):
 *  1) 深链:#population 等 10 个白名单值在画布就绪后应用一次;
 *  2) 回写:currentVisualization 变化时 replaceState 写 hash——不压历史、
 *     gdp/default(默认值与画布初始化原生态)清 hash。
 */
const HASH_MODES = ['gdp', 'population', 'carbon', 'trade', 'flights', 'earthquake', 'nightlights', 'china', 'landmarks', 'heatmap']

export function useEarthUrlSync(options: {
  currentVisualization: Ref<string>
  canvas: Ref<{ switchVisualization?: (mode: string) => void } | null>
  /** 巡游播放中地址由 ?tour=&step= 统一管理,此时不写 hash(竞态守卫) */
  tourActive: () => boolean
}) {
  const { currentVisualization, canvas, tourActive } = options

  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '')
    if (hash && HASH_MODES.includes(hash)) {
      const stopReady = watch(canvas, (val) => {
        if (val) {
          val.switchVisualization?.(hash)
          stopReady()
        }
      }, { immediate: true })
    }
  }

  watch(currentVisualization, (v) => {
    // 巡游播放中写 hash 会触发 vue-router 携带旧 query 的导航,把刚 replace 的 step 冲回去(竞态)
    if (tourActive()) return
    // replaceState 而不是直写 location.hash:直写每次点模式都往历史里压一条,
    // 「后退」会在 12 个模式之间来回走而不是退出页面。
    // gdp 是默认值,切回它要把 hash 清掉 —— 否则 carbon → gdp 后地址还留着
    // #carbon,同一个链接再打开会落在别的模式上。
    // 'default' 同理不算用户选择:它是画布初始化落地的「无选择」原生态
    // (EarthCanvas 启动即切它),写进 URL 只会产出一枚恢复逻辑不认识的 #default,
    // 还会与客户端导航后的 URL 断言竞速(2026-09-29 smoke 外壳分区用例即因此翻车)。
    const base = window.location.pathname + window.location.search
    if (v && v !== 'gdp' && v !== 'default') {
      window.history.replaceState(null, '', base + '#' + v)
    } else if (window.location.hash) {
      window.history.replaceState(null, '', base)
    }
  })
}
