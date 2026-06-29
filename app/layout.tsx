import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARKADE // Terminal Console",
  description: "A retro-futuristic arcade terminal with fast-paced minigames. CipherCalc and Spectrum Snake await.",
  keywords: ["arcade", "minigames", "retro", "terminal", "snake", "calculator", "puzzle"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
