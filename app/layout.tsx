import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "Dormitory",
  description: "Dormitory Management System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className="relative min-h-dvh overflow-x-hidden">
        <BackgroundBlobs />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
