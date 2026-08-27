<script setup lang="ts">
// コンテンツ1: 会式一号機（1911年・所沢で初飛行）— プリミティブで組んだ複葉機とプロペラ回転
defineProps<{ markerName: string }>()
</script>

<template>
  <xrextras-named-image-target :name="markerName">
    <a-entity position="0 0.15 0" scale="0.5 0.5 0.5">
      <!-- 主翼（上下） -->
      <a-box position="0 0.35 0" width="1.6" height="0.03" depth="0.3" color="#d9c58f"></a-box>
      <a-box position="0 0 0" width="1.6" height="0.03" depth="0.3" color="#d9c58f"></a-box>
      <!-- 胴体 -->
      <a-box position="0 0.12 0.45" width="0.12" height="0.12" depth="1.2" color="#8b5a2b"></a-box>
      <!-- 尾翼 -->
      <a-box position="0 0.2 1.0" width="0.5" height="0.02" depth="0.2" color="#d9c58f"></a-box>
      <!-- プロペラ（回転アニメーション） -->
      <a-entity
        position="0 0.12 -0.18"
        animation="property: rotation; to: 0 0 360; dur: 800; easing: linear; loop: true"
      >
        <a-box width="0.05" height="0.7" depth="0.02" color="#333333"></a-box>
      </a-entity>

      <a-text
        value="Kaishiki No.1 (1911)"
        position="0 0.75 0"
        align="center"
        color="#ffffff"
        width="2.4"
      ></a-text>
    </a-entity>
  </xrextras-named-image-target>
</template>
