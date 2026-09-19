<template>
  <div
    class="gallery-page"
    data-testid="tools-gallery"
  >
    <main class="gallery-main">
      <header class="gallery-header">
        <div class="header-text">
          <h1 class="page-title">
            地图工具箱
          </h1>
          <p class="page-subtitle">
            基于 Cesium 的地图工具与空间分析示例，共 {{ TOOLS_EXAMPLES.length }} 个，点击卡片进入交互演示。
          </p>
        </div>
      </header>

      <div class="card-grid">
        <router-link
          v-for="ex in TOOLS_EXAMPLES"
          :key="ex.slug"
          :to="`/tools/${ex.slug}`"
          class="example-card"
          :data-slug="ex.slug"
          data-testid="tools-example-card"
        >
          <div
            class="card-media"
            :style="{ '--card-gradient': ex.gradient }"
          >
            <span class="card-emoji">{{ ex.icon }}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">
              {{ ex.title }}
            </h3>
            <p class="card-desc">
              {{ ex.desc }}
            </p>
            <div class="card-tags">
              <span
                v-for="t in ex.tags"
                :key="t"
                class="card-tag"
              >
                {{ t }}
              </span>
            </div>
          </div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { TOOLS_EXAMPLES } from './tools-examples/index'
</script>

<style scoped>
.gallery-page {
  position: fixed;
  top: var(--tv-top-nav-height);
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
  background:
    radial-gradient(1200px 600px at 80% -10%, rgb(45 106 159 / 25%), transparent),
    #0b1220;
  color: #dce7f2;
}

.gallery-main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 36px 24px 48px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 26px;
  color: #fff;
}

.page-subtitle {
  margin: 0 0 28px;
  font-size: 14px;
  color: #8fa3b8;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.example-card {
  display: block;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 14px;
  overflow: hidden;
  background: rgb(255 255 255 / 4%);
  text-decoration: none;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.example-card:hover {
  transform: translateY(-3px);
  border-color: rgb(143 199 255 / 45%);
}

.card-media {
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-gradient);
}

.card-emoji {
  font-size: 42px;
  filter: drop-shadow(0 4px 10px rgb(0 0 0 / 40%));
}

.card-body {
  padding: 14px 16px 16px;
}

.card-title {
  margin: 0 0 6px;
  font-size: 16px;
  color: #fff;
}

.card-desc {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.7;
  color: #9db0c3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: #8ec9ff;
  background: rgb(77 163 255 / 12%);
  border: 1px solid rgb(77 163 255 / 25%);
}
</style>
