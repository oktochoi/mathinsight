import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'firebase_options.dart';
import 'screens/main_screen.dart';
import 'services/notification_service.dart';

/// 백그라운드 FCM 핸들러 — 반드시 top-level 함수여야 함
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  // 백그라운드에서는 시스템이 자동으로 알림 표시 (data-only일 때만 직접 처리)
  if (message.notification == null) {
    await NotificationService.instance.showLocalNotification(
      title: message.data['title'] ?? '알림',
      body: message.data['body'] ?? '',
      url: message.data['url'],
    );
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // 백그라운드 핸들러 등록
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // 알림 서비스 초기화
  await NotificationService.instance.initialize();

  runApp(const MathInsightApp());
}

class MathInsightApp extends StatelessWidget {
  const MathInsightApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MathInsight',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
      ),
      home: const MainScreen(),
    );
  }
}
