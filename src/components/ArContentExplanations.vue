<script setup lang="ts">
/**
 * コンテンツ番号ごとの解説パネル（HTML オーバーレイ）の出し分け。
 * CameraView（8th Wall）と MarkerArView（AR.js）で共通に使う。
 *
 * IntakeExplanation / TandemExplanation はマーカーが見えていれば（タップ前でも）出す。
 * TailRotorExplanation だけはタップ済み（activated）になってから出す
 * （8th Wall 版の元の挙動をそのまま踏襲）。
 *
 * 05（TandemExplanation）だけは例外: 番号マーカー画面（AR.js / MarkerArView）では
 * 顧客要望により HTML オーバーレイではなく AR 空間の Plane パネル
 * （Contents5.vue の ExplanationPanel3D、ArContent の hud スロット）を表示するため、
 * ここでは出さない。CameraView（8th Wall）側は今回変更しないため、そのまま表示する。
 */
import { inject } from 'vue'
import IntakeExplanation from '@/components/IntakeExplanation.vue'
import TandemExplanation from '@/components/TandemExplanation.vue'
import TailRotorExplanation from '@/components/TailRotorExplanation.vue'
import { AR_MARKER_AR_KEY } from '@/utils/arPreview'

defineProps<{
  contentId: number | null
  /** 対応するマーカーが現在カメラに見えているか */
  visible: boolean
  /** 対応するマーカーがタップ済み（コンテンツ表示許可済み）か */
  activated: boolean
  /** 調整パネルを開いている間は隠す */
  hidden: boolean
}>()

const isMarkerAr = inject(AR_MARKER_AR_KEY, false)
</script>

<template>
  <IntakeExplanation v-if="!hidden && contentId === 1 && visible" />
  <TandemExplanation v-if="!hidden && !isMarkerAr && contentId === 5 && visible" />
  <TailRotorExplanation v-if="!hidden && contentId === 6 && activated && visible" />
</template>
