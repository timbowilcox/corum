import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corum — SMETA Compliance Advisor",
  description: "Stay continuously ready for your SMETA audit. AI-powered compliance advisor for food and agricultural suppliers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
