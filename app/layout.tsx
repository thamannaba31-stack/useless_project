import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Malayalam Meme AI 😂 — Upload a Photo, Get a Meme!",
  description:
    "Upload any photo and our AI instantly creates a funny split-screen Malayalam meme with the perfect reaction. Free, fast, and hilarious.",
  keywords: ["malayalam meme", "meme generator", "AI meme", "kerala meme", "funny meme"],
  openGraph: {
    title: "Malayalam Meme AI 😂",
    description: "Upload a photo. Let AI find the perfect Malayalam reaction.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ml" className={geist.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
