<script setup lang="ts">
/**
 * 各コンテンツ共通の入れ物。
 *
 * 階層は次の通り。自動回転をユーザー指定の向きと別の階層に分けることで、
 * rotation を指定したまま回転させても互いに干渉しない。
 *
 *   named-image-target        マーカー追従（開発用プレビュー時は素の a-entity）
 *     └ visible               タップされるまで隠す
 *         ├ position/rotation/scale   ← 調整パネルの対象
 *         │   └ auto-spin             ← Y 軸の自動回転
 *         │       └ slot（モデル本体）
 *         ├ a-text                    ラベル（倍率の影響を受けないよう外に置く）
 *         └ slot「hud」               解説パネルなど。モデルの位置調整の影響を受けない
 *                                     独立した層に置き、各 ContentsN.vue 側の定数で調整する
 *
 * slot には airframeVisible（エフェクトのみ表示の間は false）を渡す。
 * 各 ContentsN.vue が機体側 entity（additive-glow の無い物体）の visible に使う。
 *
 * ContentsN.vue は 8th Wall の画像ターゲット座標系（画像平面が XY、+Y が画像の上、
 * +Z が画像から外向き＝カメラ側）を前提に position/rotation/label/hud を調整している。
 */
import { computed, inject, ref } from 'vue'
import { AR_EFFECTS_ONLY_KEY, AR_PREVIEW_KEY } from '@/utils/arPreview'
import { type ContentTransform, toScaleAttr, toVec3Attr } from '@/utils/contentTransform'

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
/** エフェクトのみ表示中か（provide が無ければ常に false） */
const effectsOnly = inject(AR_EFFECTS_ONLY_KEY, ref(false))
/** 機体・エンジンなど物体 entity を表示してよいか */
const airframeVisible = computed(() => !effectsOnly.value)
const rootTag = isPreview ? 'a-entity' : 'xrextras-named-image-target'
const positionAttr = computed(() => toVec3Attr(props.transform.position))
const rotationAttr = computed(() => toVec3Attr(props.transform.rotation))
const scaleAttr = computed(() => toScaleAttr(props.transform.scale))
const autoSpinAttr = computed(() => `enabled: ${props.transform.autoRotate}; speed: 30`)

/**
 * a-text に font を指定しない場合、A-Frame（8frame）は既定フォント（roboto）を
 * https://cdn.aframe.io/fonts/Roboto-msdf.json から取得しようとするため、
 * CDN 依存を無くすために同じフォントファイル一式を public/scripts/vendor/aframe-fonts/ に
 * 置いてローカル参照する（取得元は public/scripts/vendor/README.md 参照）。
 */
const LABEL_FONT = `${import.meta.env.BASE_URL}scripts/vendor/aframe-fonts/Roboto-msdf.json`
</script>

<template>
  <component :is="rootTag" :name="isPreview ? undefined : markerName">
    <a-entity :visible="active ? 'true' : 'false'">
      <a-entity :position="positionAttr" :rotation="rotationAttr" :scale="scaleAttr">
        <a-entity :auto-spin="autoSpinAttr">
          <slot :airframe-visible="airframeVisible" />
        </a-entity>
      </a-entity>

      <a-text
        v-if="label"
        :value="label"
        :position="labelPosition ?? '0 0.7 0'"
        align="center"
        color="#ffffff"
        width="2.4"
        :font="LABEL_FONT"
      ></a-text>

      <slot name="hud" />
    </a-entity>
  </component>
</template>
