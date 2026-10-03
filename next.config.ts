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
// frameAncestors：このページを iframe に入れてよい親。通常は 'none'（どこにも入れさせない）。
// 埋め込み用の /embed/ だけ * にする（ほかのサイトに貼ってもらうため）。それ以外の directive は同じ。
const buildCsp = (frameAncestors: string) => [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self' data:",
  `connect-src 'self' ${GOOGLE_CONNECT}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://discord.com",
  `frame-ancestors ${frameAncestors}`,
].join("; ");
const cspHeader = process.env.CSP_ENFORCE === "true" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";

const nextConfig: NextConfig = {
  // 親ディレクトリ（/usr/local/Projects）に別の package-lock.json があり、ルートを取り違えるため明示する。
  turbopack: { root: path.resolve(__dirname) },
  async headers() {
    // 同じ名前のヘッダーが 2 本付くと、両方が守られて厳しい側が勝つ（frame-ancestors 'none' が効いてしまう）ので、
    // 全ページ用の規則は /embed/ を除いて書く。
    return [
      { source: "/((?!embed/).*)", headers: [{ key: cspHeader, value: buildCsp("'none'") }] },
      { source: "/embed/:path*", headers: [{ key: cspHeader, value: buildCsp("*") }] },
    ];
  },
};

export default nextConfig;
