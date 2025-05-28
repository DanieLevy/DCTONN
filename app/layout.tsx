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
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" 
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Prevent iOS zoom on input focus */
            @supports (-webkit-touch-callout: none) {
              input, textarea, select {
                font-size: 16px !important;
                transform: scale(1);
                transition: none;
              }
              
              input:focus, textarea:focus, select:focus {
                font-size: 16px !important;
                transform: scale(1);
              }
            }
            
            /* Ensure consistent input styling across devices */
            input, textarea, select {
              -webkit-appearance: none;
              -moz-appearance: none;
              appearance: none;
              border-radius: 6px;
            }
            
            /* Prevent iOS bounce scroll */
            body {
              position: fixed;
              overflow: hidden;
              width: 100%;
              height: 100vh;
              -webkit-overflow-scrolling: touch;
            }
            
            /* Allow scrolling in main content area */
            #main-content {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
            }
          `
        }} />
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
                  
                  // Additional iOS-specific fixes
                  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    // Prevent zoom on double tap
                    let lastTouchEnd = 0;
                    document.addEventListener('touchend', function (event) {
                      const now = (new Date()).getTime();
                      if (now - lastTouchEnd <= 300) {
                        event.preventDefault();
                      }
                      lastTouchEnd = now;
                    }, false);
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
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
