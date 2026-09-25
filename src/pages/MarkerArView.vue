<script setup lang="ts">
/**
 * AR.js（pattern マーカー）版の AR 画面。
 *
 * 8th Wall（CameraView）とは別の仕組みで、番号入りマーカー（public/marker/01〜06.png、
 * public/ar-patterns/marker_0N.patt）を認識して同じ Contents1〜6 を表示する。
 * タップでの表示確定は行わず、マーカーが見えている間だけ表示するシンプルな作りにしている
 * （8th Wall 版の pendingMarker/activatedMarkerNames のような状態管理は持たない）。
 */
import { onBeforeUnmount, onMounted, provide, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import TandemExplanation from '@/components/TandemExplanation.vue'
import { useContentTransformStore } from '@/stores/contentTransform'
import { registerAdditiveGlow } from '@/utils/aframeAdditiveGlow'
import { registerAutoSpin } from '@/utils/aframeAutoSpin'
import { registerGltfAnimation } from '@/utils/aframeGltfAnimation'
import { AR_MARKER_AR_KEY } from '@/utils/arPreview'
import { loadArjs } from '@/utils/loadArjs'
import { MARKER_AR_MARKERS } from '@/utils/markerAr'
import { CONTENT_COMPONENTS } from './contentComponents'

provide(AR_MARKER_AR_KEY, true)

const router = useRouter()
const transformStore = useContentTransformStore()

const ready = ref(false)
const loadError = ref<string | null>(null)
const sceneRef = useTemplateRef<HTMLElement>('scene')

/** 現在カメラに写っている（AR.js が検出中の）マーカー名 */
const visibleNames = ref<Set<string>>(new Set())

function markerNameFromEvent(event: Event): string | null {
  const target = event.target as HTMLElement | null
  return target?.dataset.markerName ?? null
}

function handleMarkerFound(event: Event) {
  const name = markerNameFromEvent(event)
  if (!name) return
  visibleNames.value = new Set(visibleNames.value).add(name)
}

function handleMarkerLost(event: Event) {
  const name = markerNameFromEvent(event)
  if (!name) return
  const next = new Set(visibleNames.value)
  next.delete(name)
  visibleNames.value = next
}

onMounted(async () => {
  try {
    await loadArjs()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'AR.js の読み込みに失敗しました'
    return
  }

  registerAutoSpin()
  registerGltfAnimation()
  registerAdditiveGlow()
  ready.value = true

  // a-scene は v-if でこの後に挿入されるため、イベントは次フレームで購読する
  requestAnimationFrame(() => {
    sceneRef.value?.addEventListener('markerFound', handleMarkerFound)
    sceneRef.value?.addEventListener('markerLost', handleMarkerLost)
  })
})

onBeforeUnmount(() => {
  sceneRef.value?.removeEventListener('markerFound', handleMarkerFound)
  sceneRef.value?.removeEventListener('markerLost', handleMarkerLost)
})

function goBack() {
  router.push({ name: 'start' })
}
</script>

<template>
  <div class="marker-ar">
    <a-scene
      v-if="ready"
      ref="scene"
      embedded
      arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono;"
      vr-mode-ui="enabled: false"
      renderer="colorManagement: true"
    >
      <a-entity camera></a-entity>

      <a-light type="directional" intensity="0.8" position="1 4 2"></a-light>
      <a-light type="ambient" intensity="0.7"></a-light>

      <component
        :is="CONTENT_COMPONENTS[marker.contentId]"
        v-for="marker in MARKER_AR_MARKERS"
        :key="marker.name"
        :marker-name="marker.name"
        :active="visibleNames.has(marker.name)"
        :transform="transformStore.get(marker.contentId)"
      />
    </a-scene>

    <div v-else-if="loadError" class="marker-ar__loading">{{ loadError }}</div>
    <div v-else class="marker-ar__loading">カメラを準備しています…</div>

    <header class="marker-ar__hud">
      <button class="marker-ar__back" type="button" @click="goBack">← メニュー</button>
      <p class="marker-ar__label">番号マーカー（01〜06）をかざしてください</p>
    </header>

    <TandemExplanation v-if="visibleNames.has('marker_05')" />
  </div>
</template>

<style scoped>
.marker-ar {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #000;
}

.marker-ar :deep(a-scene) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.marker-ar__loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #fff;
  font-size: 0.95rem;
  text-align: center;
}

.marker-ar__hud {
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

.marker-ar__back {
  pointer-events: auto;
  padding: 8px 14px;
  font-size: 0.9rem;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  border: 1px solid rgb(255 255 255 / 40%);
  border-radius: 999px;
  cursor: pointer;
}

.marker-ar__label {
  margin: 0;
  padding: 8px 16px;
  font-size: 0.85rem;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  border-radius: 999px;
}
</style>
