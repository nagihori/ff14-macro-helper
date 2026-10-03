import type { Metadata } from "next";
import "./globals.css";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { HideInEmbed } from "@/components/HideInEmbed";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { BRAND_NAME, DEFAULT_DESCRIPTION, DEFAULT_TITLE, GA_MEASUREMENT_ID } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/site-url";
import { themeInitScript } from "@/lib/theme";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  // 配下のページは title を渡すだけで「{title} | {BRAND_NAME}」になる。
  title: { default: DEFAULT_TITLE, template: `%s | ${BRAND_NAME}` },
  description: DEFAULT_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme は描画前のスクリプトが付けるため、サーバー描画との差分は意図したもの。
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <HideInEmbed><SiteHeader brandName={BRAND_NAME} /></HideInEmbed>
        {children}
        <HideInEmbed><SiteFooter /></HideInEmbed>
        {GA_MEASUREMENT_ID && process.env.NODE_ENV === "production" && <HideInEmbed><GoogleAnalytics measurementId={GA_MEASUREMENT_ID} /></HideInEmbed>}
      </body>
    </html>
  );
}
