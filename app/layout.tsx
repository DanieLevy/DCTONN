import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent hydration errors from simulator modifications
              if (typeof window !== 'undefined') {
                // Remove any simulator-added attributes that could cause hydration errors
                document.addEventListener('DOMContentLoaded', function() {
                  const body = document.body;
                  if (body.hasAttribute('data-js')) {
                    body.removeAttribute('data-js');
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
