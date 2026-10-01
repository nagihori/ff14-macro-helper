import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 親ディレクトリ（/usr/local/Projects）に別の package-lock.json があり、ルートを取り違えるため明示する。
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
