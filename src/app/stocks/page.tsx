"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

type Stock = {
  id: string;
  symbol: string;
  name: string;
};

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchStocks();
    }
  }, [status, router]);

  const fetchStocks = async () => {
    try {
      const response = await fetch("/api/stocks");
      if (!response.ok) {
        throw new Error("Failed to fetch stocks");
      }
      const data = await response.json();
      setStocks(data);
    } catch (error) {
      console.error("Error fetching stocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stockId: string, stockSymbol: string) => {
    if (!confirm(`${stockSymbol} hisse senedini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    setDeleting(stockId);
    try {
      const response = await fetch(`/api/stocks/${stockId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Hisse senedi silinemedi");
      }

      // Refresh the stocks list
      await fetchStocks();
    } catch (error) {
      console.error("Error deleting stock:", error);
      alert("Hisse senedi silinemedi: " + (error as Error).message);
    } finally {
      setDeleting(null);
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

  return (
    <>
      <Navbar />
      <div className="container py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Hisse Senetleri</h1>
          <Button asChild>
            <Link href="/stocks/new">Yeni Hisse Senedi Ekle</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hisse Senedi Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            {stocks.length === 0 ? (
              <p>Henüz hisse senedi bulunmamaktadır.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sembol</TableHead>
                    <TableHead>İsim</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.symbol}</TableCell>
                      <TableCell>{stock.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/stocks/${stock.id}`}>Düzenle</Link>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(stock.id, stock.symbol)}
                            disabled={deleting === stock.id}
                          >
                            {deleting === stock.id ? "Siliniyor..." : "Sil"}
                          </Button>
                        </div>
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