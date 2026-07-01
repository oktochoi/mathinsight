import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import '../services/notification_service.dart';

/// 웹앱 베이스 URL — 프로덕션 배포 후 교체
const String _baseUrl = 'https://your-domain.com';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  InAppWebViewController? _webController;
  bool _isLoading = true;
  String? _pendingNavigateUrl; // 알림으로 앱 시작 시 이동할 URL

  @override
  void initState() {
    super.initState();

    // 알림 탭 → WebView URL 이동 콜백 등록
    NotificationService.instance.setNavigateCallback((url) {
      _navigateWebView(url);
    });

    // FCM 토큰 갱신 시 웹에 재전송
    NotificationService.instance.onTokenRefresh.listen((newToken) {
      _sendTokenToWeb(newToken);
    });
  }

  // ── WebView 준비 완료 후 호출 ────────────────────────────
  Future<void> _onWebViewReady() async {
    // 1. 알림 권한 요청
    final granted = await NotificationService.instance.requestPermission();

    // 2. FCM 토큰 획득 후 웹에 전달
    if (granted) {
      final token = await NotificationService.instance.getFcmToken();
      if (token != null) await _sendTokenToWeb(token);
    }

    // 3. 앱 시작 시 알림으로 열린 URL이 있으면 이동
    if (_pendingNavigateUrl != null) {
      _navigateWebView(_pendingNavigateUrl!);
      _pendingNavigateUrl = null;
    }

    // 4. 웹에 Flutter 환경임을 알림
    await _evalJS('window.__FLUTTER_WEBVIEW__ = true;');
  }

  // ── Flutter → Web: JS 실행 ───────────────────────────────
  Future<void> _evalJS(String source) async {
    await _webController?.evaluateJavascript(source: source);
  }

  // ── FCM 토큰을 웹으로 전달 ──────────────────────────────
  Future<void> _sendTokenToWeb(String token) async {
    final payload = jsonEncode({'type': 'FCM_TOKEN', 'payload': {'token': token}});
    await _evalJS('window.__onFlutterMessage && window.__onFlutterMessage($payload)');
  }

  // ── 특정 경로로 WebView 이동 ─────────────────────────────
  void _navigateWebView(String url) {
    final controller = _webController;
    if (controller == null) {
      _pendingNavigateUrl = url;
      return;
    }
    // 절대 URL이면 그대로, 상대 경로면 baseUrl 붙임
    final target = url.startsWith('http') ? url : '$_baseUrl$url';
    controller.loadUrl(urlRequest: URLRequest(url: WebUri(target)));
  }

  // ── Web → Flutter: JS 핸들러 ────────────────────────────
  void _setupJsHandlers(InAppWebViewController controller) {
    // 단일 채널 'FlutterBridge' — 웹에서 callHandler('FlutterBridge', {...}) 로 호출
    controller.addJavaScriptHandler(
      handlerName: 'FlutterBridge',
      callback: (args) async {
        if (args.isEmpty) return;
        final msg = args[0] as Map<String, dynamic>;
        final type = msg['type'] as String?;
        final payload = msg['payload'] as Map<String, dynamic>? ?? {};

        switch (type) {
          // 웹이 직접 알림 권한 요청 (예: 설정 페이지)
          case 'REQUEST_PERMISSION':
            final granted = await NotificationService.instance.requestPermission();
            return {'granted': granted};

          // 웹이 FCM 토큰 필요 (로그인 직후 등)
          case 'GET_FCM_TOKEN':
            final token = await NotificationService.instance.getFcmToken();
            return {'token': token};

          // 웹이 로컬 알림 직접 표시 요청 (필요 시)
          case 'SHOW_NOTIFICATION':
            await NotificationService.instance.showLocalNotification(
              title: payload['title'] as String? ?? '알림',
              body: payload['body'] as String? ?? '',
              url: payload['url'] as String?,
            );
            return {'ok': true};

          // 웹이 특정 URL로 이동 요청
          case 'NAVIGATE':
            final url = payload['url'] as String?;
            if (url != null) _navigateWebView(url);
            return {'ok': true};

          default:
            return {'ok': false, 'error': 'unknown type: $type'};
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F7),
      body: SafeArea(
        child: Stack(
          children: [
            InAppWebView(
              initialUrlRequest: URLRequest(
                url: WebUri(_baseUrl),
              ),
              initialSettings: InAppWebViewSettings(
                javaScriptEnabled: true,
                domStorageEnabled: true,
                databaseEnabled: true,
                // 쿠키 유지 (Supabase auth session)
                sharedCookiesEnabled: true,
                // 당겨서 새로고침 비활성화 (웹앱이 자체 처리)
                disallowOverScroll: false,
                // iOS 고해상도 지원
                contentInsetAdjustmentBehavior:
                    ScrollViewContentInsetAdjustmentBehavior.NEVER,
                // 스크롤 인디케이터 숨김
                horizontalScrollBarEnabled: false,
                verticalScrollBarEnabled: false,
              ),
              onWebViewCreated: (controller) {
                _webController = controller;
                _setupJsHandlers(controller);
              },
              onLoadStart: (controller, url) {
                setState(() => _isLoading = true);
              },
              onLoadStop: (controller, url) async {
                setState(() => _isLoading = false);
                await _onWebViewReady();
              },
              onReceivedError: (controller, request, error) {
                // 네트워크 오류 시 오프라인 페이지 표시 가능
                debugPrint('WebView error: ${error.description}');
              },
              // 외부 링크 처리 (예: 카카오 결제 등)
              shouldOverrideUrlLoading: (controller, navigationAction) async {
                final url = navigationAction.request.url?.toString() ?? '';
                // _baseUrl 이외의 URL은 외부 브라우저에서 열기
                if (!url.startsWith(_baseUrl) && url.startsWith('http')) {
                  return NavigationActionPolicy.CANCEL;
                }
                return NavigationActionPolicy.ALLOW;
              },
            ),

            // 로딩 인디케이터
            if (_isLoading)
              const Positioned.fill(
                child: ColoredBox(
                  color: Color(0xFFF5F5F7),
                  child: Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF2563EB),
                      strokeWidth: 2,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
