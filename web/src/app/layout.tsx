import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "GAMOS STORE - Jelajahi Koleksi",
    template: "%s | GAMOS STORE",
  },
  description: "Jual & instalasi game PC/Laptop, ribuan koleksi siap pakai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} antialiased`}>
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}
