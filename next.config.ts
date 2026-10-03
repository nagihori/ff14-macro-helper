import type { NextConfig } from "next";
import path from "node:path";

// Content-Security-Policy。XSS をすり抜けられたときに、外部のスクリプト読み込みや情報の持ち出しを
// ブラウザ側で止める保険。許可するのは、自分自身・Google アナリティクス・Discord（ログイン）だけ。
// 既定は報告のみ（Content-Security-Policy-Report-Only）。ページは壊れず、違反はブラウザのコンソールに
// 「[Report Only] Refused to …」と出る。違反がなくなったら Vercel の環境変数 CSP_ENFORCE=true で強制に切り替える。
// script-src の 'unsafe-inline' は、Next の内部スクリプトとテーマの初期化スクリプトのため（nonce 方式は全ページが
// 動的描画になるので見送り）。設計は docs/publish.md の「セキュリティヘッダ」。
const isDev = process.env.NODE_ENV === "development";
const GOOGLE_CONNECT = "https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self' data:",
  `connect-src 'self' ${GOOGLE_CONNECT}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://discord.com",
  "frame-ancestors 'none'",
].join("; ");
const cspHeader = process.env.CSP_ENFORCE === "true" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";

const nextConfig: NextConfig = {
  // 親ディレクトリ（/usr/local/Projects）に別の package-lock.json があり、ルートを取り違えるため明示する。
  turbopack: { root: path.resolve(__dirname) },
  async headers() {
    return [{ source: "/:path*", headers: [{ key: cspHeader, value: csp }] }];
  },
};

export default nextConfig;
