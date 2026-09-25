<script setup lang="ts">
/**
 * 各コンテンツ共通の入れ物。
 *
 * 階層は次の通り。自動回転をユーザー指定の向きと別の階層に分けることで、
 * rotation を指定したまま回転させても互いに干渉しない。
 *
 *   named-image-target        マーカー追従（開発用プレビュー時は素の a-entity、
 *                             AR.js 画面では a-marker[type=pattern]）
 *     └ visible               タップされるまで隠す
 *         └ axis-correction   AR.js 画面でだけ rotation="-90 0 0"（8th Wall/プレビューでは無回転）
 *             ├ position/rotation/scale   ← 調整パネルの対象
 *             │   └ auto-spin             ← Y 軸の自動回転
 *             │       └ slot（モデル本体）
 *             ├ a-text                    ラベル（倍率の影響を受けないよう外に置く）
 *             └ slot「hud」               解説パネルなど。モデルの位置調整の影響を受けない
 *                                         独立した層に置き、各 ContentsN.vue 側の定数で調整する
 *
 * axis-correction（AR.js 版だけ rotation="-90 0 0"）について:
 * ContentsN.vue は 8th Wall の画像ターゲット座標系（画像平面が XY、+Y が画像の上、
 * +Z が画像から外向き＝カメラ側）を前提に position/rotation/label/hud を調整している。
 * 一方 AR.js の <a-marker> 直下の座標系は、マーカー平面が XZ、+Y がマーカーから外向き
 * （ARToolKit の modelViewMatrix に AR.js が内部で rotateX(+90°) を掛けて得られる軸）になる。
 * このずれを吸収するため、AR.js 画面でだけ内側を rotation="-90 0 0" で包む。
 * X 軸 -90° 回転はコンテンツの +Y（画像の上）→ マーカー座標の -Z、
 * コンテンツの +Z（画像から外向き）→ マーカー座標の +Y（マーカーから外向き）に写す。
 * 結果として、壁に垂直に貼ったマーカーでも機体は正立し、+Y が壁の外向き（手前）を向く。
 */
import { computed, inject } from 'vue'
import { AR_MARKER_AR_KEY, AR_PREVIEW_KEY } from '@/utils/arPreview'
import { type ContentTransform, toScaleAttr, toVec3Attr } from '@/utils/contentTransform'
import { markerArPatternUrl } from '@/utils/markerAr'

const props = defineProps<{
  markerName: string
  /** タップ済みで表示してよいか */
  active: boolean
  transform: ContentTransform
  /** モデル上に出す英字ラベル（A-Frame のフォントは日本語グリフ非対応） */
  label: string
  /** ラベルの位置（"x y z"）。モデルに隠れる場合に各 ContentsN.vue から前に出す */
  labelPosition?: string
}>()

/**
 * 開発用プレビュー（PreviewView）では XR8 が動いていないため、
 * マーカー追従の要素を素の a-entity に差し替えて原点に固定表示する。
 */
const isPreview = inject(AR_PREVIEW_KEY, false)
const isMarkerAr = inject(AR_MARKER_AR_KEY, false)
const rootTag = computed(() => {
  if (isMarkerAr) return 'a-marker'
  return isPreview ? 'a-entity' : 'xrextras-named-image-target'
})
/**
 * AR.js の pattern マーカー用属性。patternRatio は marker_0N.patt 生成時の実測値（0.5）と
 * 一致するデフォルトのまま使う（arjs システム側の既定値、ここでは指定しない）。
 * data-marker-name は MarkerArView が markerFound/markerLost イベント（a-scene まで bubble する）
 * から、どのマーカーが動いたかを判定するために使う。
 *
 * smooth（smooth-count/smooth-tolerance/smooth-threshold）は使わない。直近フレームの変換行列を
 * 平均化する分だけ反映が遅れ、実機ではカメラや端末が動くたびに3Dがマーカーの位置から
 * 目に見えてずれる。ちらつき対策は a-scene 側の renderer（antialias/logarithmicDepthBuffer）で
 * 十分なため、ここでは生の変換行列をそのまま使う。
 */
const markerArAttrs = computed(() =>
  isMarkerAr
    ? {
        type: 'pattern',
        url: markerArPatternUrl(props.markerName),
        'data-marker-name': props.markerName,
      }
    : {},
)

const positionAttr = computed(() => toVec3Attr(props.transform.position))
const rotationAttr = computed(() => toVec3Attr(props.transform.rotation))
const scaleAttr = computed(() => toScaleAttr(props.transform.scale))
const autoSpinAttr = computed(() => `enabled: ${props.transform.autoRotate}; speed: 30`)

/** AR.js 画面（a-marker 座標系）でだけ軸のずれを補正する。8th Wall/プレビューでは無回転 */
const axisCorrectionAttr = computed(() => (isMarkerAr ? '-90 0 0' : '0 0 0'))
</script>

<template>
  <component
    :is="rootTag"
    :name="!isPreview && !isMarkerAr ? markerName : undefined"
    v-bind="markerArAttrs"
  >
    <a-entity :visible="active ? 'true' : 'false'">
      <a-entity :rotation="axisCorrectionAttr">
        <a-entity :position="positionAttr" :rotation="rotationAttr" :scale="scaleAttr">
          <a-entity :auto-spin="autoSpinAttr">
            <slot />
          </a-entity>
        </a-entity>

        <a-text
          v-if="label"
          :value="label"
          :position="labelPosition ?? '0 0.7 0'"
          align="center"
          color="#ffffff"
          width="2.4"
        ></a-text>

        <slot name="hud" />
      </a-entity>
    </a-entity>
  </component>
</template>
