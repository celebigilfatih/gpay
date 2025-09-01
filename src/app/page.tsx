"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <>
      <Navbar />
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-10">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            Finansal Danışmanlık Uygulaması
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Müşterilerinizi yönetin, hisse senedi işlemlerini takip edin ve komisyon hesaplamalarını otomatikleştirin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {status === "unauthenticated" ? (
              <>
                <Button size="lg" asChild>
                  <Link href="/login">Giriş Yap</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/register">Kayıt Ol</Link>
                </Button>
              </>
            ) : status === "authenticated" ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">Gösterge Paneline Git</Link>
              </Button>
            ) : (
              <p>Yükleniyor...</p>
            )}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
          <div className="flex flex-col items-center text-center p-6 border rounded-lg">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Müşteri Yönetimi</h3>
            <p className="text-muted-foreground">
              Müşterilerinizin bilgilerini kolayca yönetin ve takip edin.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 border rounded-lg">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M12 20V10"></path>
                <path d="M18 20V4"></path>
                <path d="M6 20v-6"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">İşlem Takibi</h3>
            <p className="text-muted-foreground">
              Hisse senedi alım-satım işlemlerini takip edin ve kar hesaplamasını otomatikleştirin.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 border rounded-lg">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M16 8h-6.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H6"></path>
                <path d="M12 18v2"></path>
                <path d="M12 4v2"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Komisyon Hesaplama</h3>
            <p className="text-muted-foreground">
              Karlı işlemlerden otomatik olarak %30 komisyon hesaplayın.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
