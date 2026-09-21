/**
 * gifenc 的最小类型声明。
 *
 * 该包（v1.0.3，MIT，零依赖）不随包发布 .d.ts，只声明本仓实际用到的 API。
 * 见 src/views/EarthView.vue 的「录制 GIF」。
 */
declare module 'gifenc' {
  /** RGBA 字节数组，长度必须为 4 * width * height */
  export type RGBA = Uint8Array | Uint8ClampedArray

  export interface QuantizeOptions {
    /** 输入格式，影响量化时的颜色距离计算 */
    format?: 'rgb565' | 'rgb444' | 'rgba4444'
    oneBitAlpha?: boolean | number
    clearAlpha?: boolean
    clearAlphaThreshold?: number
    clearAlphaColor?: number
  }

  export interface WriteFrameOptions {
    palette: number[][]
    /** 该帧停留时间，毫秒 */
    delay?: number
    /** 相对上一帧做差异编码 */
    delta?: boolean
    transparent?: boolean
    repeat?: number
    dispose?: number
    frameX?: number
    frameY?: number
  }

  export interface GIFEncoderInstance {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: WriteFrameOptions): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
    reset(): void
  }

  export function GIFEncoder(opts?: { loop?: number }): GIFEncoderInstance

  export function quantize(rgba: RGBA, maxColors: number, opts?: QuantizeOptions): number[][]

  export function applyPalette(
    rgba: RGBA,
    palette: number[][],
    format?: 'rgb565' | 'rgb444' | 'rgba4444'
  ): Uint8Array
}
