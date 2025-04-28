import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAIST Server Status Monitor",
  description: "KAIST Server Status Monitor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
