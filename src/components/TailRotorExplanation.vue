<template>
  <aside class="tail-explanation" aria-label="H-19の反トルクの解説">
    <p class="tail-explanation__title">H-19 シコルスキー ｜ テールローターの横押し</p>
    <p>青はメインローターの下降気流。赤は尾部の横向き気流と、機体を押す力です。</p>
    <details>
      <summary>小さなローターが機体の向きを保つしくみ</summary>
      <p>メインローターが回ると、反作用で機体は反対向きに回ろうとします。上の青い円弧矢印は、この機体に働くトルクを表しています。</p>
      <p>尾部のテールローターが空気を横へ送り、その反作用で尾部が反対側へ押されます。赤い半透明の矢印付きリボンは空気の流れ、大きな赤い矢印は機体を押す力です。空気と押す力の向きが逆であることに注目してください。</p>
      <p>この横押しが、メインローターの反作用による機体の回転を抑えます。</p>
      <p class="tail-explanation__note">形状・気流・回転速度は説明用の模式表現です。力の釣り合いを示すため、機体全体は回転させていません。</p>
    </details>
  </aside>
</template>

<style scoped>
.tail-explanation {
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
.tail-explanation__title { color: #81dfff; font-weight: bold; }
summary { padding: 6px 0; cursor: pointer; }
summary:focus-visible { outline: 2px solid #81dfff; outline-offset: 2px; }
.tail-explanation__note { color: #c1d3df; font-size: 0.75rem; }
</style>
