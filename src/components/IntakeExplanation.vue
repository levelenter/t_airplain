<template>
  <aside class="intake-explanation" aria-label="T-1Bの吸気口の解説">
    <p class="intake-explanation__eyebrow">T-1Bの「鼻」のひみつ 〜空気の吸い込み口〜</p>
    <p>正面の大きな吸気口 → 胴体内部の通り道 → 中央のJ3エンジン</p>
    <details>
      <summary>もっと詳しく</summary>
      <p>この大きな穴は「エアインテーク（吸気口）」。ジェットエンジンが動くために必要な大量の空気を取り込みます。青い矢印を追って、機体の奥へ進む空気を観察してみてください。</p>
      <p>T-1は戦後日本が初めて独自開発したジェット練習機です。T-1Bには、日本の技術で作られたJ3エンジンが搭載されています。取り込んだ空気を圧縮し、燃料とともに燃焼させることで推進力を生み出します。</p>
      <p class="intake-explanation__note">流速目安：秒速約220m（提供原稿の参考値）。形状・流路は説明用の模式図で、矢印は観察しやすい速度にしています。</p>
    </details>
  </aside>
</template>

<style scoped>
.intake-explanation {
  position: fixed;
  right: 12px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
  left: 12px;
  z-index: 8;
  max-width: 420px;
  max-height: 36dvh;
  overflow: auto;
  padding: 12px 16px;
  color: #eefaff;
  background: rgb(7 25 40 / 90%);
  border: 1px solid rgb(89 205 255 / 45%);
  border-radius: 14px;
  font-size: 0.85rem;
  line-height: 1.6;
}
p { margin: 0 0 8px; }
p:last-child { margin-bottom: 0; }
.intake-explanation__eyebrow { color: #81dfff; font-weight: bold; }
summary { padding: 6px 0; cursor: pointer; }
summary:focus-visible { outline: 2px solid #81dfff; outline-offset: 2px; }
.intake-explanation__note { color: #c1d3df; font-size: 0.75rem; }
</style>
