import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aura Cafe SaaS | Premium Contactless QR Ordering & Management Platform",
  description:
    "Empowering high-end cafes, specialty roasteries, and bistros with elegant contactless digital menus, real-time kitchen display, and automated table ordering.",
  keywords: ["cafe ordering", "qr code menu", "restaurant POS", "cafe management SaaS", "table ordering"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FAF5EC] text-[#24211F]">
        {children}
      </body>
    </html>
  );
}
