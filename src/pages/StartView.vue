<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDebugMode, useDebugQuery } from '@/composables/useDebugMode'
import { MARKERS } from '@/utils/markers'
import { unlockAudio } from '@/utils/sound'

const router = useRouter()
const isDebug = useDebugMode()
const debugQuery = useDebugQuery()

function start() {
  // iOS では音の再生開始にユーザー操作が必要なため、遷移前にここで解除しておく
  unlockAudio()
  // ?debug=true はカメラ画面まで引き継ぐ
  router.push({ name: 'camera', query: debugQuery.value })
}
</script>

<template>
  <main class="start">
    <div class="start__inner">
      <p class="start__subtitle">所沢航空発祥記念館</p>
      <h1 class="start__title">WebAR 体験</h1>
      <p class="start__description">
        館内の画像マーカーにスマートフォンをかざすと、<br>
        航空機にまつわるARコンテンツが現れます。
      </p>

      <button class="start__button" type="button" @click="start">スタート</button>

      <section class="start__markers">
        <h2>体験できるコンテンツ</h2>
        <ol>
          <li v-for="marker in MARKERS" :key="marker.name">{{ marker.title }}</li>
        </ol>
      </section>

      <p class="start__note">※ カメラの使用許可が必要です</p>
      <p v-if="isDebug" class="start__debug">配置調整モード（?debug=true）で動作中</p>
    </div>
  </main>
</template>

<style scoped>
.start {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #0b1e3f 0%, #1c3c6e 60%, #2e6da4 100%);
  color: #fff;
}

.start__inner {
  max-width: 480px;
  padding: 32px 24px;
  text-align: center;
}

.start__subtitle {
  margin: 0;
  font-size: 0.9rem;
  letter-spacing: 0.2em;
  opacity: 0.85;
}

.start__title {
  margin: 8px 0 16px;
  font-size: 2rem;
}

.start__description {
  font-size: 0.95rem;
  line-height: 1.8;
  opacity: 0.9;
}

.start__button {
  margin: 24px 0;
  padding: 14px 64px;
  font-size: 1.1rem;
  font-weight: bold;
  color: #0b1e3f;
  background: #ffd54f;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgb(0 0 0 / 30%);
}

.start__button:active {
  transform: scale(0.97);
}

.start__markers {
  margin-top: 16px;
  padding: 16px;
  background: rgb(255 255 255 / 10%);
  border-radius: 12px;
  text-align: left;
}

.start__markers h2 {
  margin: 0 0 8px;
  font-size: 0.95rem;
}

.start__markers ol {
  margin: 0;
  padding-left: 1.4em;
  font-size: 0.9rem;
  line-height: 1.9;
}

.start__note {
  margin-top: 20px;
  font-size: 0.8rem;
  opacity: 0.7;
}

.start__debug {
  margin: 8px 0 0;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: bold;
  color: #0b1e3f;
  background: #ffd54f;
  border-radius: 999px;
}
</style>
