import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SYS-DP | Departamento Pessoal",
  description: "Sistema completo de Departamento Pessoal e RH para escritórios contábeis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="font-sans antialiased h-full bg-gray-50">{children}</body>
    </html>
  );
}
