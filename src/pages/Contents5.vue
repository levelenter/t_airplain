<script setup lang="ts">
// コンテンツ5: 航空発祥の地・所沢 — 記念パネルと浮遊する星
defineProps<{ markerName: string }>()
</script>

<template>
  <xrextras-named-image-target :name="markerName">
    <a-entity>
      <a-plane position="0 0.3 0" width="0.9" height="0.5" color="#0b1e3f" opacity="0.85"></a-plane>
      <a-text
        value="Tokorozawa\nBirthplace of Japanese Aviation\n1911 -"
        position="0 0.3 0.01"
        align="center"
        color="#ffd54f"
        width="1.6"
      ></a-text>
      <a-sphere
        position="-0.55 0.5 0.1"
        radius="0.04"
        color="#ffd54f"
        animation="property: position; from: -0.55 0.5 0.1; to: -0.55 0.65 0.1; dir: alternate; dur: 1200; easing: easeInOutSine; loop: true"
      ></a-sphere>
      <a-sphere
        position="0.55 0.55 0.1"
        radius="0.04"
        color="#ffffff"
        animation="property: position; from: 0.55 0.55 0.1; to: 0.55 0.4 0.1; dir: alternate; dur: 1500; easing: easeInOutSine; loop: true"
      ></a-sphere>
    </a-entity>
  </xrextras-named-image-target>
</template>
