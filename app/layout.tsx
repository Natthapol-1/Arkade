import type { Metadata } from "next";
import "./globals.css";
import DisableContextMenu from "@/components/DisableContextMenu";

export const metadata: Metadata = {
  title: "ARKADE // Terminal Console",
  description: "A retro-futuristic arcade terminal with fast-paced minigames. CipherCalc and Painting Python await.",
  keywords: ["arcade", "minigames", "retro", "terminal", "snake", "calculator", "puzzle"],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ARKADE',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <DisableContextMenu />
        {children}
      </body>
    </html>
  );
}
