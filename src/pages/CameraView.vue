<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import TransformPanel from '@/components/TransformPanel.vue'
import { useDebugMode } from '@/composables/useDebugMode'
import { useArStore } from '@/stores/ar'
import { useContentTransformStore } from '@/stores/contentTransform'
import { registerAutoSpin } from '@/utils/aframeAutoSpin'
import { MARKERS } from '@/utils/markers'
import { playFoundSound, playTapSound } from '@/utils/sound'
import { configureImageTargets, stopXR8 } from '@/utils/xr8'
import Contents1 from './Contents1.vue'
import Contents2 from './Contents2.vue'
import Contents3 from './Contents3.vue'
import Contents4 from './Contents4.vue'
import Contents5 from './Contents5.vue'

const CONTENTS = { 1: Contents1, 2: Contents2, 3: Contents3, 4: Contents4, 5: Contents5 } as const

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
 * 非対応端末向け QR 画面の末尾に出る "to continue" を消す。
 *
 * A-Frame はプロパティ値が空文字のときスキーマの default に差し戻す仕様のため、
 * landing-page="promptSuffix: " や setAttribute(..., '') では空にできない。
 * そこでスキーマの default 自体を空文字に書き換える（a-scene 生成前に実行すること）。
 */
function clearLandingPagePromptSuffix() {
  const schema = window.AFRAME?.components?.['landing-page']?.schema
  if (schema?.promptSuffix) {
    schema.promptSuffix.default = ''
  }
}

onMounted(async () => {
  arStore.reset()
  arStore.loadedMarkerNames = await configureImageTargets(MARKERS.map((m) => m.name))

  clearLandingPagePromptSuffix()
  // 自動回転コンポーネントは a-scene 生成前に登録しておく必要がある
  registerAutoSpin()
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
        :is="CONTENTS[marker.contentId]"
        v-for="marker in MARKERS"
        :key="marker.name"
        :marker-name="marker.name"
        :active="arStore.isActivated(marker.name)"
        :transform="transformStore.get(marker.contentId)"
      />
    </a-scene>

    <div v-else class="camera__loading">カメラを準備しています…</div>

    <!-- 中央の照準。カメラ映像を隠さないよう細線＋部分的なブラケットのみで構成する -->
    <div v-if="ready" class="reticle" :class="`reticle--${reticleState}`" aria-hidden="true">
      <div class="reticle__scope">
        <span class="reticle__pulse"></span>
        <span class="reticle__pulse reticle__pulse--delayed"></span>

        <svg class="reticle__frame" viewBox="0 0 120 120">
          <g class="reticle__brackets">
            <path d="M14 40 V22 A8 8 0 0 1 22 14 H40" />
            <path d="M80 14 H98 A8 8 0 0 1 106 22 V40" />
            <path d="M106 80 V98 A8 8 0 0 1 98 106 H80" />
            <path d="M40 106 H22 A8 8 0 0 1 14 98 V80" />
          </g>
          <circle class="reticle__dot" cx="60" cy="60" r="2" />
        </svg>

        <p class="reticle__prompt">タップして表示</p>
      </div>
    </div>

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
    <header class="camera__hud">
      <button class="camera__back" type="button" @click="goBack">← メニュー</button>
      <p v-if="arStore.activeMarker" class="camera__label">{{ arStore.activeMarker.title }}</p>
      <p v-else class="camera__label camera__label--hint">画像マーカーを探してかざしてください</p>

      <button
        v-if="isDebug && !panelOpen"
        class="camera__debug-open"
        type="button"
        @click="panelOpen = true"
      >
        調整
      </button>
    </header>

    <!-- 配置調整パネル（?debug=true のときのみ）。対象は認識中のマーカーに追従する -->
    <TransformPanel
      v-if="isDebug && panelOpen && arStore.activeMarker"
      :content-id="arStore.activeMarker.contentId"
      :title="arStore.activeMarker.title"
      @close="panelOpen = false"
    />
    <p v-else-if="isDebug && panelOpen" class="camera__debug-hint">
      調整するマーカーを認識させてください
      <button type="button" @click="panelOpen = false">×</button>
    </p>
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

/* デバッグ時のみ HUD に出る調整パネルの開閉ボタン */
.camera__debug-open {
  pointer-events: auto;
  margin-left: auto;
  padding: 8px 14px;
  font-size: 0.8rem;
  color: #0b1e3f;
  font-weight: bold;
  background: rgb(255 255 255 / 85%);
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

.camera__debug-hint {
  position: fixed;
  z-index: 20;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
  left: 50%;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  font-size: 0.78rem;
  color: #fff;
  transform: translateX(-50%);
  white-space: nowrap;
  background: rgb(10 14 20 / 72%);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.camera__debug-hint button {
  width: 24px;
  height: 24px;
  padding: 0;
  color: #fff;
  background: rgb(255 255 255 / 12%);
  border: none;
  border-radius: 6px;
  cursor: pointer;
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

/* ---- 中央の照準 ---- */

.reticle {
  position: fixed;
  inset: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  pointer-events: none;
  transition:
    color 0.25s ease,
    opacity 0.25s ease;
}

.reticle__scope {
  position: relative;
  width: min(52vw, 240px);
  aspect-ratio: 1;
}

.reticle__frame {
  display: block;
  width: 100%;
  height: 100%;
  /* 明るい被写体でも輪郭が沈まないよう、薄い影で縁取る */
  filter: drop-shadow(0 0 3px rgb(0 0 0 / 55%));
  transition: transform 0.35s ease;
}

.reticle__brackets path {
  fill: none;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
}

.reticle__dot {
  fill: currentcolor;
}

/* 認識時に外側へ広がる波紋。2 本を時間差で出して「反応した」ことを伝える */
.reticle__pulse {
  position: absolute;
  inset: 6%;
  border: 1.5px solid currentcolor;
  border-radius: 50%;
  opacity: 0;
}

/* マーカーを探している間：主張しすぎないよう控えめに */
.reticle--idle {
  opacity: 0.5;
}

/* 認識してタップ待ち：アクセント色にして少し内側へ寄せる */
.reticle--found {
  color: #ffd54f;
  opacity: 1;
}

.reticle--found .reticle__frame {
  transform: scale(0.94);
  animation: reticle-frame-breathe 1.6s ease-in-out infinite;
}

.reticle--found .reticle__pulse {
  animation: reticle-pulse 1.8s ease-out infinite;
}

.reticle--found .reticle__pulse--delayed {
  animation-delay: 0.9s;
}

/* コンテンツ表示中：モデルを見せたいので照準はほぼ消す */
.reticle--dim {
  opacity: 0.16;
}

.reticle__prompt {
  position: absolute;
  top: calc(100% + 18px);
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 8px 18px;
  font-size: 0.9rem;
  font-weight: bold;
  color: #0b1e3f;
  white-space: nowrap;
  background: rgb(255 213 79 / 92%);
  border-radius: 999px;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.reticle--found .reticle__prompt {
  opacity: 1;
  animation: reticle-prompt-breathe 1.6s ease-in-out infinite;
}

/* frame と prompt は基準の transform が異なるため、keyframes を分けて上書き事故を防ぐ */
@keyframes reticle-frame-breathe {
  0%,
  100% {
    transform: scale(0.94);
  }

  50% {
    transform: scale(0.9);
  }
}

@keyframes reticle-prompt-breathe {
  0%,
  100% {
    transform: translateX(-50%) scale(1);
  }

  50% {
    transform: translateX(-50%) scale(1.04);
  }
}

@keyframes reticle-pulse {
  0% {
    opacity: 0.55;
    transform: scale(0.86);
  }

  100% {
    opacity: 0;
    transform: scale(1.3);
  }
}

/* 動きに敏感な利用者向けにアニメーションを止める */
@media (prefers-reduced-motion: reduce) {
  .reticle__frame,
  .reticle__pulse,
  .reticle__prompt {
    animation: none !important;
  }
}
</style>
