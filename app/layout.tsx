import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const intelOneDisplay = localFont({
  src: [
    {
      path: "../public/fonts/intelone-display-light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/intelone-display-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/intelone-display-medium.ttf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-intel-one",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Task Manager - Autonomous Vehicle Testing",
  description: "AI-powered task management for multi-location autonomous vehicle operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" 
        />
      </head>
      <body
        className={`${intelOneDisplay.variable} antialiased bg-gray-50 text-gray-900`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
