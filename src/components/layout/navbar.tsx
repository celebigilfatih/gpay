"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            Gain Stock & Payment
          </Link>
          {session && (
            <div className="hidden md:flex gap-4">
              <Link href="/dashboard">Gösterge Paneli</Link>
              <Link href="/clients">Müşteriler</Link>
              <Link href="/my-brokers">Aracı Kurumlarım</Link>
              <Link href="/transactions">İşlemler</Link>
              <Link href="/stocks">Hisse Senetleri</Link>
            </div>
          )}
        </div>
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <span>Hoş geldiniz, {session.user?.name}</span>
              <Button variant="outline" onClick={() => signOut()}>
                Çıkış Yap
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/login">Giriş Yap</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Kayıt Ol</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}