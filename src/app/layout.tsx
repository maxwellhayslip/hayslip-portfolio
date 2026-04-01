import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guest Recovery Email Generator",
  description: "Hotel front desk tool for composing empathetic guest recovery emails",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
