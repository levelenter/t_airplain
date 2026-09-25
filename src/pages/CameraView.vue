<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import ArContentExplanations from '@/components/ArContentExplanations.vue'
import ArDebugPanel from '@/components/ArDebugPanel.vue'
import ArHudHeader from '@/components/ArHudHeader.vue'
import ArReticle from '@/components/ArReticle.vue'
import { useDebugMode } from '@/composables/useDebugMode'
import { useArStore } from '@/stores/ar'
import { useContentTransformStore } from '@/stores/contentTransform'
import { registerAutoSpin } from '@/utils/aframeAutoSpin'
import { registerGltfAnimation } from '@/utils/aframeGltfAnimation'
import { registerAdditiveGlow } from '@/utils/aframeAdditiveGlow'
import { localize8thWallUi } from '@/utils/localize8thWallUi'
import { AR_MARKERS } from '@/utils/markers'
import { playFoundSound, playTapSound } from '@/utils/sound'
import { configureImageTargets, stopXR8 } from '@/utils/xr8'
import { CONTENT_COMPONENTS } from './contentComponents'

const router = useRouter()
const arStore = useArStore()
const transformStore = useContentTransformStore()
const isDebug = useDebugMode()

/** 調整パネルの表示状態（?debug=true のときだけ開ける） */
const panelOpen = ref(false)

/** XR8 のロードと画像ターゲット登録が済んでからシーンをマウントする */
const ready = ref(false)
const sceneRef = useTemplateRef<HTMLElement>('scene')

interface ImageTargetEventDetail {
  name: string
}

function handleImageFound(event: Event) {
  arStore.onImageFound((event as CustomEvent<ImageTargetEventDetail>).detail.name)
  playFoundSound()
}

function handleImageLost(event: Event) {
  arStore.onImageLost((event as CustomEvent<ImageTargetEventDetail>).detail.name)
}

/**
 * 非対応端末向け QR 画面の設定。a-scene 生成前に実行すること。
 *
 * A-Frame はプロパティ値が空文字のときスキーマの default に差し戻す仕様のため、
 * landing-page="promptSuffix: " や setAttribute(..., '') では空にできない。
 * そこでスキーマの default 自体を書き換える。
 */
function configureLandingPage() {
  const schema = window.AFRAME?.components?.['landing-page']?.schema
  if (!schema) return

  // 末尾に出る "to continue" を消す
  if (schema.promptSuffix) {
    schema.promptSuffix.default = ''
  }

  // QR のリンク先。未指定だと現在の URL（/camera）になるため、
  // いま開いているホストのトップ（/ar/）を指すよう実行時に組み立てる
  if (schema.url) {
    schema.url.default = `${window.location.origin}${import.meta.env.BASE_URL}`
  }
}

/** 8th Wall の英語 UI 日本語化を止める関数（onMounted で受け取る） */
let stopLocalize: (() => void) | null = null

onMounted(async () => {
  arStore.reset()
  // 番号マーカー画面（/marker-ar）から遷移してきた場合に備え、マーカー定義を画像マーカーに戻す
  arStore.setMarkerSource(AR_MARKERS)
  // 許可ダイアログより先に監視を始める
  stopLocalize = localize8thWallUi()
  arStore.loadedMarkerNames = await configureImageTargets(AR_MARKERS.map((m) => m.name))

  configureLandingPage()
  // 自動回転コンポーネントは a-scene 生成前に登録しておく必要がある
  registerAutoSpin()
  registerGltfAnimation()
  registerAdditiveGlow()
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
  stopLocalize?.()
  stopXR8()
})

function goBack() {
  // デバッグ中はメニューへ戻ってもモードを維持する
  router.push({ name: 'start', query: isDebug.value ? { debug: 'true' } : {} })
}

/**
 * 照準の状態。
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
  <div class="camera">
    <!--
      xrweb: 6DoF ワールドトラッキング（SLAM）+ Image Targets を有効化する 8th Wall コンポーネント。
      disableWorldTracking を指定しない（= SLAM 有効）ことで 6DoF になる。
    -->
    <a-scene
      v-if="ready"
      ref="scene"
      xrweb
      landing-page="promptPrefix: QRをスキャンしてスマートフォンなどで表示してください"
      xrextras-loading
      xrextras-runtime-error
      xrextras-gesture-detector
      renderer="colorManagement: true"
    >
      <a-camera position="0 2 2" raycaster="objects: .cantap" cursor="fuse: false; rayOrigin: mouse;"></a-camera>

      <a-light type="directional" intensity="0.8" position="1 4 2"></a-light>
      <a-light type="ambient" intensity="0.7"></a-light>

      <component
        :is="CONTENT_COMPONENTS[marker.contentId]"
        v-for="marker in AR_MARKERS"
        :key="marker.name"
        :marker-name="marker.name"
        :active="arStore.isActivated(marker.name)"
        :transform="transformStore.get(marker.contentId)"
      />
    </a-scene>

    <div v-else class="camera__loading">カメラを準備しています…</div>

    <!-- 中央の照準。カメラ映像を隠さないよう細線＋部分的なブラケットのみで構成する -->
    <ArReticle v-if="ready" :state="reticleState" />

    <!--
      タップ待ちの間だけ全面に敷く操作レイヤー。
      HUD（z-index:10）より下に置き、メニューボタンを覆わないようにする。
    -->
    <button
      v-if="arStore.pendingMarker"
      class="camera__tap-layer"
      type="button"
      :aria-label="`${arStore.pendingMarker.title}を表示する`"
      @click="handleTap"
    ></button>

    <!-- HTML オーバーレイ（HUD）: A-Frame のテキストは日本語グリフ非対応のため、日本語表示はここで行う -->
    <ArHudHeader
      :active-title="arStore.activeMarker?.title ?? null"
      hint-text="画像マーカーを探してかざしてください"
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

/* 全面タップレイヤー。見た目は持たせず、当たり判定だけを担う */
.camera__tap-layer {
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
