<script setup lang="ts">
/**
 * ?debug=true のときだけ出る配置調整パネル（TransformPanel）の出し分け。
 * 認識中のマーカーに合わせて対象を切り替え、未認識時はヒントを出す。
 * CameraView（8th Wall）と MarkerArView（AR.js）で共通に使う。
 */
import TransformPanel from '@/components/TransformPanel.vue'
import type { ContentId } from '@/utils/contentTransform'

defineProps<{
  isDebug: boolean
  panelOpen: boolean
  /** 調整対象。認識中マーカーが無ければ null */
  activeMarker: { contentId: ContentId; title: string } | null
}>()

defineEmits<{ close: [] }>()
</script>

<template>
  <TransformPanel
    v-if="isDebug && panelOpen && activeMarker"
    :content-id="activeMarker.contentId"
    :title="activeMarker.title"
    @close="$emit('close')"
  />
  <p v-else-if="isDebug && panelOpen" class="ar-debug-hint">
    調整するマーカーを認識させてください
    <button type="button" @click="$emit('close')">×</button>
  </p>
</template>

<style scoped>
.ar-debug-hint {
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

.ar-debug-hint button {
  width: 24px;
  height: 24px;
  padding: 0;
  color: #fff;
  background: rgb(255 255 255 / 12%);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
