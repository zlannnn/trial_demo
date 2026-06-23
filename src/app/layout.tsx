import type { Metadata } from "next";

import "~/styles/globals.css";

export const metadata: Metadata = {
  title: "AI Voice Assistant",
  description: "AI-powered voice assistant with ChatGPT-style interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
