import type { Metadata } from "next";
import { GuestSurveyApp } from "@/components/guest/GuestSurveyApp";

export const metadata: Metadata = {
  title: "《大学生不必看》嘉宾沟通问卷",
  description: "给潜在嘉宾填写的录制前沟通表，用来了解你想聊什么、能聊到什么程度，以及哪些边界需要被保护。"
};

export default function GuestPage() {
  return <GuestSurveyApp />;
}
