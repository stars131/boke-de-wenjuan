import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "《大学生不必看》选题问卷",
  description: "我们想聊一点大学里不总被认真讨论的事。匿名填写，帮助决定第一季选题。",
  openGraph: {
    title: "《大学生不必看》选题问卷",
    description:
      "不是学习方法，不是成功经验，而是那些你可能经历过、困惑过、但很少有人认真聊的东西。",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
