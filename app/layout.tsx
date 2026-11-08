import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Nest | Your Place to Gather",
  description: "A warm, flexible private venue for meetings, workshops, networking, celebrations, photography, and community events.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
