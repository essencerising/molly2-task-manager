import type { Metadata } from "next";
import { Toaster } from 'sonner';
import { Inter } from "next/font/google";
import "./globals.css";

// Inter font - excellent Hungarian character support
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"], // latin-ext for Hungarian characters (á, é, í, ó, ö, ő, ú, ü, ű)
  display: "swap",
});

export const metadata: Metadata = {
  title: "Molly - Task Management",
  description: "Professional task management for teams and individuals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#f1f5f9',
            },
          }}
        />
      </body>
    </html>
  );
}
