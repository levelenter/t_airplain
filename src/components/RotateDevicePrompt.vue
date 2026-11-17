<script setup lang="ts">
/**
 * 横向きモードなのに端末が縦向きのとき、AR 画面に出す案内オーバーレイ。
 * 端末が横向きになれば自動で消える。「縦向きのまま使う」で縦向きモードへ切り替える。
 * 画面の向きのロック API は使わない。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useLayoutMode } from '@/composables/useLayoutMode'

const { layoutMode, setLayoutMode } = useLayoutMode()

const isDevicePortrait = ref(false)
let mql: MediaQueryList | null = null

function onChange(event: MediaQueryListEvent) {
  isDevicePortrait.value = event.matches
}

onMounted(() => {
  if (typeof window.matchMedia !== 'function') return
  mql = window.matchMedia('(orientation: portrait)')
  isDevicePortrait.value = mql.matches
  mql.addEventListener('change', onChange)
})

onBeforeUnmount(() => {
  mql?.removeEventListener('change', onChange)
  mql = null
})

const visible = computed(() => layoutMode.value === 'landscape' && isDevicePortrait.value)
</script>

<template>
  <div v-if="visible" class="rotate-prompt" role="alertdialog" aria-labelledby="rotate-prompt-title">
    <div class="rotate-prompt__icon" aria-hidden="true">
      <svg viewBox="0 0 64 64" width="64" height="64">
        <rect x="20" y="8" width="24" height="48" rx="4" fill="none" stroke="currentColor" stroke-width="3" />
        <path d="M8 44 A26 26 0 0 0 20 58 M20 58 l-8 0 M20 58 l0 -8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      </svg>
    </div>
    <p id="rotate-prompt-title" class="rotate-prompt__title">端末を横向きにしてください</p>
    <button class="rotate-prompt__button" type="button" @click="setLayoutMode('portrait')">縦向きのまま使う</button>
  </div>
</template>

<style scoped>
.rotate-prompt {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  color: #fff;
  text-align: center;
  background: rgb(0 0 0 / 82%);
}

.rotate-prompt__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: bold;
}

.rotate-prompt__button {
  padding: 10px 22px;
  font-size: 0.9rem;
  color: #fff;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 60%);
  border-radius: 999px;
  cursor: pointer;
}
</style>
