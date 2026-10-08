/**
 * 示例中心的来源溯源登记。
 *
 * 为什么单独一个手工维护的文件，而不是往 registry 条目里加字段：
 *   ① 示例中心是只读归档（docs/ROADMAP.md 第 0 节），而 4 个 registry 分片由生成器维护、
 *      被 `npm run verify:drift` 逐字节比对（AGENTS.md R1/R2）—— 为加字段去改生成器重跑，
 *      成本和风险都不划算；
 *   ② 溯源是「按来源」的属性，不是「按条目」的。1417 条各写一份日期只会制造 1417 个可漂移点。
 *
 * 也不要拿 registry 文件的 git 日期当数据日期：11 个分片全部显示 2026-09-19，
 * 那是 `.js → .ts` 改名（579b5729）留下的，真实数据变更被完全掩盖。
 *
 * `upstream` 只登记脚本 / 文档里查得到出处的，查不到就写 null —— 这是「待补」，
 * 不是「确认无关」。tests/example-provenance.spec.ts 要求每个来源都在这里有登记。
 */

export interface SourceProvenance {
  /** 上游出处；null = 仓库内查不到记录，需要补 */
  upstream: string | null
  /** 上游 commit / tag。vendored 拷贝里没留版本文件，目前全部为 null */
  upstreamRef: string | null
  /** 出处是从哪里查到的（脚本路径或文档），便于复核 */
  evidence?: string
}

export const sourceProvenance: Record<string, SourceProvenance> = {
  'cesium-examples': { upstream: null, upstreamRef: null },
}

/**
 * 两个可核实的快照日期（`git log -1 --date=short -- <路径>`）。
 * 归档品能自证可信度的只有「封存的是哪一版」，所以这一行要摆在界面上。
 */
export const snapshotProvenance = {
  /** public/external-examples —— vendored 的第三方示例资源 */
  assets: { capturedAt: '2026-07-25', capturedCommit: 'e2d2f194' },
  /** public/example-thumbs —— 封面截图流水线产物 */
  thumbs: { capturedAt: '2026-09-11', capturedCommit: '4737a0a6' },
}

/** 运行时引擎版本（与 registry 无关，但回答「这些示例是按哪版 API 跑的」） */
export const runtimeProvenance = {
  three: 'r186dev',
  cesium: '1.142',
}

/** 拼成界面上一行可读的快照说明 */
export function snapshotSummary(): string {
  return [
    `资源快照 ${snapshotProvenance.assets.capturedAt}`,
    `封面 ${snapshotProvenance.thumbs.capturedAt}`,
    `three ${runtimeProvenance.three} / Cesium ${runtimeProvenance.cesium}`,
  ].join(' · ')
}
