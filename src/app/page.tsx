"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// Lazy load heavy components
const Table = dynamic(() => import("@/components/ui/table").then(mod => ({ default: mod.Table })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
});
const TableBody = dynamic(() => import("@/components/ui/table").then(mod => ({ default: mod.TableBody })));
const TableCell = dynamic(() => import("@/components/ui/table").then(mod => ({ default: mod.TableCell })));
const TableHead = dynamic(() => import("@/components/ui/table").then(mod => ({ default: mod.TableHead })));
const TableHeader = dynamic(() => import("@/components/ui/table").then(mod => ({ default: mod.TableHeader })));
const TableRow = dynamic(() => import("@/components/ui/table").then(mod => ({ default: mod.TableRow })));

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
  const { status } = useSession();
  const router = useRouter();

  // Memoize expensive calculations - moved to top to maintain hook order
  const memoizedStats = useMemo(() => stats, [stats]);

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
          {/* Optimized loading state with skeleton */}
          <div className="space-y-6">
            <div className="h-10 bg-gray-200 rounded animate-pulse w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
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
            {/* Optimized LCP element with priority rendering */}
            <h1 
              className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 will-change-transform"
              style={{ 
                fontDisplay: 'swap',
                textRendering: 'optimizeSpeed',
                contain: 'layout style paint'
              }}
            >
              Gain Stock & Payment
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Müşterilerinizi yönetin, hisse senedi işlemlerini takip edin ve komisyon hesaplamalarını otomatikleştirin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/login" prefetch={true}>Giriş Yap</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register" prefetch={true}>Kayıt Ol</Link>
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
        {/* Optimized LCP element for dashboard */}
        <h1 
          className="text-3xl font-bold mb-6 will-change-transform"
          style={{ 
            fontDisplay: 'swap',
            textRendering: 'optimizeSpeed',
            contain: 'layout style paint'
          }}
        >
          Gösterge Paneli
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{memoizedStats?.totalClients}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam İşlem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{memoizedStats?.totalTransactions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{memoizedStats?.totalProfit.toLocaleString('tr-TR')} ₺</p>
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


      </div>
    </>
  );
}
