import type { Metadata, Viewport } from "next";
import { Geist_Mono, Pacifico } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { ROOT_SITE_METADATA } from "@/lib/marketing/seo";
import { SITE_THEME_COLOR } from "@/lib/marketing/siteAssets";
import "./globals.css";

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
});

/**
 * Geist는 라틴 문자만 지원해 한글은 브라우저 시스템 폰트로 폴백되고 있었다(신뢰감 저하 원인).
 * Pretendard는 한글·라틴을 한 세트로 디자인한 가변 폰트라 국문 위주인 이 서비스에 더 맞는다.
 */
const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = ROOT_SITE_METADATA;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: SITE_THEME_COLOR,
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <body
        className={`${pretendard.variable} ${pretendard.className} ${geistMono.variable} ${pacifico.variable} font-sans antialiased bg-white overflow-x-hidden`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}