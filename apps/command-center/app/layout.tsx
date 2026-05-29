import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "VOC Command Center",
  description: "Local-first Virtual Operations Command dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
