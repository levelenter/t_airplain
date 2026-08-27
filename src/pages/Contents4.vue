<script setup lang="ts">
// コンテンツ4: C-46A輸送機 — ゆっくり回転するシリンダー（胴体イメージ）
defineProps<{ markerName: string }>()
</script>

<template>
  <xrextras-named-image-target :name="markerName">
    <a-entity position="0 0.25 0" animation="property: rotation; to: 0 360 0; dur: 8000; easing: linear; loop: true">
      <a-cylinder radius="0.12" height="0.7" rotation="0 0 90" color="#9e9e9e" metalness="0.6" roughness="0.3"></a-cylinder>
      <a-box position="0 0 0" width="0.06" height="0.02" depth="0.6" color="#757575"></a-box>
      <a-text
        value="C-46A"
        position="0 0.35 0"
        align="center"
        color="#ffffff"
        width="2.4"
      ></a-text>
    </a-entity>
  </xrextras-named-image-target>
</template>
