"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, Control } from "react-hook-form";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type Client = {
  id: string;
  fullName: string;
};

type Broker = {
  id: string;
  name: string;
};

type BuyTransaction = {
  id: string;
  date: string;
  lots: number;
  price: number;
  stock: {
    symbol: string;
    name: string;
  };
  broker?: {
    id: string;
    name: string;
  } | null;
};

type Stock = {
  id: string;
  symbol: string;
  name: string;
};

type ClientPosition = {
  stockId: string;
  stock: Stock;
  broker: Broker | null;
  availableLots: number;
  averagePrice: number;
};

// Base schema - will be extended dynamically
const baseTransactionSchema = z.object({
  stockId: z.string().min(1, "Hisse seçimi zorunludur"),
  type: z.enum(["BUY", "SELL"], {
    message: "İşlem tipi seçimi zorunludur",
  }),
  lots: z.coerce.number().positive("Lot sayısı pozitif bir sayı olmalıdır"),
  price: z.coerce.number().positive("Fiyat pozitif bir sayı olmalıdır"),
  date: z.string().min(1, "Tarih seçimi zorunludur"),
  brokerId: z.string().optional(),
  buyTransactionId: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof baseTransactionSchema>;

export default function NewTransactionPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [buyTransactions, setBuyTransactions] = useState<BuyTransaction[]>([]);
  const [clientPositions, setClientPositions] = useState<ClientPosition[]>([]);
  const [selectedType, setSelectedType] = useState<"BUY" | "SELL">("BUY");
  const [submitting, setSubmitting] = useState(false);
  const { status } = useSession();
  const router = useRouter();



  const form = useForm({
    resolver: zodResolver(baseTransactionSchema),
    defaultValues: {
      stockId: "",
      type: "BUY" as const,
      lots: 0,
      price: 0,
      date: new Date().toISOString().split("T")[0],
      brokerId: "",
      buyTransactionId: "",
      notes: "",
    },
  });

  const selectedStockId = form.watch("stockId");
  const selectedBuyTransactionId = form.watch("buyTransactionId");

  // Seçilen alış işlemine göre aracı kurum bilgisini otomatik doldur
  useEffect(() => {
    if (selectedBuyTransactionId && buyTransactions.length > 0) {
      const selectedBuyTransaction = buyTransactions.find(tx => tx.id === selectedBuyTransactionId);
      if (selectedBuyTransaction && selectedBuyTransaction.broker) {
        form.setValue("brokerId", selectedBuyTransaction.broker.id);
      }
    }
  }, [selectedBuyTransactionId, buyTransactions, form]);

  const fetchData = useCallback(async () => {
    try {
      // Fetch client details
      const clientResponse = await fetch(`/api/clients/${clientId}`, {
        credentials: 'include'
      });
      if (!clientResponse.ok) {
        throw new Error("Failed to fetch client");
      }
      const clientData = await clientResponse.json();
      setClient(clientData);

      // Fetch stocks
      const stocksResponse = await fetch("/api/stocks");
      if (!stocksResponse.ok) {
        throw new Error("Failed to fetch stocks");
      }
      const stocksData = await stocksResponse.json();
      setStocks(stocksData);

      // Fetch brokers
      const brokersResponse = await fetch("/api/brokers");
      if (!brokersResponse.ok) {
        throw new Error("Failed to fetch brokers");
      }
      const brokersData = await brokersResponse.json();
      setBrokers(brokersData);

      // Fetch client positions
      const positionsResponse = await fetch(`/api/clients/${clientId}/positions`);
      if (!positionsResponse.ok) {
        throw new Error("Failed to fetch positions");
      }
      const positionsData = await positionsResponse.json();
      setClientPositions(positionsData);

      // Fetch buy transactions for SELL operations
      const buyTransactionsResponse = await fetch(`/api/clients/${clientId}/buy-transactions`);
      if (!buyTransactionsResponse.ok) {
        throw new Error("Failed to fetch buy transactions");
      }
      const buyTransactionsData = await buyTransactionsResponse.json();
      setBuyTransactions(buyTransactionsData);

    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Veri yüklenirken hata oluştu: " + (error as Error).message);
    }
  }, [clientId]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, fetchData]);

  const onSubmit = async (data: TransactionFormValues) => {
    if (!client) return;
    
    // Basic validation for SELL transactions
    if (data.type === "SELL" && data.stockId) {
      const selectedPosition = clientPositions.find(pos => pos.stockId === data.stockId);
      if (selectedPosition && data.lots > selectedPosition.availableLots) {
        form.setError("lots", {
          message: "Yetersiz lot! Mevcut lot sayınızdan fazla satış yapamazsınız."
        });
        return;
      }
    }
    
    setSubmitting(true);
    try {
      // Eğer satış işlemi ise ve brokerId seçilmediyse, bu alanı gönderme
      const formData = {...data};
      if (data.type === "SELL" && !data.brokerId) {
        delete formData.brokerId;
      }

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          clientId: client.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "İşlem kaydedilemedi");
      }

      router.push(`/clients/${clientId}/transactions`);
    } catch (error) {
      console.error("Error submitting transaction:", error);
      alert("İşlem kaydedilemedi: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
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

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Yeni İşlem Ekle</h1>
            <p className="text-muted-foreground">{client.fullName}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}/transactions`}>İşlemlere Dön</Link>
          </Button>
        </div>

        {/* Satılabilir Lotlar ve Aracı Kurumlar Card'ları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Satılabilir Lotlar */}
          <Card>
            <CardHeader>
              <CardTitle>Satılabilir Lotlar</CardTitle>
            </CardHeader>
            <CardContent>
              {clientPositions.length > 0 ? (
                <div className="space-y-2">
                  {clientPositions.map((position) => (
                    <div key={`${position.stockId}-${position.broker?.id || 'null'}`} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{position.stock.symbol}</span>
                        {position.broker && <span className="text-sm text-gray-500 ml-2">({position.broker.name})</span>}
                      </div>
                      <span className="font-bold text-green-600">{position.availableLots} lot</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Satılabilir lot bulunmamaktadır.</p>
              )}
            </CardContent>
          </Card>

          {/* Aracı Kurumlar */}
          <Card>
            <CardHeader>
              <CardTitle>Aracı Kurumlar</CardTitle>
            </CardHeader>
            <CardContent>
              {brokers.length > 0 ? (
                <div className="space-y-2">
                  {brokers.map((broker) => (
                    <div key={broker.id} className="p-2 bg-blue-50 rounded">
                      <span className="font-medium">{broker.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Aracı kurum bulunmamaktadır.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>İşlem Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İşlem Tipi</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setSelectedType(e.target.value as "BUY" | "SELL");
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="BUY">ALIŞ</option>
                          <option value="SELL">SATIŞ</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as unknown as Control<TransactionFormValues>}
                  name="stockId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hisse Senedi</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Hisse seçiniz</option>
                          {stocks.map((stock) => (
                            <option key={stock.id} value={stock.id}>
                              {stock.symbol} - {stock.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedType === "SELL" && buyTransactions.length > 0 && (
                  <FormField
                    control={form.control as unknown as Control<TransactionFormValues>}
                    name="buyTransactionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hangi Alış İşleminden Satış? (Opsiyonel)</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Alış işlemi seçiniz (opsiyonel)</option>
                            {buyTransactions.map((buyTx) => (
                              <option key={buyTx.id} value={buyTx.id}>
                                {buyTx.stock.symbol} - {buyTx.lots} lot - {new Date(buyTx.date).toLocaleDateString('tr-TR')} - ₺{buyTx.price} - {buyTx.broker?.name || ""}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="brokerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aracı Kurum</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Aracı kurum seçiniz</option>
                          {brokers.map((broker) => (
                            <option key={broker.id} value={broker.id}>
                              {broker.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="lots"
                    render={({ field }) => {
                      const selectedStockId = form.watch("stockId");
                      const selectedPosition = clientPositions.find(pos => pos.stockId === selectedStockId);
                      const availableLots = selectedPosition?.availableLots || 0;
                      const currentLots = Number(field.value) || 0;
                      const isOverLimit = selectedType === "SELL" && selectedStockId && currentLots > availableLots;
                      
                      return (
                        <FormItem>
                          <FormLabel>Lot</FormLabel>
                          <FormControl>
                            <Input
                               type="number"
                               placeholder="Lot sayısı giriniz"
                               value={field.value?.toString() || ""}
                               onChange={(e) =>
                                 field.onChange(parseInt(e.target.value) || undefined)
                               }
                               onBlur={field.onBlur}
                               name={field.name}
                               ref={field.ref}
                               className={isOverLimit ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                             />
                          </FormControl>
                          {selectedType === "SELL" && selectedStockId && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Mevcut lot sayınız: <span className="font-medium text-green-600">{availableLots}</span>
                              </p>
                              {isOverLimit && (
                                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-sm text-red-700 font-medium">
                                    Yetersiz lot! Maksimum {availableLots} lot satabilirsiniz.
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control as unknown as Control<TransactionFormValues>}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fiyat (₺)</FormLabel>
                        <FormControl>
                          <Input
                             type="number"
                             step="0.01"
                             placeholder="Fiyat"
                             value={field.value?.toString() || ""}
                             onChange={field.onChange}
                             onBlur={field.onBlur}
                             name={field.name}
                             ref={field.ref}
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control as unknown as Control<TransactionFormValues>}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İşlem Tarihi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar</FormLabel>
                      <FormControl>
                        <Input placeholder="İşlem hakkında notlar (opsiyonel)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={submitting || (selectedType === "SELL" && selectedStockId && (() => {
                      const selectedStock = clientPositions.find(pos => pos.stockId === selectedStockId);
                      const currentLots = Number(form.watch("lots")) || 0;
                      return selectedStock ? currentLots > selectedStock.availableLots : false;
                    })()) || false}
                    className={
                      selectedType === "SELL" && selectedStockId && (() => {
                        const selectedStock = clientPositions.find(pos => pos.stockId === selectedStockId);
                        const currentLots = Number(form.watch("lots")) || 0;
                        return selectedStock ? currentLots > selectedStock.availableLots : false;
                      })() 
                        ? "bg-red-500 hover:bg-red-600 cursor-not-allowed" 
                        : ""
                    }
                  >
                    {submitting ? "Kaydediliyor..." : "İşlemi Kaydet"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}