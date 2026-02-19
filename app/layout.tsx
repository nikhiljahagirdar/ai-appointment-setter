import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/radix/Toaster";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VOICEBOOK | AI Appointment Setter",
  description:
    "The world's first multi-tenant AI Voice Appointment platform. Automate your bookings with ultra-realistic AI agents."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <Header />
        <div className="pt-20">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
