import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar, Topbar } from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "RiskPilot — AI Payment & Merchant Risk Management Console",
  description:
    "AI-powered transaction risk scoring, investigation, automated rules engine, and fraud mitigation platform for modern fintech.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-[#eef4f0] text-slate-900 min-h-screen flex antialiased selection:bg-black selection:text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#eef4f0]">
          <Topbar />
          <main className="flex-1 p-6 lg:p-8 bg-[#eef4f0]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
