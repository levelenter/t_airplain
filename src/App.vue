<script setup lang="ts">
import { watchEffect } from 'vue'
import { useLayoutMode } from '@/composables/useLayoutMode'

// 画面の向きモードを html 要素へ反映し、各コンポーネントの CSS から参照できるようにする
const { layoutMode } = useLayoutMode()
watchEffect(() => {
  document.documentElement.dataset.layout = layoutMode.value
})
</script>

<template>
  <RouterView />
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family:
    'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
