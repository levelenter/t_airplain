<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useArStore } from '@/stores/ar'
import { MARKERS } from '@/utils/markers'
import { configureImageTargets, stopXR8 } from '@/utils/xr8'
import Contents1 from './Contents1.vue'
import Contents2 from './Contents2.vue'
import Contents3 from './Contents3.vue'
import Contents4 from './Contents4.vue'
import Contents5 from './Contents5.vue'

const CONTENTS = { 1: Contents1, 2: Contents2, 3: Contents3, 4: Contents4, 5: Contents5 } as const

const router = useRouter()
const arStore = useArStore()

/** XR8 のロードと画像ターゲット登録が済んでからシーンをマウントする */
const ready = ref(false)
const sceneRef = useTemplateRef<HTMLElement>('scene')

interface ImageTargetEventDetail {
  name: string
}

function handleImageFound(event: Event) {
  arStore.onImageFound((event as CustomEvent<ImageTargetEventDetail>).detail.name)
}

function handleImageLost(event: Event) {
  arStore.onImageLost((event as CustomEvent<ImageTargetEventDetail>).detail.name)
}

onMounted(async () => {
  arStore.reset()
  arStore.loadedMarkerNames = await configureImageTargets(MARKERS.map((m) => m.name))
  ready.value = true

  // a-scene は v-if でこの後に挿入されるため、イベントは次フレームで購読する
  requestAnimationFrame(() => {
    sceneRef.value?.addEventListener('xrimagefound', handleImageFound)
    sceneRef.value?.addEventListener('xrimagelost', handleImageLost)
  })
})

onBeforeUnmount(() => {
  sceneRef.value?.removeEventListener('xrimagefound', handleImageFound)
  sceneRef.value?.removeEventListener('xrimagelost', handleImageLost)
  stopXR8()
})

function goBack() {
  router.push({ name: 'start' })
}
</script>

<template>
  <div class="camera">
    <!--
      xrweb: 6DoF ワールドトラッキング（SLAM）+ Image Targets を有効化する 8th Wall コンポーネント。
      disableWorldTracking を指定しない（= SLAM 有効）ことで 6DoF になる。
    -->
    <a-scene
      v-if="ready"
      ref="scene"
      xrweb
      landing-page
      xrextras-loading
      xrextras-runtime-error
      xrextras-gesture-detector
      renderer="colorManagement: true"
    >
      <a-camera position="0 2 2" raycaster="objects: .cantap" cursor="fuse: false; rayOrigin: mouse;"></a-camera>

      <a-light type="directional" intensity="0.8" position="1 4 2"></a-light>
      <a-light type="ambient" intensity="0.7"></a-light>

      <component :is="CONTENTS[marker.contentId]" v-for="marker in MARKERS" :key="marker.name" :marker-name="marker.name" />
    </a-scene>

    <div v-else class="camera__loading">カメラを準備しています…</div>

    <!-- HTML オーバーレイ（HUD）: A-Frame のテキストは日本語グリフ非対応のため、日本語表示はここで行う -->
    <header class="camera__hud">
      <button class="camera__back" type="button" @click="goBack">← メニュー</button>
      <p v-if="arStore.activeMarker" class="camera__label">{{ arStore.activeMarker.title }}</p>
      <p v-else class="camera__label camera__label--hint">画像マーカーを探してかざしてください</p>
    </header>
  </div>
</template>

<style scoped>
.camera {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #000;
}

.camera__loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.95rem;
}

.camera__hud {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(env(safe-area-inset-top, 0px) + 12px) 12px 12px;
  pointer-events: none;
}

.camera__back {
  pointer-events: auto;
  padding: 8px 14px;
  font-size: 0.9rem;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  border: 1px solid rgb(255 255 255 / 40%);
  border-radius: 999px;
  cursor: pointer;
}

.camera__label {
  margin: 0;
  padding: 8px 16px;
  font-size: 0.95rem;
  font-weight: bold;
  color: #0b1e3f;
  background: rgb(255 213 79 / 92%);
  border-radius: 999px;
}

.camera__label--hint {
  color: #fff;
  font-weight: normal;
  background: rgb(0 0 0 / 55%);
}
</style>
