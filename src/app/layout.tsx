import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduRaksha Agent - Privacy-Preserving Student Verification",
  description: "Decentralized student verification system using Zero-Knowledge Proofs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">ER</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">EduRaksha Agent</span>
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <Link href="/">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Link href="/verify">
                    <Button variant="ghost">Verify</Button>
                  </Link>
                  <Link href="/ssi-wallet">
                    <Button variant="ghost">SSI Wallet</Button>
                  </Link>
                  <Link href="/zkp-generator">
                    <Button variant="ghost">ZKP Generator</Button>
                  </Link>
                  <Link href="/verifier">
                    <Button variant="ghost">Verifier</Button>
                  </Link>
                  <Link href="/didkit-demo">
                    <Button variant="ghost">DIDKit Demo</Button>
                  </Link>
                  <Link href="/scholarship">
                    <Button variant="ghost">Scholarships</Button>
                  </Link>
                  <Link href="/scholarship/dashboard">
                    <Button variant="ghost">My Applications</Button>
                  </Link>
                  <Link href="/chat">
                    <Button variant="ghost">AI Assistant</Button>
                  </Link>
                  <Link href="/ai-test">
                    <Button variant="ghost">AI Test</Button>
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          
          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
