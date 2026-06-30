/** Flutter WebView shell에서 로드됐는지 (UA에 FlutterWebView 포함) */
export function isFlutterWebView(): boolean {
  if (typeof window === 'undefined') return false;
  return window.navigator.userAgent.includes('FlutterWebView');
}
