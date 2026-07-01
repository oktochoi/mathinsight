import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// 알림 탭했을 때 WebView를 특정 URL로 이동시키는 콜백
typedef NavigateCallback = void Function(String url);

class NotificationService {
  NotificationService._();
  static final instance = NotificationService._();

  final _localNotifications = FlutterLocalNotificationsPlugin();
  final _fcm = FirebaseMessaging.instance;
  final _storage = const FlutterSecureStorage();

  NavigateCallback? _onNavigate;

  // 알림 채널 ID (Android)
  static const _channelId = 'mathinsight_default';
  static const _channelName = '학원 알림';
  static const _channelDesc = '수업·출결·학부모 알림';

  Future<void> initialize() async {
    // ── 1. 로컬 알림 설정 ─────────────────────────────────
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false, // 권한은 나중에 명시적으로
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _localNotifications.initialize(
      const InitializationSettings(android: androidSettings, iOS: iosSettings),
      onDidReceiveNotificationResponse: _onLocalNotificationTap,
    );

    // Android 알림 채널 생성
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(const AndroidNotificationChannel(
          _channelId,
          _channelName,
          description: _channelDesc,
          importance: Importance.high,
        ));

    // ── 2. FCM 포그라운드 알림 처리 ───────────────────────
    FirebaseMessaging.onMessage.listen(_onForegroundMessage);

    // ── 3. 알림 탭 → 앱이 백그라운드였던 경우 ──────────────
    FirebaseMessaging.onMessageOpenedApp.listen(_onNotificationOpenedApp);

    // ── 4. 앱이 완전히 종료됐다가 알림으로 열린 경우 ─────────
    final initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      // main_screen이 준비된 후 navigate 호출을 위해 약간 지연
      Future.delayed(const Duration(milliseconds: 800), () {
        _handleNotificationData(initialMessage.data);
      });
    }
  }

  // ── 권한 요청 ──────────────────────────────────────────
  Future<bool> requestPermission() async {
    final settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
    );
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  // ── FCM 토큰 가져오기 ──────────────────────────────────
  Future<String?> getFcmToken() async {
    try {
      final token = await _fcm.getToken();
      if (token != null) {
        await _storage.write(key: 'fcm_token', value: token);
      }
      return token;
    } catch (_) {
      return null;
    }
  }

  // ── 토큰 갱신 스트림 ──────────────────────────────────
  Stream<String> get onTokenRefresh => _fcm.onTokenRefresh;

  // ── navigate 콜백 등록 (MainScreen에서 호출) ───────────
  void setNavigateCallback(NavigateCallback cb) => _onNavigate = cb;

  // ── 로컬 알림 직접 표시 (포그라운드 or 백그라운드 data-only) ─
  Future<void> showLocalNotification({
    required String title,
    required String body,
    String? url,
  }) async {
    final payload = url != null ? jsonEncode({'url': url}) : null;

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: _channelDesc,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: payload,
    );
  }

  // ── 포그라운드 FCM 메시지 처리 ─────────────────────────
  Future<void> _onForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    await showLocalNotification(
      title: notification?.title ?? message.data['title'] ?? '알림',
      body: notification?.body ?? message.data['body'] ?? '',
      url: message.data['url'],
    );
  }

  // ── 백그라운드에서 알림 탭 ─────────────────────────────
  void _onNotificationOpenedApp(RemoteMessage message) {
    _handleNotificationData(message.data);
  }

  // ── 로컬 알림 탭 ──────────────────────────────────────
  void _onLocalNotificationTap(NotificationResponse response) {
    if (response.payload == null) return;
    try {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      final url = data['url'] as String?;
      if (url != null) _onNavigate?.call(url);
    } catch (_) {}
  }

  // ── FCM data에서 URL 추출 후 navigate ─────────────────
  void _handleNotificationData(Map<String, dynamic> data) {
    final url = data['url'] as String?;
    if (url != null && url.isNotEmpty) {
      _onNavigate?.call(url);
    }
  }
}
