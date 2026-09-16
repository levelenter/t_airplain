<template>
  <aside class="tandem-explanation" aria-label="V-44のローターの解説">
    <p class="tandem-explanation__title">V-44 バートル ｜ 逆回転でトルクを打ち消す</p>
    <p>前後のローターは逆回転。青い渦を追って、下へ送られる空気を見てみよう。</p>
    <details>
      <summary>機体が回らないのはなぜ？</summary>
      <p>ローターを回すと、その反作用で機体は反対向きに回ろうとします。前後のローターを逆向きに回すことで、この力（トルク）を互いに打ち消します。お尻の小さなプロペラ「テールローター」は必要ありません。</p>
      <p>機体側面の左右の矢印は、互いに打ち消し合うトルクを模式的に示しています。太い青いらせんは、ローターから下へ送られる空気の流れです。</p>
      <p class="tandem-explanation__note">前後にローターを配置するタンデム式の説明用モデルです。形状・渦・回転速度は観察しやすく模式化しています。</p>
    </details>
  </aside>
</template>

<style scoped>
.tandem-explanation {
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
.tandem-explanation__title { color: #81dfff; font-weight: bold; }
summary { padding: 6px 0; cursor: pointer; }
summary:focus-visible { outline: 2px solid #81dfff; outline-offset: 2px; }
.tandem-explanation__note { color: #c1d3df; font-size: 0.75rem; }
</style>
