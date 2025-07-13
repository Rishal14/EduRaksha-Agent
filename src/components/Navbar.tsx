"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";

export default function Navbar() {
  const { data: session, status } = useSession();

  // Don't show navbar if not authenticated
  if (status === "loading" || !session) {
    return null;
  }

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 shadow-lg border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30 group-hover:bg-white/30 transition-all duration-300">
                <span className="text-white font-bold text-lg">ER</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white">EduRaksha Agent</span>
                <div className="text-xs text-blue-100 opacity-80">Privacy-Preserving Verification</div>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                Dashboard
              </Button>
            </Link>
            {/* <Link href="/verify">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                Verify
              </Button>
            </Link> */}
            <Link href="/ssi-wallet">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                SSI Wallet
              </Button>
            </Link>
            <Link href="/zkp-generator">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                ZKP Generator
              </Button>
            </Link>
            <Link href="/verifier">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                Verifier
              </Button>
            </Link>
            {/* <Link href="/didkit-demo">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                DIDKit Demo
              </Button>
            </Link> */}
            <Link href="/scholarship">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                Scholarships
              </Button>
            </Link>
            <Link href="/scholarship/dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                My Applications
              </Button>
            </Link>
            
            <Link href="/ai-test">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                AI Test
              </Button>
            </Link>
            <Link href="/translation-test">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                Translation Test
              </Button>
            </Link>
            {/* <Link href="/ocr-test">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                OCR Test
              </Button>
            </Link>
            <Link href="/income-test">
              <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border-transparent">
                Income Test
              </Button>
            </Link>
             */}
            {/* Auth Buttons */}
            <div className="ml-4">
              <AuthButtons />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 