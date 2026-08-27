/// <reference types="vite/client" />

// 8th Wall Engine (Distributed Engine Binary) が window に公開するグローバル。
// index.html の <script> で読み込まれるため、型はここで宣言する。
declare global {
  interface XR8XrController {
    configure(options: { imageTargetData?: object[]; [key: string]: unknown }): void
  }

  interface XR8Global {
    XrController: XR8XrController
    stop(): void
    isPaused(): boolean
    [key: string]: unknown
  }

  interface Window {
    XR8?: XR8Global
    XRExtras?: Record<string, unknown>
  }
}

export {}
