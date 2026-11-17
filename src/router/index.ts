import { createRouter, createWebHistory } from 'vue-router'
import StartView from '@/pages/StartView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'start',
      component: StartView,
    },
    {
      path: '/camera',
      name: 'camera',
      // 8th Wall で画像ARマーカー（number_01〜06）を認識する。AR エンジン込みで重いため遅延読み込み
      component: () => import('@/pages/CameraView.vue'),
    },
    {
      path: '/floor-ar',
      name: 'floor-ar',
      // C-1輸送機を床に置く AR。8th Wall のワールドトラッキング（SLAM）のみ使い、画像マーカーは使わない
      component: () => import('@/pages/FloorArView.vue'),
    },
    // 旧 URL（画像番号マーカー画面・AR.js 画面）はカメラ画面へ寄せる
    { path: '/image-number-ar', redirect: (to) => ({ name: 'camera', query: to.query }) },
    { path: '/marker-ar', redirect: (to) => ({ name: 'camera', query: to.query }) },
    {
      path: '/preview',
      name: 'preview',
      // PC でマーカー上の AR コンテンツを確認するローカルプレビュー（カメラ・XR8 不要）
      component: () => import('@/pages/PreviewView.vue'),
    },
  ],
})

export default router
