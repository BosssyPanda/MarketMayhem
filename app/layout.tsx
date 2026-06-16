import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Pixelify_Sans } from "next/font/google";
import AppMotionConfig from "@/components/AppMotionConfig";
import "./globals.css";

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Market Mayhem: Farm Bots",
  description: "Learn Java by writing real code to automate a farming drone.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${pixelify.variable} ${jetbrains.variable}`}>
      <body>
        <AppMotionConfig>{children}</AppMotionConfig>
      </body>
    </html>
  );
}
