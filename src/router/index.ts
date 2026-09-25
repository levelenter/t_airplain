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
