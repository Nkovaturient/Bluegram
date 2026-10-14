import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { CaptionProvider } from "@/contexts/CaptionContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Bluegram",
  description: "Surface temperature trends from NASA POWER, with a Mann-Kendall verdict.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased`}>
        <CaptionProvider>{children}</CaptionProvider>
      </body>
    </html>
  );
}
