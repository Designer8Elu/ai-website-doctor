import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Ai Website Doctor",
  description:
    "Run a performance, SEO, image and broken-link audit on any public web page.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
