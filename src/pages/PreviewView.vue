<script setup lang="ts">
/**
 * 開発用プレビュー（PC のブラウザで動作）。
 *
 * AR から外した previewOnly のマーカーも含めて全コンテンツを確認できる。
 * カメラも 8th Wall（XR8）も使わず、A-Frame（8frame）だけでマーカー上の AR コンテンツを描画する。
 * マーカー画像を原点に置いた板として表示し、その上に実機と同じ Contents1〜7 を
 * 同じ配置値（content-transforms.json）で重ねるので、位置・向き・倍率の当たりを PC で付けられる。
 *
 * 座標系は 8th Wall の画像ターゲットに合わせている:
 *   原点 = 画像中心、X = 画像の横方向、Y = 画像の上方向、+Z = 画像の正面（見る側）。
 */
import { computed, onMounted, provide, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TransformPanel from '@/components/TransformPanel.vue'
import { useContentTransformStore } from '@/stores/contentTransform'
import { registerAdditiveGlow } from '@/utils/aframeAdditiveGlow'
import { registerAutoSpin } from '@/utils/aframeAutoSpin'
import { registerGltfAnimation } from '@/utils/aframeGltfAnimation'
import { registerOrbitCamera } from '@/utils/aframeOrbitCamera'
import {
  AR_PREVIEW_KEY,
  type ImageTargetMeta,
  loadImageTargetMeta,
  markerPlaneSize,
} from '@/utils/arPreview'
import { MARKERS } from '@/utils/markers'
import { CONTENT_COMPONENTS } from './contentComponents'

provide(AR_PREVIEW_KEY, true)

const router = useRouter()
const transformStore = useContentTransformStore()

/** 表示中のマーカー */
const selectedName = ref(MARKERS[0]!.name)
const selectedMarker = computed(() => MARKERS.find((m) => m.name === selectedName.value) ?? MARKERS[0]!)

/** マーカー画像の板を出すか（モデルだけを見たいときに消せる） */
const showMarker = ref(true)
const panelOpen = ref(true)

/** A-Frame のカスタムコンポーネント登録が済んでからシーンを出す */
const ready = ref(false)
/** インクリメントするとカメラを作り直して初期視点に戻す */
const cameraKey = ref(0)

const meta = ref<ImageTargetMeta | null>(null)

const markerImageUrl = computed(() => {
  const file = meta.value?.resources.croppedImage
  return file ? `${import.meta.env.BASE_URL}image-targets/${file}` : ''
})
const markerPlane = computed(() => (meta.value ? markerPlaneSize(meta.value) : { width: 0.75, height: 1 }))

async function loadMeta(name: string) {
  meta.value = null
  const loaded = await loadImageTargetMeta(name)
  // 読み込み中に別のマーカーへ切り替えられていたら捨てる
  if (selectedName.value === name) meta.value = loaded
}

watch(selectedName, loadMeta, { immediate: true })

onMounted(() => {
  registerAutoSpin()
  registerGltfAnimation()
  registerAdditiveGlow()
  registerOrbitCamera()
  ready.value = true
})

function goBack() {
  router.push({ name: 'start' })
}
</script>

<template>
  <div class="preview">
    <a-scene
      v-if="ready"
      embedded
      background="color: #1a2230"
      renderer="colorManagement: true"
      vr-mode-ui="enabled: false"
      xr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
    >
      <a-entity :key="cameraKey" camera orbit-camera="distance: 2; yaw: 0; pitch: 15"></a-entity>

      <a-light type="directional" intensity="0.8" position="1 4 2"></a-light>
      <a-light type="ambient" intensity="0.7"></a-light>

      <!-- マーカー画像。実機で認識される画像ターゲットと同じ向き（XY 平面・+Z が正面）に置く -->
      <a-image
        v-if="showMarker && markerImageUrl"
        :src="markerImageUrl"
        :width="markerPlane.width"
        :height="markerPlane.height"
        position="0 0 -0.001"
        side="double"
      ></a-image>
      <a-plane
        v-else-if="showMarker"
        :width="markerPlane.width"
        :height="markerPlane.height"
        position="0 0 -0.001"
        color="#3a4658"
        side="double"
      ></a-plane>

      <!-- 実機と同じコンテンツコンポーネント。タップ済み（active）の状態で表示する -->
      <component
        :is="CONTENT_COMPONENTS[selectedMarker.contentId]"
        :key="selectedMarker.name"
        :marker-name="selectedMarker.name"
        :active="true"
        :transform="transformStore.get(selectedMarker.contentId)"
      />
    </a-scene>

    <div v-else class="preview__loading">プレビューを準備しています…</div>

    <header class="preview__hud">
      <button class="preview__back" type="button" @click="goBack">← メニュー</button>

      <label class="preview__field">
        <span>マーカー</span>
        <select v-model="selectedName">
          <option v-for="marker in MARKERS" :key="marker.name" :value="marker.name">
            {{ marker.contentId }}. {{ marker.title }}{{ marker.previewOnly ? '（プレビューのみ）' : '' }}
          </option>
        </select>
      </label>

      <label class="preview__check">
        <input v-model="showMarker" type="checkbox">
        マーカー画像
      </label>

      <button class="preview__button" type="button" @click="cameraKey++">視点リセット</button>
      <button v-if="!panelOpen" class="preview__button" type="button" @click="panelOpen = true">調整</button>
    </header>

    <p class="preview__help">ドラッグで回転 / ホイールで拡大縮小</p>

    <TransformPanel
      v-if="panelOpen"
      :content-id="selectedMarker.contentId"
      :title="selectedMarker.title"
      dock="right"
      @close="panelOpen = false"
    />
  </div>
</template>

<style scoped>
.preview {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #1a2230;
}

/* embedded の a-scene は inline 要素扱いになるため、全面に広げる */
.preview :deep(a-scene) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.preview__loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.95rem;
}

.preview__hud {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px;
  color: #fff;
  font-size: 0.85rem;
  pointer-events: none;
}

.preview__hud > * {
  pointer-events: auto;
}

.preview__back,
.preview__button {
  padding: 8px 14px;
  font-size: 0.85rem;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  border: 1px solid rgb(255 255 255 / 40%);
  border-radius: 999px;
  cursor: pointer;
}

.preview__field {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgb(0 0 0 / 55%);
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: 999px;
}

.preview__field select {
  max-width: 60vw;
  padding: 4px 6px;
  color: #fff;
  font-size: 0.85rem;
  background: rgb(255 255 255 / 10%);
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: 6px;
}

.preview__field select option {
  color: #0b1e3f;
}

.preview__check {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgb(0 0 0 / 55%);
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: 999px;
  accent-color: #ffd54f;
  cursor: pointer;
}

.preview__help {
  position: fixed;
  z-index: 10;
  bottom: 12px;
  left: 12px;
  margin: 0;
  font-size: 0.75rem;
  color: rgb(255 255 255 / 65%);
  pointer-events: none;
}
</style>
