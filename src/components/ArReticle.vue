<script setup lang="ts">
/**
 * 中央の照準（レティクル）。カメラ映像を隠さないよう細線＋部分的なブラケットのみで構成する。
 * CameraView（8th Wall）と MarkerArView（AR.js）の両方から使う共通パーツ。
 *
 * state:
 * - idle:  マーカーを探している最中
 * - found: マーカーを認識してタップ待ち（強調して脈動させる）
 * - dim:   タップ済みでコンテンツ表示中（モデルの邪魔をしないよう薄くする）
 */
defineProps<{ state: 'idle' | 'found' | 'dim' }>()
</script>

<template>
  <div class="reticle" :class="`reticle--${state}`" aria-hidden="true">
    <div class="reticle__scope">
      <span class="reticle__pulse"></span>
      <span class="reticle__pulse reticle__pulse--delayed"></span>

      <svg class="reticle__frame" viewBox="0 0 120 120">
        <g class="reticle__brackets">
          <path d="M14 40 V22 A8 8 0 0 1 22 14 H40" />
          <path d="M80 14 H98 A8 8 0 0 1 106 22 V40" />
          <path d="M106 80 V98 A8 8 0 0 1 98 106 H80" />
          <path d="M40 106 H22 A8 8 0 0 1 14 98 V80" />
        </g>
        <circle class="reticle__dot" cx="60" cy="60" r="2" />
      </svg>

      <p class="reticle__prompt">タップして表示</p>
    </div>
  </div>
</template>

<style scoped>
.reticle {
  position: fixed;
  inset: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  pointer-events: none;
  transition:
    color 0.25s ease,
    opacity 0.25s ease;
}

.reticle__scope {
  position: relative;
  width: min(52vw, 240px);
  aspect-ratio: 1;
}

.reticle__frame {
  display: block;
  width: 100%;
  height: 100%;
  /* 明るい被写体でも輪郭が沈まないよう、薄い影で縁取る */
  filter: drop-shadow(0 0 3px rgb(0 0 0 / 55%));
  transition: transform 0.35s ease;
}

.reticle__brackets path {
  fill: none;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
}

.reticle__dot {
  fill: currentcolor;
}

/* 認識時に外側へ広がる波紋。2 本を時間差で出して「反応した」ことを伝える */
.reticle__pulse {
  position: absolute;
  inset: 6%;
  border: 1.5px solid currentcolor;
  border-radius: 50%;
  opacity: 0;
}

/* マーカーを探している間：主張しすぎないよう控えめに */
.reticle--idle {
  opacity: 0.5;
}

/* 認識してタップ待ち：アクセント色にして少し内側へ寄せる */
.reticle--found {
  color: #ffd54f;
  opacity: 1;
}

.reticle--found .reticle__frame {
  transform: scale(0.94);
  animation: reticle-frame-breathe 1.6s ease-in-out infinite;
}

.reticle--found .reticle__pulse {
  animation: reticle-pulse 1.8s ease-out infinite;
}

.reticle--found .reticle__pulse--delayed {
  animation-delay: 0.9s;
}

/* コンテンツ表示中：モデルを見せたいので照準はほぼ消す */
.reticle--dim {
  opacity: 0.16;
}

.reticle__prompt {
  position: absolute;
  top: calc(100% + 18px);
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 8px 18px;
  font-size: 0.9rem;
  font-weight: bold;
  color: #0b1e3f;
  white-space: nowrap;
  background: rgb(255 213 79 / 92%);
  border-radius: 999px;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.reticle--found .reticle__prompt {
  opacity: 1;
  animation: reticle-prompt-breathe 1.6s ease-in-out infinite;
}

/* frame と prompt は基準の transform が異なるため、keyframes を分けて上書き事故を防ぐ */
@keyframes reticle-frame-breathe {
  0%,
  100% {
    transform: scale(0.94);
  }

  50% {
    transform: scale(0.9);
  }
}

@keyframes reticle-prompt-breathe {
  0%,
  100% {
    transform: translateX(-50%) scale(1);
  }

  50% {
    transform: translateX(-50%) scale(1.04);
  }
}

@keyframes reticle-pulse {
  0% {
    opacity: 0.55;
    transform: scale(0.86);
  }

  100% {
    opacity: 0;
    transform: scale(1.3);
  }
}

/* 動きに敏感な利用者向けにアニメーションを止める */
@media (prefers-reduced-motion: reduce) {
  .reticle__frame,
  .reticle__pulse,
  .reticle__prompt {
    animation: none !important;
  }
}
</style>
