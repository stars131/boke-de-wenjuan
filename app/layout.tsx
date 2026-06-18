import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "《大学生不必看》问卷中心",
  description: "选择观众、嘉宾或管理员身份，进入对应问卷或后台。",
  openGraph: {
    title: "《大学生不必看》问卷中心",
    description:
      "观众问卷和嘉宾问卷分开填写，并可通过唯一昵称查询提交记录。",
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
