import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Appointment Setter",
  description:
    "Voice-ready appointment booking with Supabase availability checks and plan-based AI controls."
};

export default function RootLayout({
  children
  title: "AI Voice Appointment Setter",
  description: "Book appointments with optional AI voice automation and Supabase availability checks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
      <body className="antialiased">{children}</body>
    </html>
  );
}
