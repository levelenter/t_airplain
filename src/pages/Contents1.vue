<script setup lang="ts">
// コンテンツ1: 複葉機 — プリミティブで組んだ機体とプロペラ回転
// 位置・向き・大きさは ArContent が transform から適用する
import ArContent from '@/components/ArContent.vue'
import type { ContentTransform } from '@/utils/contentTransform'

defineProps<{ markerName: string; active: boolean; transform: ContentTransform }>()
</script>

<template>
  <ArContent
    :marker-name="markerName"
    :active="active"
    :transform="transform"
    label="Biplane"
  >
    <!-- 主翼（上下） -->
    <a-box position="0 0.35 0" width="1.6" height="0.03" depth="0.3" color="#d9c58f"></a-box>
    <a-box position="0 0 0" width="1.6" height="0.03" depth="0.3" color="#d9c58f"></a-box>
    <!-- 胴体 -->
    <a-box position="0 0.12 0.45" width="0.12" height="0.12" depth="1.2" color="#8b5a2b"></a-box>
    <!-- 尾翼 -->
    <a-box position="0 0.2 1.0" width="0.5" height="0.02" depth="0.2" color="#d9c58f"></a-box>
    <!-- プロペラ（機体の自動回転とは別に、常に回し続ける） -->
    <a-entity
      position="0 0.12 -0.18"
      animation="property: rotation; to: 0 0 360; dur: 800; easing: linear; loop: true"
    >
      <a-box width="0.05" height="0.7" depth="0.02" color="#333333"></a-box>
    </a-entity>
  </ArContent>
</template>
