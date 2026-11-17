<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDebugMode, useDebugQuery } from '@/composables/useDebugMode'
import { useLayoutMode, type LayoutMode } from '@/composables/useLayoutMode'
import { AR_MARKERS } from '@/utils/markers'
import { unlockAudio } from '@/utils/sound'

const router = useRouter()
const isDebug = useDebugMode()
const debugQuery = useDebugQuery()
const { layoutMode, setLayoutMode } = useLayoutMode()

/** 画面の向きの選択肢 */
const LAYOUT_OPTIONS: { value: LayoutMode; label: string }[] = [
  { value: 'landscape', label: '横向き（おすすめ）' },
  { value: 'portrait', label: '縦向き' },
]

function start() {
  // iOS では音の再生開始にユーザー操作が必要なため、遷移前にここで解除しておく
  unlockAudio()
  // ?debug=true はカメラ画面まで引き継ぐ
  router.push({ name: 'camera', query: debugQuery.value })
}

/** C-1輸送機を床に置く AR へ進む（マーカー不要） */
function startFloorAr() {
  unlockAudio()
  router.push({ name: 'floor-ar', query: debugQuery.value })
}

/** 開発用プレビュー: カメラを使わず PC のブラウザでモデルの見え方を確認する（AR から外したマーカーも表示） */
function openPreview() {
  router.push({ name: 'preview' })
}

</script>

<template>
  <main class="start">
    <div class="start__inner">
      <div class="start__intro">
      <p class="start__subtitle">所沢航空発祥記念館</p>
      <h1 class="start__title">WebAR 体験</h1>
      <p class="start__description">
        館内のARマーカーにスマートフォンをかざすと、<br>
        航空機にまつわるARコンテンツが現れます。
      </p>
      </div>

      <div class="start__controls">
      <div class="start__orientation" role="radiogroup" aria-label="画面の向き">
        <p class="start__orientation-title">画面の向き</p>
        <div class="start__orientation-options">
          <button
            v-for="option in LAYOUT_OPTIONS"
            :key="option.value"
            class="start__orientation-option"
            :class="{ 'start__orientation-option--selected': layoutMode === option.value }"
            type="button"
            role="radio"
            :aria-checked="layoutMode === option.value"
            @click="setLayoutMode(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="start__actions">
        <button class="start__button" type="button" @click="start">スタート</button>
        <button class="start__button start__button--sub" type="button" @click="startFloorAr">
          C-1輸送機を床に置く
        </button>
      </div>
      </div>

      <div class="start__rest">
      <section class="start__markers">
        <h2>体験できるコンテンツ</h2>
        <ol>
          <li v-for="marker in AR_MARKERS" :key="marker.name">{{ marker.title }}</li>
        </ol>
      </section>

      <p class="start__note">※ カメラの使用許可が必要です</p>

      <button class="start__preview" type="button" @click="openPreview">開発用プレビュー（カメラ不要）</button>
      <p v-if="isDebug" class="start__debug">配置調整モード（?debug=true）で動作中</p>
      </div>
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

.start__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin: 24px 0;
}

.start__button {
  flex: 1 1 100%;
  padding: 14px 12px;
  font-size: 1rem;
  font-weight: bold;
  color: #0b1e3f;
  background: #ffd54f;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgb(0 0 0 / 30%);
}

.start__button--sub {
  padding: 11px 12px;
  font-size: 0.9rem;
  font-weight: normal;
  color: #fff;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 55%);
  box-shadow: none;
}

.start__button--sub:hover {
  background: rgb(255 255 255 / 12%);
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

.start__preview {
  margin-top: 12px;
  padding: 10px 24px;
  font-size: 0.85rem;
  color: #fff;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 55%);
  border-radius: 999px;
  cursor: pointer;
}

.start__preview:hover {
  background: rgb(255 255 255 / 12%);
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

/* 画面の向きの切り替え */
.start__orientation {
  margin-top: 20px;
}

.start__orientation-title {
  margin: 0 0 8px;
  font-size: 0.85rem;
  opacity: 0.85;
}

.start__orientation-options {
  display: flex;
  gap: 8px;
}

.start__orientation-option {
  flex: 1 1 0;
  padding: 10px 8px;
  font-size: 0.9rem;
  color: #fff;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 55%);
  border-radius: 999px;
  cursor: pointer;
}

.start__orientation-option--selected {
  font-weight: bold;
  color: #0b1e3f;
  background: #fff;
  border-color: #fff;
}

.start__orientation-option:focus-visible {
  outline: 2px solid #ffd54f;
  outline-offset: 2px;
}

/* 横持ちのスマホ（高さが低い）: 縦に長くならないよう 2 カラムに組み替える */
@media (orientation: landscape) and (max-height: 520px) {
  .start__inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr;
    column-gap: 32px;
    align-content: center;
    max-width: 880px;
    padding: 16px calc(env(safe-area-inset-right, 0px) + 24px) 16px calc(env(safe-area-inset-left, 0px) + 24px);
  }

  .start__intro {
    grid-column: 1;
    grid-row: 1;
  }

  .start__rest {
    grid-column: 1;
    grid-row: 2;
  }

  .start__controls {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
  }

  .start__title {
    margin: 4px 0 8px;
    font-size: 1.5rem;
  }

  .start__description {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.6;
  }

  .start__orientation {
    margin-top: 0;
  }

  .start__actions {
    margin: 12px 0 0;
    gap: 8px;
  }

  .start__button {
    padding: 10px 12px;
  }

  .start__markers {
    margin-top: 12px;
    padding: 8px 12px;
  }

  .start__markers ol {
    columns: 2;
    font-size: 0.8rem;
    line-height: 1.6;
  }

  .start__note {
    margin-top: 8px;
  }

  .start__preview {
    margin-top: 8px;
  }
}
</style>
