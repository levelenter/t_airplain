# このプロジェクトについて
所沢航空発祥記念館のWebARコンテンツプロジェクトです。

画像マーカーによる6DoFのARコンテンツとする。


# 技術要件
vuejs
typescript 
a-frame
three.js
Open Source 8thwall

# 画面構成
メニュー画面でスタートするとカメラビューに遷移する
カメラビューで画像マーカーを認識すると、マーカーに対応するそれぞれのコンテンツを見ることができる。

# プロジェクトの構成
src/
  assets/
  components/
  pages/
    StartView.vue
    CameraView.vue
    Contents1.vue
    Contents2.vue
    Contents3.vue
    Contents4.vue
    Contents5.vue
  router/
  store/
  utils/
  App.vue
  main.ts