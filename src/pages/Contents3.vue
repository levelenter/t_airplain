<script setup lang="ts">
// コンテンツ3: 九一式戦闘機 — バウンドするボックスのデモ（タップで反応）
defineProps<{ markerName: string }>()
</script>

<template>
  <xrextras-named-image-target :name="markerName">
    <a-entity>
      <a-box
        class="cantap"
        position="0 0.2 0"
        width="0.25"
        height="0.25"
        depth="0.25"
        color="#4caf50"
        xrextras-one-finger-rotate
        animation="property: position; from: 0 0.2 0; to: 0 0.45 0; dir: alternate; dur: 900; easing: easeInOutQuad; loop: true"
      ></a-box>
      <a-text
        value="Type 91 Fighter"
        position="0 0.7 0"
        align="center"
        color="#ffffff"
        width="2.4"
      ></a-text>
    </a-entity>
  </xrextras-named-image-target>
</template>
