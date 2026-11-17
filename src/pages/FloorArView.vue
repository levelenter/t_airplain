<script setup lang="ts">
/**
 * C-1輸送機の床面配置 AR。
 *
 * 8th Wall の xrweb（ワールドトラッキング / SLAM）で床（y=0）を捉え、
 * 画面中央の視線が床と交わる位置に配置マーカーを出す。タップするとそこへ C-1 を置く。
 * 画像ターゲットは使わない。配置後は 1 本指ドラッグで回転・ピンチで拡大縮小できる。
 */
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import ArHudHeader from '@/components/ArHudHeader.vue'
import RotateDevicePrompt from '@/components/RotateDevicePrompt.vue'
import { useDebugMode } from '@/composables/useDebugMode'
import {
  FLOOR_MARKER_COMPONENT,
  registerFloorPlacementMarker,
  type FloorPlacementMarkerState,
} from '@/utils/aframeFloorPlacement'
import {
  FLOOR_C1_MODEL_OFFSET,
  FLOOR_C1_SCALE,
  FLOOR_PINCH_MAX_SCALE,
  FLOOR_PINCH_MIN_SCALE,
  radToDeg,
  sideViewYaw,
} from '@/utils/floorPlacement'
import { localize8thWallUi } from '@/utils/localize8thWallUi'
import { playTapSound } from '@/utils/sound'
import { configureImageTargets, stopXR8 } from '@/utils/xr8'

const HINT_TEXT = '床にカメラを向けて、タップして C-1 を置きます'
const PLACED_TITLE = 'C-1輸送機（床面配置）'

const router = useRouter()
const isDebug = useDebugMode()

/** XR8 のロードが済んでからシーンをマウントする */
const ready = ref(false)
const markerRef = useTemplateRef<HTMLElement>('marker')

interface Placement {
  x: number
  z: number
  /** Y 軸回転（度） */
  yawDeg: number
}

/** 置いた位置と向き。null の間は配置前 */
const placement = ref<Placement | null>(null)

/** 配置のたびに増やし、モデル entity を作り直してスケール・回転を初期値に戻す */
const placementCount = ref(0)

const modelUrl = `${import.meta.env.BASE_URL}3dmodels/model4_C1_set.glb`
const modelOffsetAttr = `${FLOOR_C1_MODEL_OFFSET.x} ${FLOOR_C1_MODEL_OFFSET.y} ${FLOOR_C1_MODEL_OFFSET.z}`
const modelScaleAttr = `${FLOOR_C1_SCALE} ${FLOOR_C1_SCALE} ${FLOOR_C1_SCALE}`

const placedPositionAttr = computed(() => (placement.value ? `${placement.value.x} 0 ${placement.value.z}` : '0 0 0'))
const placedRotationAttr = computed(() => `0 ${placement.value?.yawDeg ?? 0} 0`)

/** 非対応端末向け QR 画面の設定（CameraView と同じ処理）。a-scene 生成前に実行すること */
function configureLandingPage() {
  const schema = window.AFRAME?.components?.['landing-page']?.schema
  if (!schema) return

  // 末尾に出る "to continue" を消す
  if (schema.promptSuffix) {
    schema.promptSuffix.default = ''
  }

  // QR のリンク先は、いま開いているホストのトップ（/ar/）にする
  if (schema.url) {
    schema.url.default = `${window.location.origin}${import.meta.env.BASE_URL}`
  }
}

/** 8th Wall の英語 UI 日本語化を止める関数（onMounted で受け取る） */
let stopLocalize: (() => void) | null = null

onMounted(async () => {
  // 許可ダイアログより先に監視を始める
  stopLocalize = localize8thWallUi()
  // 前の画面（マーカー AR）の画像ターゲット設定が残らないよう空にする
  await configureImageTargets([])

  configureLandingPage()
  // コンポーネントは a-scene 生成前に登録しておく必要がある
  registerFloorPlacementMarker()
  ready.value = true
})

onBeforeUnmount(() => {
  stopLocalize?.()
  stopXR8()
})

function goBack() {
  // デバッグ中はメニューへ戻ってもモードを維持する
  router.push({ name: 'start', query: isDebug.value ? { debug: 'true' } : {} })
}

/** 配置マーカーの現在位置へ C-1 を置く。マーカーが非表示（交点なし）のときは何もしない */
function handlePlace() {
  const state = (markerRef.value as unknown as { components?: Record<string, FloorPlacementMarkerState> } | null)
    ?.components?.[FLOOR_MARKER_COMPONENT]
  const target = state?.target
  if (!target) return

  playTapSound()
  placement.value = {
    x: target.x,
    z: target.z,
    yawDeg: radToDeg(sideViewYaw(target.camera, target)),
  }
  placementCount.value += 1
}

/** 置き直す: 配置前に戻す（モデルは破棄されるので、スケール・回転も初期値に戻る） */
function handleReplace() {
  placement.value = null
}
</script>

<template>
  <div class="floor">
    <!-- xrweb: 6DoF ワールドトラッキング（SLAM）。画像ターゲットは使わない -->
    <a-scene
      v-if="ready"
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

      <!-- 配置前: 視線と床の交点に追従する配置マーカー（床に寝かせたリング） -->
      <a-entity v-if="!placement" ref="marker" floor-placement-marker>
        <a-ring
          rotation="-90 0 0"
          radius-inner="0.35"
          radius-outer="0.45"
          material="shader: flat; color: #ffd54f; opacity: 0.9; transparent: true; side: double"
        ></a-ring>
        <a-ring
          rotation="-90 0 0"
          radius-inner="0"
          radius-outer="0.08"
          material="shader: flat; color: #ffd54f; opacity: 0.9; transparent: true; side: double"
        ></a-ring>
      </a-entity>

      <!--
        配置後: 外側が位置・Y 回転・拡大縮小（ジェスチャーの対象）、内側がモデルの接地・中心合わせのオフセット。
        pinch-scale の scale は初期スケール（一様）。倍率は初期値の 0.1〜10 倍に制限される（min / max は初期スケールへの倍率）。
      -->
      <a-entity
        v-if="placement"
        :key="placementCount"
        :position="placedPositionAttr"
        :rotation="placedRotationAttr"
        :scale="modelScaleAttr"
        xrextras-one-finger-rotate
        :xrextras-pinch-scale="`scale: ${FLOOR_C1_SCALE}; min: ${FLOOR_PINCH_MIN_SCALE}; max: ${FLOOR_PINCH_MAX_SCALE}`"
      >
        <a-entity :position="modelOffsetAttr" :gltf-model="`url(${modelUrl})`"></a-entity>
      </a-entity>
    </a-scene>

    <div v-else class="floor__loading">カメラを準備しています…</div>

    <!--
      配置前だけ全面に敷く操作レイヤー（CameraView のタップレイヤーと同じ方式）。
      HUD（z-index:10）より下に置き、メニューボタンを覆わない。
    -->
    <button
      v-if="ready && !placement"
      class="floor__tap-layer"
      type="button"
      aria-label="C-1輸送機を床に置く"
      @click="handlePlace"
    ></button>

    <!-- HTML オーバーレイ（HUD）。C-1 にエフェクトは無いので「エフェクトのみ」トグルは出さない -->
    <ArHudHeader
      :active-title="placement ? PLACED_TITLE : null"
      :effects-only="false"
      :show-effects-toggle="false"
      :hint-text="HINT_TEXT"
      :is-debug="false"
      :panel-open="false"
      @back="goBack"
    />

    <button v-if="placement" class="floor__replace" type="button" @click="handleReplace">置き直す</button>

    <!-- 横向きモードで端末が縦向きのときの案内（HUD より上） -->
    <RotateDevicePrompt />
  </div>
</template>

<style scoped>
.floor {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #000;
}

.floor__loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.95rem;
}

/* 全面タップレイヤー。見た目は持たせず、当たり判定だけを担う */
.floor__tap-layer {
  position: fixed;
  inset: 0;
  z-index: 5;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* 配置後に画面下部へ出す「置き直す」ボタン。セーフエリアを避けて中央に置く */
.floor__replace {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
  z-index: 10;
  transform: translateX(-50%);
  padding: 10px 24px;
  font-size: 0.95rem;
  font-weight: bold;
  color: #0b1e3f;
  background: rgb(255 213 79 / 92%);
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

/* 横向きモード: 高さが低いので下余白を詰め、左右のセーフエリア（ノッチ）の内側に収める。
   HUD は上端に固定されており、ボタンは下端なので重ならない */
html[data-layout='landscape'] .floor__replace {
  bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
  padding: 8px 20px;
  font-size: 0.85rem;
  max-width: calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 24px);
}
</style>
