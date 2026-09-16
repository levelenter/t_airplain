`aframeAdditiveGlow.ts` は A-Frame 用 `additive-glow` コンポーネントの参照実装。
model-loaded 後に three.js マテリアルを AdditiveBlending / transparent / depthWrite=false に切り替える。
このプロジェクトでは `src/utils/aframeAdditiveGlow.ts` として組み込み済み。別プロジェクトではコピーして
`registerAdditiveGlow()` を a-scene 生成前に呼ぶ。
