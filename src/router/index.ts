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
      // カメラビューは AR エンジン込みで重いため遅延読み込み
      component: () => import('@/pages/CameraView.vue'),
    },
    {
      path: '/image-number-ar',
      name: 'image-number-ar',
      // 8th Wall で画像番号マーカー（number_01〜06）を認識する。CameraView をマーカーセット違いで再利用
      component: () => import('@/pages/CameraView.vue'),
      props: { markerSet: 'imageNumber' },
    },
    {
      path: '/preview',
      name: 'preview',
      // PC でマーカー上の AR コンテンツを確認するローカルプレビュー（カメラ・XR8 不要）
      component: () => import('@/pages/PreviewView.vue'),
    },
    {
      path: '/marker-ar',
      name: 'marker-ar',
      // 8th Wall とは別に、AR.js（pattern マーカー）で番号入りマーカー（01〜06）を認識する画面
      component: () => import('@/pages/MarkerArView.vue'),
    },
  ],
})

export default router
