export {};

declare global {
  interface Window {
    onFcmToken?: (token: string) => void | Promise<void>;
    onPushMessage?: (title: string, body: string) => void;
    FlutterBridge?: { postMessage: (message: string) => void };
  }
}
