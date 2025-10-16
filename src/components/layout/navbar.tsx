"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              Gain Stock & Payment
            </Link>
            {session && (
              <div className="hidden md:flex gap-4">
                <Link href="/clients">Müşteriler</Link>
                <Link href="/transactions">İşlemler</Link>
                <Link href="/stocks">Hisse Senetleri</Link>
                <Link href="/stock-costs">Hisse Maliyetleri</Link>
                <Link href="/collections">Tahsilatlar</Link>
                <Link href="/brokers">Aracı Kurumlar</Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <div className="hidden md:flex items-center gap-4">
                  <span className="text-sm">Hoş geldiniz, {session.user?.name}</span>
                  <Button variant="outline" onClick={() => signOut()}>
                    Çıkış Yap
                  </Button>
                </div>
                
                {/* Mobile menu button */}
                <button
                  onClick={toggleMobileMenu}
                  className="md:hidden p-2 rounded-md hover:bg-gray-100"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/login">Giriş Yap</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Kayıt Ol</Link>
                  </Button>
                </div>
                
                {/* Mobile menu button for non-authenticated users */}
                <button
                  onClick={toggleMobileMenu}
                  className="md:hidden p-2 rounded-md hover:bg-gray-100"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {session ? (
                <>
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100"
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>
              <Link
                href="/clients"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100"
                onClick={closeMobileMenu}
              >
                Müşteriler
              </Link>
              <Link
                href="/transactions"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100"
                onClick={closeMobileMenu}
              >
                İşlemler
              </Link>
              <Link
                href="/stocks"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100"
                onClick={closeMobileMenu}
              >
                Hisse Senetleri
              </Link>
              <Link
                href="/stock-costs"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100"
                onClick={closeMobileMenu}
              >
                Hisse Maliyetleri
              </Link>
              <Link
                href="/collections"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100"
                onClick={closeMobileMenu}
              >
                Tahsilatlar
              </Link>
              <Link
                href="/brokers"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100"
                onClick={closeMobileMenu}
              >
                Aracı Kurumlar
              </Link>
              
              {/* Mobile user info and logout */}
              <div className="border-t pt-4 mt-4">
                <div className="px-3 py-2">
                  <p className="text-sm text-gray-600">Hoş geldiniz,</p>
                  <p className="text-sm font-medium">{session.user?.name}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    closeMobileMenu();
                    signOut();
                  }}
                  className="mx-3 mt-2 w-[calc(100%-1.5rem)]"
                >
                  Çıkış Yap
                </Button>
              </div>
                </>
              ) : (
                <>
                  <div className="px-3 py-2 space-y-2">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/login" onClick={closeMobileMenu}>Giriş Yap</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/register" onClick={closeMobileMenu}>Kayıt Ol</Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}