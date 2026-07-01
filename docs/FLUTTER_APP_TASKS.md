# Flutter 앱 작업 목록

Next.js 웹앱(EduFlow)을 감싸는 Flutter WebView 셸 앱 구현 시 해야 할 것들.
로그인/온보딩 위저드/대시보드 등 실제 화면은 전부 웹에 이미 있음 — Flutter는
"네이티브 인트로 2~3장 + WebView 셸 + FCM 브릿지"만 얇게 구현하면 된다.

딥링크(알림 탭 → 특정 페이지로 라우팅)를 지원한다. 서버는 이미
`lib/push/fcm.ts`의 `sendFcmToTokens`에서 FCM 메시지에
`data: { url: '/students/123#consultation' }` 형태로 상대경로를 실어 보내고
있으므로, Flutter는 새 스펙을 만들 필요 없이 이 `url` 값만 읽어서 WebView를
해당 경로로 이동시키면 된다.

---

## 0. 화면 흐름

```
Splash (Firebase 초기화, 최초실행 여부 체크)
  → Onboarding PageView (2~3장, 최초 1회만. SharedPreferences 플래그로 스킵)
  → WebView 화면 (고정된 로그인 URL 로드) ← 이후 전체 앱은 웹
```

- 최초실행 체크: `shared_preferences`에 `onboarding_seen: bool` 저장, true면 온보딩 건너뛰고 바로 WebView로.
- 알림 탭으로 앱이 열린 경우, 아래(2번) 딥링크 처리에 따라 알림에 담긴 `url`로 진입.
  없으면 평소처럼 고정 로그인 URL로 진입.

---

## 1. WebView ↔ 웹 브릿지 계약

웹 쪽(`lib/flutterBridge.ts`)은 이미 구현되어 있음. Flutter는 이 계약의 반대편을 구현.

### Web → Flutter (요청/응답)

웹이 `window.flutter_inappwebview.callHandler('FlutterBridge', {type, payload})`로 호출.
`flutter_inappwebview` 패키지 기준 핸들러 등록:

```dart
controller.addJavaScriptHandler(
  handlerName: 'FlutterBridge',
  callback: (args) async {
    final msg = args[0] as Map;
    switch (msg['type']) {
      case 'GET_FCM_TOKEN':
        final token = await secureStorage.read(key: 'fcm_token');
        return {'token': token};
      case 'REQUEST_PERMISSION':
        final settings = await FirebaseMessaging.instance.requestPermission();
        return {
          'granted': settings.authorizationStatus == AuthorizationStatus.authorized,
        };
    }
  },
);
```

### Flutter → Web (토큰 갱신 push)

웹은 아래 둘 중 하나만 있으면 수신 가능 (`FlutterPushSync.tsx` 참고):

```dart
await controller.evaluateJavascript(
  source: "window.onFcmToken && window.onFcmToken('$token');",
);
```

또는:

```dart
final json = jsonEncode({'type': 'FCM_TOKEN', 'payload': {'token': token}});
await controller.evaluateJavascript(
  source: "window.__onFlutterMessage && window.__onFlutterMessage('$json');",
);
```

### `isFlutter` 플래그

웹의 `flutterBridge.isFlutter`는 `window.__FLUTTER_WEBVIEW__` 또는
`window.flutter_inappwebview` 존재 여부로 판단. `flutter_inappwebview` 패키지가
`window.flutter_inappwebview`를 자동 주입하므로 기본적으로 통과하지만,
명시적으로 넣어 안전하게:

```dart
initialUserScripts: UnmodifiableListView([
  UserScript(
    source: "window.__FLUTTER_WEBVIEW__ = true;",
    injectionTime: UserScriptInjectionTime.AT_DOCUMENT_START,
  ),
]),
```

---

## 2. Firebase / 푸시 알림

- `firebase_core`, `firebase_messaging` 세팅
  - Android: `google-services.json` 추가
  - iOS: `GoogleService-Info.plist` 추가 + Firebase 콘솔에 APNs 인증 키 등록
- `FirebaseMessaging.instance.getToken()` → `flutter_secure_storage`에 저장
  (`GET_FCM_TOKEN` 핸들러가 여기서 읽어서 웹에 반환)
- `onTokenRefresh` 리스너 → secure storage 갱신 + `evaluateJavascript`로 웹에 즉시 push
- 알림 권한 요청: Android 13+는 `POST_NOTIFICATIONS` 런타임 퍼미션, iOS는
  `FirebaseMessaging.requestPermission()`

---

## 2-1. 딥링크 처리 (알림 → 특정 페이지)

서버가 보내는 FCM data payload에 이미 `url`(상대경로)이 들어있다. 예:
`/students/123#consultation`, `/student#homework`. Flutter는 이 값을 읽어
`baseUrl + url`을 WebView에 로드하면 된다.

### 앱이 background/foreground일 때 (WebView 인스턴스가 이미 살아있음)

```dart
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  final path = message.data['url'];
  if (path != null && webViewController != null) {
    webViewController!.loadUrl(
      urlRequest: URLRequest(uri: WebUri('$baseUrl$path')),
    );
  }
});
```

### 앱이 완전히 종료된 상태에서 알림 탭으로 콜드 스타트한 경우

```dart
final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
final pendingDeepLinkPath = initialMessage?.data['url']; // nullable, 앱 시작 시 보관
```

`Splash`/`Onboarding`을 거쳐 WebView 화면이 처음 생성될 때, 이 값이 있으면
기본 로그인 URL 대신 `baseUrl + pendingDeepLinkPath`를 초기 URL로 로드한다.
없으면 평소처럼 고정 로그인 URL.

### 로그인 안 된 상태로 딥링크 진입 시 주의

현재 웹 쪽(`lib/authRedirectPolicy.ts`)에는 로그인 후 원래 요청한 페이지로
되돌아가는 `?redirect=` 같은 파라미터가 없다. 즉 세션이 없는 상태로 보호된
경로에 딥링크로 들어가면, 로그인 화면으로 리다이렉트된 뒤 로그인에 성공해도
원래 목표 페이지가 아니라 역할별 기본 홈(`postAuthDestination`)으로 이동한다.
"딥링크 target으로 로그인 후 정확히 복귀"까지 필요하면 웹 쪽에
redirect 파라미터 지원을 별도로 추가해야 한다 (이 문서 범위 밖, Next.js 작업).

---

## 3. WebView 세부 옵션

- 세션 유지: `incognito: false`, 쿠키 삭제하지 않음 → 앱 재시작해도 로그인 유지
- 뒤로가기: `PopScope`에서 `controller.canGoBack()` 체크 후 `goBack()`,
  더 못 가면 앱 종료(또는 confirm)
- 오프라인/로드 실패: `onReceivedError`에서 재시도 버튼 있는 네이티브 에러뷰 표시
- 로딩 인디케이터: 첫 로드 시 스플래시 → 페이지 로드 완료(`onLoadStop`) 후 WebView 노출

---

## 4. 네이티브 설정

- Android: `INTERNET`, `POST_NOTIFICATIONS` 퍼미션, minSdk 21+
- iOS: Push Notifications capability + Background Modes(remote-notification)
- 앱 아이콘 / 스플래시 이미지

---

## 5. 로그아웃

웹 쪽(`FlutterPushSync.tsx`)이 로그아웃 시 `DELETE /api/push/token`을 자동 호출하므로
Flutter가 별도로 처리할 것 없음.

---

## 체크리스트

```
[ ] 0. Splash + Onboarding(2~3장) + WebView 화면 흐름 구성
[ ] 0. SharedPreferences로 온보딩 1회만 노출
[ ] 1. FlutterBridge JS 핸들러 등록 (GET_FCM_TOKEN, REQUEST_PERMISSION)
[ ] 1. window.__FLUTTER_WEBVIEW__ = true 초기 주입
[ ] 1. 토큰 갱신 시 evaluateJavascript로 웹에 push
[ ] 2. Firebase 프로젝트 연결 (Android/iOS)
[ ] 2. FCM 토큰 secure storage 저장 + onTokenRefresh 연결
[ ] 2. 알림 권한 요청 플로우
[ ] 2-1. onMessageOpenedApp에서 data['url']로 WebView.loadUrl
[ ] 2-1. getInitialMessage()로 콜드스타트 딥링크 경로 보관 → 초기 WebView URL에 반영
[ ] 3. WebView 쿠키 유지 설정 (incognito: false)
[ ] 3. 뒤로가기 / 에러 페이지 / 로딩 처리
[ ] 4. 퍼미션 매니페스트 (Android POST_NOTIFICATIONS 등)
[ ] 4. 앱 아이콘 / 스플래시
```
