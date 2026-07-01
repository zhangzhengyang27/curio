<template>
  <div class="gallery">
    <h1>ThreeGlobe 示例集</h1>
    <p class="subtitle">
      共 18 个示例，来自 <a
        href="https://github.com/vasturiano/three-globe"
        target="_blank"
      >vasturiano/three-globe</a>
    </p>
    <div class="grid">
      <router-link
        v-for="ex in examples"
        :key="ex.id"
        :to="`/three-globe/${ex.id}`"
        class="card"
      >
        <div class="card-icon">
          {{ ex.icon }}
        </div>
        <div class="card-title">
          {{ ex.title }}
        </div>
        <div class="card-desc">
          {{ ex.desc }}
        </div>
        <div class="card-tags">
          <span
            v-for="tag in ex.tags"
            :key="tag"
            class="tag"
          >{{ tag }}</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
const examples = [
  { id: 'basic', icon: '🌍', title: 'Basic', desc: '基础地球，展示等距矩形纹理贴图', tags: ['基础', '贴图'] },
  { id: 'arcs', icon: '🔗', title: 'Arc Links', desc: '弧线链接，两点之间的弧线飞线', tags: ['弧线', '飞线'] },
  { id: 'polygons', icon: '🗺️', title: 'Country Polygons', desc: '国家多边形，GeoJSON 国家边界', tags: ['多边形', 'GeoJSON'] },
  { id: 'paths', icon: '📍', title: 'Path Lines', desc: '路径线，地球表面的轨迹路径', tags: ['路径', '轨迹'] },
  { id: 'heatmap', icon: '🔥', title: 'Heatmap', desc: '热力图，点密度热力分布', tags: ['热力图', '密度'] },
  { id: 'hexbin', icon: '⬡', title: 'Hexagonal Binning', desc: '六边形分箱聚合数据点', tags: ['六边形', '聚合'] },
  { id: 'hexed-polygons', icon: '🔷', title: 'Hexed Polygons', desc: '六边形化国家多边形', tags: ['六边形', '多边形'] },
  { id: 'tiles', icon: '🧩', title: 'Tiles', desc: '瓦片，球面片段数据', tags: ['瓦片', 'Tile'] },
  { id: 'ripples', icon: '🌊', title: 'Ripple Rings', desc: '涟漪环，同心圆传播动画', tags: ['涟漪', '动画'] },
  { id: 'clouds', icon: '☁️', title: 'Clouds', desc: '云层，大气云层效果', tags: ['云层', '纹理'] },
  { id: 'day-night', icon: '🌓', title: 'Day/Night Cycle', desc: '昼夜循环模拟', tags: ['昼夜', '光照'] },
  { id: 'solar-terminator', icon: '🌅', title: 'Solar Terminator', desc: '晨昏线/太阳终结线', tags: ['晨昏线', '天文'] },
  { id: 'labels', icon: '🏷️', title: 'Labels', desc: '3D 文字标签', tags: ['标签', '文字'] },
  { id: 'html-markers', icon: '📌', title: 'HTML Markers', desc: 'HTML DOM 元素标记', tags: ['HTML', '标记'] },
  { id: 'satellites', icon: '🛰️', title: 'Satellites', desc: '绕地卫星轨道可视化', tags: ['卫星', '轨道'] },
  { id: 'tile-engine', icon: '🗺️', title: 'Tiled Map Engine', desc: '瓦片地图引擎覆盖', tags: ['瓦片', '地图'] },
  { id: 'custom-material', icon: '🎨', title: 'Custom Material', desc: '自定义地球材质', tags: ['材质', 'Shader'] },
  { id: 'custom-layer', icon: '✨', title: 'Custom Layer', desc: '自定义 3D 对象图层', tags: ['自定义', '3D对象'] },
]
</script>

<style scoped>
.gallery {
  position: fixed; top: 40px; left: 0; right: 0; bottom: 0;
  overflow-y: auto; padding: 32px;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%);
}
h1 { color: #4fc3f7; font-size: 28px; margin-bottom: 4px; }
.subtitle { color: #888; font-size: 13px; margin-bottom: 28px; }
.subtitle a { color: #4fc3f7; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; padding: 20px;
  text-decoration: none; display: block;
  transition: all 0.2s;
}
.card:hover {
  background: rgba(79,195,247,0.1);
  border-color: rgba(79,195,247,0.3);
  transform: translateY(-2px);
}
.card-icon { font-size: 32px; margin-bottom: 10px; }
.card-title { color: #e0e0e0; font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.card-desc { color: #999; font-size: 12px; line-height: 1.5; margin-bottom: 10px; }
.card-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag {
  background: rgba(79,195,247,0.15); color: #4fc3f7;
  font-size: 10px; padding: 2px 8px; border-radius: 10px;
}
</style>
