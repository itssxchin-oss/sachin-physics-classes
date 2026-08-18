import type { Metadata } from "next";
import localFont from "next/font/local";
import Navbar from "@/components/ui/Navbar";
import DoubtChatWidget from "@/components/ui/DoubtChatWidget";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Sachin Physics Classes",
  description:
    "Expert physics coaching for students — Learn, Practise, Excel with Sachin Physics Classes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100`}
      >
        <Navbar />
        {children}
        <DoubtChatWidget />
      </body>
    </html>
  );
}
