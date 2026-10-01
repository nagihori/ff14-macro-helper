import type { Metadata } from "next";
import "./globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getSiteUrl } from "@/lib/site-url";
import { themeInitScript } from "@/lib/theme";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
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
