<template>
  <nav class="app-nav">
    <router-link to="/">
      🌍 地球可视化
    </router-link>
    <router-link to="/three-globe">
      🌐 ThreeGlobe 示例
    </router-link>
    <router-link to="/examples">
      🧊 示例中心
    </router-link>
  </nav>
  <router-view />
</template>

<script setup>
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { width: 100%; height: 100%; overflow: hidden; }
.app-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  display: flex; gap: 0; background: rgba(0,0,0,0.75);
  padding: 0 16px; height: 40px; align-items: center;
  backdrop-filter: blur(8px);
}
.app-nav a {
  color: #aaa; text-decoration: none; font-size: 13px;
  padding: 0 16px; height: 100%; display: flex; align-items: center;
  transition: color 0.2s;
}
.app-nav a:hover { color: #fff; }
.app-nav a.router-link-active { color: #4fc3f7; border-bottom: 2px solid #4fc3f7; }
</style>
