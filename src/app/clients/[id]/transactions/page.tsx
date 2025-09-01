"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

type Client = {
  id: string;
  fullName: string;
  phoneNumber: string;
  brokerageFirm: string;
  city: string;
};

type Stock = {
  id: string;
  symbol: string;
  name: string;
};

type Transaction = {
  id: string;
  type: "BUY" | "SELL";
  lots: number;
  price: number;
  date: string;
  brokerageFirm: string;
  profit: number | null;
  commission: number | null;
  notes: string | null;
  stock: Stock;
  broker?: {
    id: string;
    name: string;
  };
  buyTransaction?: {
    id: string;
    date: string;
    price: number;
    lots: number;
    stock: {
      symbol: string;
    };
  };
};

export default function ClientTransactionsPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchClientData();
    }
  }, [status, clientId, router]);

  const fetchClientData = async () => {
    try {
      // Fetch client details with credentials included for cookie-based auth
      const clientResponse = await fetch(`/api/clients/${clientId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!clientResponse.ok) {
        throw new Error("Failed to fetch client");
      }
      const clientData = await clientResponse.json();
      setClient(clientData);

      // Fetch client transactions
      const transactionsResponse = await fetch(`/api/transactions?clientId=${clientId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!transactionsResponse.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error fetching data:", error);
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

  if (!client) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <p>Müşteri bulunamadı.</p>
          <Button asChild className="mt-4">
            <Link href="/clients">Müşteri Listesine Dön</Link>
          </Button>
        </div>
      </>
    );
  }

  // Calculate total profit and commission
  const totalProfit = transactions
    .filter(t => t.profit !== null)
    .reduce((sum, t) => sum + (t.profit || 0), 0);
  
  const totalCommission = transactions
    .filter(t => t.commission !== null)
    .reduce((sum, t) => sum + (t.commission || 0), 0);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{client.fullName} - İşlemler</h1>
            <p className="text-muted-foreground">{client.brokerageFirm}, {client.city}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/clients/${clientId}`}>Müşteri Detayları</Link>
            </Button>
            <Button asChild>
              <Link href={`/clients/${clientId}/transactions/new`}>Yeni İşlem Ekle</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam İşlem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{totalProfit.toLocaleString('tr-TR')} ₺</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Komisyon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{totalCommission.toLocaleString('tr-TR')} ₺</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>İşlem Geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p>Henüz işlem bulunmamaktadır.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Hisse</TableHead>
                    <TableHead>İşlem</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Fiyat</TableHead>
                    <TableHead>Aracı Kurum</TableHead>
                    <TableHead>Alış Referansı</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Kar</TableHead>
                    <TableHead>Komisyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell>{transaction.stock.symbol}</TableCell>
                      <TableCell>
                        <span className={transaction.type === "BUY" ? "text-green-600" : "text-red-600"}>
                          {transaction.type === "BUY" ? "ALIŞ" : "SATIŞ"}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.lots}</TableCell>
                      <TableCell>{transaction.price.toLocaleString('tr-TR')} ₺</TableCell>
                      <TableCell>{transaction.broker?.name || transaction.brokerageFirm || "-"}</TableCell>
                      <TableCell>
                        {transaction.buyTransaction ? (
                          <div className="text-sm">
                            <div>{transaction.buyTransaction.stock.symbol}</div>
                            <div className="text-muted-foreground">
                              {new Date(transaction.buyTransaction.date).toLocaleDateString('tr-TR')} - {transaction.buyTransaction.lots} lot - ₺{transaction.buyTransaction.price}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{(transaction.lots * transaction.price).toLocaleString('tr-TR')} ₺</TableCell>
                      <TableCell>
                        {transaction.profit !== null ? (
                          <span className={transaction.profit >= 0 ? "text-green-600" : "text-red-600"}>
                            {transaction.profit.toLocaleString('tr-TR')} ₺
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.commission !== null ? (
                          <span className="text-blue-600">
                            {transaction.commission.toLocaleString('tr-TR')} ₺
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}