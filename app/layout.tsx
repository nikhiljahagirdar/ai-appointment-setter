import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Appointment Setter",
  description:
    "Voice-ready appointment booking with Supabase availability checks and plan-based AI controls."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
