import type { Metadata } from "next";
import "./globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";
import { themeInitScript } from "@/lib/theme";

// 共有カード（og:image など）の絶対 URL の基準。本番ドメインは SITE_URL で指定する。未設定なら Vercel が付ける URL、ローカルは localhost。
const siteUrl = process.env.SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ff14-macro-helper",
  description: "FFXIV マクロの編集・診断・ログプレビュー・共有ツール",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme は描画前のスクリプトが付けるため、サーバー描画との差分は意図したもの。
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
