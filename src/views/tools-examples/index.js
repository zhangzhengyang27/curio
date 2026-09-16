/**
 * /tools 示例注册表。
 *
 * `/tools` 是示例列表页（MapToolsGallery），`/tools/:slug` 是单个示例页
 * （MapToolsExampleView 按 slug 从这里懒加载 component）。
 * 新增示例：加一个条目 + 一个 .vue 文件即可，列表与路由自动生效。
 *
 * component 必须是动态 import 工厂：保证每个示例独立分包，
 * 进入列表页不加载 vue-cesium 与任何示例代码。
 *
 * ⚠ vue-cesium 3.2.12 的量测/绘制/分析组件（VcMeasurements/VcDrawings/
 * VcAnalyses/VcAnalysisFlood）在本项目环境（Vite 8 Rolldown）下点击链路
 * 静默失效，dev/preview 双形态复现（含纯官方三行接入形态），故暂不引入，
 * 仅保留验证可靠的 VcNavigation。详见 docs/CHANGELOG.md 2026-09-16 条。
 */
export const TOOLS_EXAMPLES = [
  {
    slug: 'toolbox',
    title: '综合工具箱',
    icon: '🧰',
    gradient: 'linear-gradient(135deg, #14324f 0%, #2f6f9f 100%)',
    tags: ['搜索', '量测', '标绘', '坐标转换', '导出'],
    desc: '地名搜索、量距量面、贴地距离与高程剖面、标绘顶点编辑、书签、坐标转换、GeoJSON/CSV 导出。',
    component: () => import('./ToolboxExample.vue'),
  },
  {
    slug: 'navigation',
    title: '导航控件',
    icon: '🧭',
    gradient: 'linear-gradient(135deg, #33132a 0%, #9f2f5f 100%)',
    tags: ['vue-cesium', '罗盘', '比例尺'],
    desc: '罗盘、缩放、定位、打印、状态栏与距离比例尺等地图控件集合（vue-cesium VcNavigation）。',
    component: () => import('./NavigationExample.vue'),
  },
]

export function getToolsExample(slug) {
  return TOOLS_EXAMPLES.find((e) => e.slug === slug) || null
}
