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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
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
        <div className="container py-10">
          <p>Yükleniyor...</p>
        </div>
      </>
    );
  }

  if (!stats) {
    return (
      <>
        <Navbar />
        <div className="container py-10">
          <p>İstatistikler yüklenemedi.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container py-10">
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
                      <TableHead>Tarih</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Hisse</TableHead>
                      <TableHead>İşlem</TableHead>
                      <TableHead>Tutar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.date).toLocaleDateString('tr-TR')}</TableCell>
                        <TableCell>
                          <Link href={`/clients/${transaction.clientId}`} className="text-blue-600 hover:underline">
                            {transaction.clientName}
                          </Link>
                        </TableCell>
                        <TableCell>{transaction.stockSymbol}</TableCell>
                        <TableCell>
                          <span className={transaction.type === "BUY" ? "text-green-600" : "text-red-600"}>
                            {transaction.type === "BUY" ? "ALIŞ" : "SATIŞ"}
                          </span>
                        </TableCell>
                        <TableCell>{(transaction.lots * transaction.price).toLocaleString('tr-TR')} ₺</TableCell>
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
                      <TableHead>Müşteri</TableHead>
                      <TableHead>İşlem Sayısı</TableHead>
                      <TableHead>Toplam Kar</TableHead>
                      <TableHead>Toplam Komisyon</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <Link href={`/clients/${client.id}`} className="text-blue-600 hover:underline">
                            {client.fullName}
                          </Link>
                        </TableCell>
                        <TableCell>{client.transactionCount}</TableCell>
                        <TableCell className="text-green-600">{client.totalProfit.toLocaleString('tr-TR')} ₺</TableCell>
                        <TableCell className="text-blue-600">{client.totalCommission.toLocaleString('tr-TR')} ₺</TableCell>
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