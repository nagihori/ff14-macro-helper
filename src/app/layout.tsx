import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ff14-macro-helper",
  description: "FFXIV マクロの編集・診断・ログプレビュー・共有ツール",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
