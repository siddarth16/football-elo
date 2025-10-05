import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Football ELO Prediction System",
  description: "Advanced ELO-based football match prediction system for top 5 European leagues",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="bg-black text-white py-6 mt-12 border-t-8 border-black">
          <div className="container mx-auto px-4 text-center">
            <p className="font-bold uppercase text-sm">
              Football ELO Prediction System © 2025
            </p>
            <p className="text-xs mt-2 text-gray-400">
              Top 5 European Leagues • 2024-25 & 2025-26 Seasons
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
