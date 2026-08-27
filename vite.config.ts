import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // A-Frame(8-Frame) と 8th Wall xrextras のカスタム要素を Vue コンポーネント解決から除外する
          isCustomElement: (tag) => tag.startsWith('a-') || tag.startsWith('xrextras-'),
        },
      },
    }),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // ngrok トンネル経由でのスマホ実機確認を許可する（サブドメインはセッションごとに変わる）
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.dev'],
  },
})
