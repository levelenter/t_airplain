<script setup lang="ts">
/**
 * AR空間に浮かぶ「解説パネル」。3Dモデル・グローとは別 entity として、
 * ArContent の hud スロット（コンテンツの位置・スケール調整の影響を受けない層）に置く想定。
 *
 * 見た目は canvas に描画した画像を a-plane のテクスチャとして貼ることで実現している
 * （A-Frame 標準テキストは日本語グリフ非対応のため）。位置・回転・スケールは呼び出し側の
 * 定数から渡し、マーカーごとに個別調整できるようにする。
 */
import { computed } from 'vue'
import { createExplanationPanelDataUrl, measurePanelSize } from '@/utils/panelTexture'
import { toVec3Attr, type Vec3 } from '@/utils/contentTransform'

/** measurePanelSize が使えない環境（jsdom 等）向けの概算アスペクト比（幅÷高さ） */
const FALLBACK_ASPECT = 2.55

const props = withDefaults(
  defineProps<{
    title: string
    subtitle: string
    body: string
    /** マーカー原点からのパネル位置（メートル） */
    position: Vec3
    /** パネルの向き（度） */
    rotation?: Vec3
    /** パネル平面の一辺の基準スケール（幅・高さはそのまま倍率がかかる） */
    scale?: number
    /** 板の実寸の幅（メートル）。高さは本文量から自動算出したアスペクト比で決まる */
    planeWidth?: number
    /** 高さを明示指定したい場合のみ渡す（未指定なら自動） */
    planeHeight?: number
    /** テクスチャ解像度・横幅（px） */
    textureWidth?: number
  }>(),
  {
    rotation: () => [0, 0, 0],
    scale: 1,
    planeWidth: 0.5,
    textureWidth: 1536,
  },
)

const textureOpts = computed(() => ({
  title: props.title,
  subtitle: props.subtitle,
  body: props.body,
  width: props.textureWidth,
}))

const dataUrl = computed(() => createExplanationPanelDataUrl(textureOpts.value))
const panelSize = computed(() => measurePanelSize(textureOpts.value))

const planeHeightAttr = computed(() => {
  if (props.planeHeight) return props.planeHeight
  const size = panelSize.value
  const aspect = size ? size.width / size.height : FALLBACK_ASPECT
  return props.planeWidth / aspect
})

const positionAttr = computed(() => toVec3Attr(props.position))
const rotationAttr = computed(() => toVec3Attr(props.rotation))
const scaleAttr = computed(() => `${props.scale} ${props.scale} ${props.scale}`)
const materialAttr = computed(() => {
  const src = dataUrl.value ? `src: url(${dataUrl.value}); ` : ''
  return `${src}shader: flat; transparent: true; side: double; alphaTest: 0.02`
})
</script>

<template>
  <a-entity class="explanation-panel-3d" :position="positionAttr" :rotation="rotationAttr" :scale="scaleAttr">
    <a-plane :width="planeWidth" :height="planeHeightAttr" :material="materialAttr"></a-plane>
  </a-entity>
</template>
