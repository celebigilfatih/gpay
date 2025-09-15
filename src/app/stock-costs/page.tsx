"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Client = {
  id: string;
  fullName: string;
};

type Broker = {
  id: string;
  name: string;
};

type Stock = {
  id: string;
  symbol: string;
  name: string;
};

type Purchase = {
  lots: number;
  price: number;
  totalCost: number;
};

type ClientCost = {
  client: Client;
  broker: Broker | null;
  totalLots: number;
  purchasePrice: number;
  purchases: Purchase[];
};

type StockCost = {
  stock: Stock;
  clients: ClientCost[];
};

export default function StockCostsPage() {
  const [stockCosts, setStockCosts] = useState<StockCost[]>([]);
  const [loading, setLoading] = useState(true);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchStockCosts();
    }
  }, [status, router]);

  const fetchStockCosts = async () => {
    try {
      const response = await fetch("/api/stock-costs");
      if (!response.ok) {
        throw new Error("Failed to fetch stock costs");
      }
      const data = await response.json();
      setStockCosts(data);
    } catch (error) {
      console.error("Error fetching stock costs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("tr-TR").format(num);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Hisse Bazlı Müşteri Maliyetleri</h1>
        <p className="text-muted-foreground">
          Müşterilerinizin hisse senetlerindeki pozisyonlarını ve maliyetlerini görüntüleyin.
        </p>
      </div>

      {stockCosts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Henüz hisse pozisyonu bulunmuyor.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {stockCosts.map((stockCost) => {
            const totalStockValue = stockCost.clients.reduce(
              (sum, client) => sum + client.purchases.reduce((pSum, p) => pSum + p.totalCost, 0),
              0
            );
            const totalLots = stockCost.clients.reduce(
              (sum, client) => sum + client.totalLots,
              0
            );

            return (
              <Card key={stockCost.stock.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {stockCost.stock.symbol}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {stockCost.stock.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Toplam Değer</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(totalStockValue)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(totalLots)} lot
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Aracı Kurum</TableHead>
                        <TableHead className="text-right">Alış Lot Adedi</TableHead>
                        <TableHead className="text-right">Alış Fiyatı</TableHead>
                        <TableHead className="text-right">Alış Maliyeti</TableHead>
                        <TableHead className="text-right">Net Lot</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockCost.clients.map((clientCost, clientIndex) => 
                        clientCost.purchases.map((purchase, purchaseIndex) => (
                          <TableRow key={`${clientCost.client.id}-${clientIndex}-${purchaseIndex}`}>
                            <TableCell className="font-medium">
                              {purchaseIndex === 0 ? clientCost.client.fullName : ''}
                            </TableCell>
                            <TableCell>
                              {purchaseIndex === 0 ? (
                                clientCost.broker ? (
                                  <Badge variant="outline">
                                    {clientCost.broker.name}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )
                              ) : ''}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(purchase.lots)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(purchase.price)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(purchase.totalCost)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {purchaseIndex === 0 ? formatNumber(clientCost.totalLots) : ''}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}