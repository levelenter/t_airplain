<script setup lang="ts">
/**
 * コンテンツ番号ごとの解説パネル（HTML オーバーレイ）の出し分け。
 * CameraView（8th Wall）と MarkerArView（AR.js）で共通に使う。
 *
 * IntakeExplanation / TandemExplanation はマーカーが見えていれば（タップ前でも）出す。
 * TailRotorExplanation だけはタップ済み（activated）になってから出す
 * （8th Wall 版の元の挙動をそのまま踏襲）。
 */
import IntakeExplanation from '@/components/IntakeExplanation.vue'
import TandemExplanation from '@/components/TandemExplanation.vue'
import TailRotorExplanation from '@/components/TailRotorExplanation.vue'

defineProps<{
  contentId: number | null
  /** 対応するマーカーが現在カメラに見えているか */
  visible: boolean
  /** 対応するマーカーがタップ済み（コンテンツ表示許可済み）か */
  activated: boolean
  /** 調整パネルを開いている間は隠す */
  hidden: boolean
}>()
</script>

<template>
  <IntakeExplanation v-if="!hidden && contentId === 1 && visible" />
  <TandemExplanation v-if="!hidden && contentId === 5 && visible" />
  <TailRotorExplanation v-if="!hidden && contentId === 6 && activated && visible" />
</template>
