<script setup lang="ts">
/**
 * AR.js（pattern マーカー）版の AR 画面。
 *
 * 8th Wall（CameraView）とは認識エンジンが別（xrimagefound/xrimagelost ではなく
 * markerFound/markerLost）なだけで、体験（照準→タップで表示→解説パネル→調整パネル等）は
 * CameraView とそろえる。共有できる状態管理（useArStore）・UI（ArReticle/ArHudHeader/
 * ArContentExplanations/ArDebugPanel）・音（sound.ts）はそのまま再利用し、AR.js 固有なのは
 * a-scene の arjs/a-marker まわりの設定と markerFound/markerLost のイベント購読だけにする。
 */
import { computed, onBeforeUnmount, onMounted, provide, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import ArContentExplanations from '@/components/ArContentExplanations.vue'
import ArDebugPanel from '@/components/ArDebugPanel.vue'
import ArHudHeader from '@/components/ArHudHeader.vue'
import ArReticle from '@/components/ArReticle.vue'
import { useDebugMode } from '@/composables/useDebugMode'
import { useArStore } from '@/stores/ar'
import { useContentTransformStore } from '@/stores/contentTransform'
import { registerAdditiveGlow } from '@/utils/aframeAdditiveGlow'
import { registerAutoSpin } from '@/utils/aframeAutoSpin'
import { registerGltfAnimation } from '@/utils/aframeGltfAnimation'
import { AR_MARKER_AR_KEY } from '@/utils/arPreview'
import { setupArjsViewportFit } from '@/utils/arjsViewportFit'
import { loadArjs } from '@/utils/loadArjs'
import { MARKER_AR_MARKERS } from '@/utils/markerAr'
import { playFoundSound, playTapSound } from '@/utils/sound'
import { CONTENT_COMPONENTS } from './contentComponents'

provide(AR_MARKER_AR_KEY, true)

const router = useRouter()
const arStore = useArStore()
const transformStore = useContentTransformStore()
const isDebug = useDebugMode()

/** 調整パネルの表示状態（?debug=true のときだけ開ける） */
const panelOpen = ref(false)

const ready = ref(false)
const loadError = ref<string | null>(null)
const sceneRef = useTemplateRef<HTMLElement>('scene')
let disposeViewportFit: (() => void) | null = null

function markerNameFromEvent(event: Event): string | null {
  const target = event.target as HTMLElement | null
  return target?.dataset.markerName ?? null
}

function handleMarkerFound(event: Event) {
  const name = markerNameFromEvent(event)
  if (!name) return
  arStore.onImageFound(name)
  // sound.ts 側の REPLAY_GUARD_MS で連打を防いでいるため、CameraView と同じく無条件に呼ぶ
  playFoundSound()
}

function handleMarkerLost(event: Event) {
  const name = markerNameFromEvent(event)
  if (!name) return
  arStore.onImageLost(name)
}

onMounted(async () => {
  arStore.reset()
  arStore.setMarkerSource(MARKER_AR_MARKERS)

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
    if (sceneRef.value) disposeViewportFit = setupArjsViewportFit(sceneRef.value)
  })
})

onBeforeUnmount(() => {
  sceneRef.value?.removeEventListener('markerFound', handleMarkerFound)
  sceneRef.value?.removeEventListener('markerLost', handleMarkerLost)
  disposeViewportFit?.()
})

function goBack() {
  // デバッグ中はメニューへ戻ってもモードを維持する
  router.push({ name: 'start', query: isDebug.value ? { debug: 'true' } : {} })
}

/**
 * 照準の状態。CameraView と同じロジック。
 * - found: マーカーを認識してタップ待ち（強調して脈動させる）
 * - dim:   タップ済みでコンテンツ表示中（モデルの邪魔をしないよう薄くする）
 * - idle:  マーカーを探している最中
 */
const reticleState = computed<'idle' | 'found' | 'dim'>(() => {
  if (arStore.pendingMarker) return 'found'

  const marker = arStore.activeMarker
  if (marker && arStore.visibleMarkerNames.has(marker.name)) return 'dim'

  return 'idle'
})

/** タップ待ちのマーカーを確定表示に切り替える */
function handleTap() {
  const marker = arStore.pendingMarker
  if (!marker) return

  playTapSound()
  arStore.activate(marker.name)
}
</script>

<template>
  <div class="marker-ar">
    <!--
      ちらつき対策:
      - debugUIEnabled: false … デバッグ用キャンバスを出さない（描画負荷と視覚ノイズを減らす）
      - detectionMode: mono … pattern マーカーのみ使うため二値化のみで十分（matrix/NFT 不要）
      - renderer: antialias / logarithmicDepthBuffer … エッジのジャギーと、モデルとグロー（加算合成）
        の重なりで起きうる z-fighting 由来のちらつきを軽減する
      smooth 系や markerLost のヒステリシスは使わない。フレームの平均化・遅延はモデルの反応を
      遅らせ、実機ではむしろ3Dがマーカーの位置からずれて見える原因になる。
    -->
    <a-scene
      v-if="ready"
      ref="scene"
      embedded
      arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono;"
      vr-mode-ui="enabled: false"
      renderer="colorManagement: true; antialias: true; logarithmicDepthBuffer: true"
    >
      <a-entity camera></a-entity>

      <a-light type="directional" intensity="0.8" position="1 4 2"></a-light>
      <a-light type="ambient" intensity="0.7"></a-light>

      <component
        :is="CONTENT_COMPONENTS[marker.contentId]"
        v-for="marker in MARKER_AR_MARKERS"
        :key="marker.name"
        :marker-name="marker.name"
        :active="arStore.isActivated(marker.name)"
        :transform="transformStore.get(marker.contentId)"
      />
    </a-scene>

    <div v-else-if="loadError" class="marker-ar__loading">{{ loadError }}</div>
    <div v-else class="marker-ar__loading">カメラを準備しています…</div>

    <!-- 中央の照準。CameraView と同じ見た目・状態遷移 -->
    <ArReticle v-if="ready" :state="reticleState" />

    <!--
      タップ待ちの間だけ全面に敷く操作レイヤー。
      HUD（z-index:10）より下に置き、メニューボタンを覆わないようにする。
    -->
    <button
      v-if="arStore.pendingMarker"
      class="marker-ar__tap-layer"
      type="button"
      :aria-label="`${arStore.pendingMarker.title}を表示する`"
      @click="handleTap"
    ></button>

    <ArHudHeader
      :active-title="arStore.activeMarker?.title ?? null"
      hint-text="番号マーカー（01〜06）を探してかざしてください"
      :is-debug="isDebug"
      :panel-open="panelOpen"
      @back="goBack"
      @open-panel="panelOpen = true"
    />

    <ArContentExplanations
      :content-id="arStore.activeMarker?.contentId ?? null"
      :visible="!!arStore.activeMarker && arStore.visibleMarkerNames.has(arStore.activeMarker.name)"
      :activated="!!arStore.activeMarker && arStore.isActivated(arStore.activeMarker.name)"
      :hidden="panelOpen"
    />

    <!-- 配置調整パネル（?debug=true のときのみ）。対象は認識中のマーカーに追従する -->
    <ArDebugPanel
      :is-debug="isDebug"
      :panel-open="panelOpen"
      :active-marker="arStore.activeMarker"
      @close="panelOpen = false"
    />
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

/* 全面タップレイヤー。見た目は持たせず、当たり判定だけを担う */
.marker-ar__tap-layer {
  position: fixed;
  inset: 0;
  z-index: 5;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
