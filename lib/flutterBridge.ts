/**
 * Flutter WebView 브릿지 유틸리티
 *
 * 사용법:
 *   import { flutterBridge } from '@/lib/flutterBridge'
 *
 *   // Flutter 환경인지 확인
 *   if (flutterBridge.isFlutter) { ... }
 *
 *   // Flutter → Web 메시지 수신 리스너 등록
 *   flutterBridge.onMessage('FCM_TOKEN', ({ token }) => { ... })
 *
 *   // Web → Flutter 메시지 전송
 *   const token = await flutterBridge.call('GET_FCM_TOKEN')
 */

type BridgePayload = Record<string, unknown>

type BridgeMessageHandler<T = BridgePayload> = (payload: T) => void

interface FlutterInAppWebView {
  callHandler(name: string, ...args: unknown[]): Promise<unknown>
}

declare global {
  interface Window {
    flutter_inappwebview?: FlutterInAppWebView
    __FLUTTER_WEBVIEW__?: boolean
    __onFlutterMessage?: (raw: string) => void
    __flutterMessageHandlers?: Map<string, BridgeMessageHandler[]>
  }
}

// ── 수신 핸들러 레지스트리 초기화 ────────────────────────────
if (typeof window !== 'undefined') {
  window.__flutterMessageHandlers ??= new Map()

  // Flutter(main_screen.dart)가 window.__onFlutterMessage(jsonString) 호출
  window.__onFlutterMessage = (raw: string) => {
    try {
      const { type, payload } = JSON.parse(raw) as {
        type: string
        payload: BridgePayload
      }
      const handlers = window.__flutterMessageHandlers?.get(type) ?? []
      handlers.forEach((h) => h(payload))
    } catch {
      console.warn('[FlutterBridge] 파싱 실패:', raw)
    }
  }
}

export const flutterBridge = {
  /** Flutter WebView 내부에서 실행 중인지 여부 */
  get isFlutter(): boolean {
    if (typeof window === 'undefined') return false
    return !!window.__FLUTTER_WEBVIEW__ || !!window.flutter_inappwebview
  },

  /**
   * Flutter로 메시지 전송 (비동기 응답 지원)
   * @returns Flutter handler의 반환값
   */
  async call<T = BridgePayload>(type: string, payload?: BridgePayload): Promise<T> {
    if (!window.flutter_inappwebview) {
      throw new Error('[FlutterBridge] Flutter WebView 환경이 아닙니다.')
    }
    return window.flutter_inappwebview.callHandler('FlutterBridge', {
      type,
      payload: payload ?? {},
    }) as Promise<T>
  },

  /**
   * Flutter → Web 메시지 리스너 등록
   * @returns 등록 해제 함수
   */
  onMessage<T = BridgePayload>(type: string, handler: BridgeMessageHandler<T>): () => void {
    if (typeof window === 'undefined') return () => {}
    window.__flutterMessageHandlers ??= new Map()
    const handlers = window.__flutterMessageHandlers.get(type) ?? []
    handlers.push(handler as BridgeMessageHandler)
    window.__flutterMessageHandlers.set(type, handlers)

    return () => {
      const current = window.__flutterMessageHandlers?.get(type) ?? []
      window.__flutterMessageHandlers?.set(
        type,
        current.filter((h) => h !== (handler as BridgeMessageHandler)),
      )
    }
  },

  /** FCM 알림 권한 요청 */
  async requestPermission(): Promise<boolean> {
    if (!this.isFlutter) return false
    const result = await this.call<{ granted: boolean }>('REQUEST_PERMISSION')
    return result.granted
  },

  /** FCM 토큰 가져오기 (Flutter 보안 저장소에서) */
  async getFcmToken(): Promise<string | null> {
    if (!this.isFlutter) return null
    const result = await this.call<{ token: string | null }>('GET_FCM_TOKEN')
    return result.token
  },
}
