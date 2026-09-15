import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

// Face utilitas khusus angka & data struk (total, qty, no. struk) supaya kolom rata dan
// terbaca seperti cetakan struk aslinya — bukan untuk body text.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StrukScan — OCR Struk & Manajemen Pengeluaran",
  description:
    "Foto struk belanja, biarkan AI yang catat. StrukScan mengekstrak item, harga, dan total secara otomatis.",
};

export const viewport: Viewport = {
  themeColor: "#2445d8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${mono.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
