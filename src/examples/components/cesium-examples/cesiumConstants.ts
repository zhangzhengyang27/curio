/**
 * 天地图（Tianditu）访问令牌。
 *
 * 令牌属于凭据，不允许写入仓库：统一通过构建期环境变量 VITE_TDT_TOKEN 注入
 * （样例见仓库根 .env.example，本机真实值放 .env.local，后者已被 .gitignore 忽略）。
 */
export const TDT_TOKEN = import.meta.env.VITE_TDT_TOKEN || ''

if (!TDT_TOKEN) {
  console.warn(
    '[cesiumConstants] 未配置 VITE_TDT_TOKEN，依赖天地图底图的 Cesium 示例将无法加载瓦片。' +
      '请在 .env.local 中配置后重启开发服务器。'
  )
}
