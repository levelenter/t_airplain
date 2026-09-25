<script setup lang="ts">
/**
 * 画面上部の HUD ヘッダー（戻るボタン＋現在のマーカー名＋調整パネル開閉ボタン）。
 * CameraView（8th Wall）と MarkerArView（AR.js）で共通の見た目・挙動にする。
 */
defineProps<{
  /** 認識中マーカーの日本語タイトル。null ならヒントテキストを出す */
  activeTitle: string | null
  /** マーカー未認識時に出すヒントテキスト */
  hintText: string
  /** ?debug=true のときだけ調整ボタンを出す */
  isDebug: boolean
  /** 調整パネルが開いているか（開いている間はボタンを隠す） */
  panelOpen: boolean
}>()

defineEmits<{ back: []; 'open-panel': [] }>()
</script>

<template>
  <header class="ar-hud">
    <button class="ar-hud__back" type="button" @click="$emit('back')">← メニュー</button>
    <p v-if="activeTitle" class="ar-hud__label">{{ activeTitle }}</p>
    <p v-else class="ar-hud__label ar-hud__label--hint">{{ hintText }}</p>

    <button
      v-if="isDebug && !panelOpen"
      class="ar-hud__debug-open"
      type="button"
      @click="$emit('open-panel')"
    >
      調整
    </button>
  </header>
</template>

<style scoped>
.ar-hud {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(env(safe-area-inset-top, 0px) + 12px) 12px 12px;
  pointer-events: none;
}

.ar-hud__back {
  pointer-events: auto;
  padding: 8px 14px;
  font-size: 0.9rem;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  border: 1px solid rgb(255 255 255 / 40%);
  border-radius: 999px;
  cursor: pointer;
}

.ar-hud__label {
  margin: 0;
  padding: 8px 16px;
  font-size: 0.95rem;
  font-weight: bold;
  color: #0b1e3f;
  background: rgb(255 213 79 / 92%);
  border-radius: 999px;
}

.ar-hud__label--hint {
  color: #fff;
  font-weight: normal;
  background: rgb(0 0 0 / 55%);
}

/* デバッグ時のみ HUD に出る調整パネルの開閉ボタン */
.ar-hud__debug-open {
  pointer-events: auto;
  margin-left: auto;
  padding: 8px 14px;
  font-size: 0.8rem;
  color: #0b1e3f;
  font-weight: bold;
  background: rgb(255 255 255 / 85%);
  border: none;
  border-radius: 999px;
  cursor: pointer;
}
</style>
