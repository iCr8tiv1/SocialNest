import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book the Nest | Social Nest",
  description: "Plan a Social Nest gathering by choosing your purpose, package, preferred date, guest count, and optional enhancements.",
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
