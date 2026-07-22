import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DormCare",
  description: "Dormitory Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
