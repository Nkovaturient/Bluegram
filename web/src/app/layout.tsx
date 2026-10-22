import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { CaptionProvider } from "@/contexts/CaptionContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Bluegram — Earth System Telemetry & Trend Explorer",
  description:
    "Interactive 3D globe explorer surfacing statistically validated regional climate trends from NASA POWER with Mann-Kendall significance and Sen's slope.",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png", sizes: "1024x1024" }],
    shortcut: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png", sizes: "1024x1024" }],
  },
  openGraph: {
    title: "Bluegram — Earth System Telemetry & Trend Explorer",
    description:
      "Interactive 3D globe explorer surfacing statistically validated regional climate trends from NASA POWER with Mann-Kendall significance and Sen's slope.",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "Bluegram — Earth trends",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${mono.variable} ${display.variable} font-sans antialiased selection:bg-primary/25 selection:text-white`}
      >
        <CaptionProvider>{children}</CaptionProvider>
      </body>
    </html>
  );
}
