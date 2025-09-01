"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

type DashboardStats = {
  totalClients: number;
  totalTransactions: number;
  totalProfit: number;
  totalCommission: number;
  recentTransactions: Array<{
    id: string;
    clientName: string;
    clientId: string;
    stockSymbol: string;
    type: "BUY" | "SELL";
    lots: number;
    price: number;
    date: string;
    profit: number | null;
    commission: number | null;
  }>;
  topClients: Array<{
    id: string;
    fullName: string;
    totalProfit: number;
    totalCommission: number;
    transactionCount: number;
  }>;
};

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
    }

    if (status === "authenticated") {
      fetchDashboardStats();
    }
  }, [status, router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <p>Yükleniyor...</p>
        </div>
      </>
    );
  }

  if (status === "unauthenticated") {
    return (
      <>
        <Navbar />
        <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-10">
          <div className="max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              Gain Stock & Payment
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Müşterilerinizi yönetin, hisse senedi işlemlerini takip edin ve komisyon hesaplamalarını otomatikleştirin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/login">Giriş Yap</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Kayıt Ol</Link>
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!stats) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <p>İstatistikler yüklenemedi.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Gösterge Paneli</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalClients}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam İşlem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.totalProfit.toLocaleString('tr-TR')} ₺</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Komisyon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.totalCommission.toLocaleString('tr-TR')} ₺</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Son İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentTransactions.length === 0 ? (
                <p>Henüz işlem bulunmamaktadır.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Tarih</TableHead>
                      <TableHead className="text-left">Müşteri</TableHead>
                      <TableHead className="text-center">Hisse</TableHead>
                      <TableHead className="text-center">İşlem</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-left">{new Date(transaction.date).toLocaleDateString('tr-TR')}</TableCell>
                        <TableCell className="text-left">
                          <Link href={`/clients/${transaction.clientId}`} className="text-blue-600 hover:underline">
                            {transaction.clientName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-center font-medium">{transaction.stockSymbol}</TableCell>
                        <TableCell className="text-center">
                          <span className={transaction.type === "BUY" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {transaction.type === "BUY" ? "ALIŞ" : "SATIŞ"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{(transaction.lots * transaction.price).toLocaleString('tr-TR')} ₺</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/transactions">Tüm İşlemleri Görüntüle</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>En İyi Müşteriler</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topClients.length === 0 ? (
                <p>Henüz müşteri bulunmamaktadır.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Müşteri</TableHead>
                      <TableHead className="text-center">İşlem Sayısı</TableHead>
                      <TableHead className="text-right">Toplam Kar</TableHead>
                      <TableHead className="text-right">Toplam Komisyon</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="text-left">
                          <Link href={`/clients/${client.id}`} className="text-blue-600 hover:underline">
                            {client.fullName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-center font-medium">{client.transactionCount}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">{client.totalProfit.toLocaleString('tr-TR')} ₺</TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">{client.totalCommission.toLocaleString('tr-TR')} ₺</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/clients">Tüm Müşterileri Görüntüle</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
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
