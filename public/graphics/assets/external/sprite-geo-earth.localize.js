// 本地化前置脚本 —— 非上游文件，本仓库自建。
//
// 背景：sprite-geo-earth 的 config.topojsonData 默认硬编码指向上游 CDN
//   https://s5.ssl.qhres.com/static/843bbd2c37f94f26.json
// 该域名已不可解析（浏览器报 ERR_NAME_NOT_RESOLVED），导致 createGlobe 的
// loadMap 拿不到世界地理数据 → 球体渲染成纯黑、光束不绘制。
//
// 仓库里已 vendored 同名同内容的副本：/graphics/assets/external/843bbd2c37f94f26.json
// （Topology，objects.countries 180 国）。这里把默认数据源改指本地。
//
// ⚠ 必须在 sprite-geo-earth.js 之后、createGlobe() 之前加载：
//   createGlobe 与 loadMap 都是在「调用时」读取 config.topojsonData。
// ⚠ 不改 vendored 的 sprite-geo-earth.js —— 保持上游文件原样可校验。
;(function () {
  var globe = window.spritejs && window.spritejs.globe
  if (!globe || !globe.config) {
    console.warn('[sprite-geo-earth.localize] spritejs.globe 未就绪，本地化未生效')
    return
  }
  globe.config.topojsonData = '/graphics/assets/external/843bbd2c37f94f26.json'
})()
