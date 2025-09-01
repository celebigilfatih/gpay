"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
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
};

type Stock = {
  id: string;
  symbol: string;
  name: string;
};

const transactionSchema = z.object({
  stockId: z.string().min(1, "Hisse seçimi zorunludur"),
  type: z.enum(["BUY", "SELL"], {
    message: "İşlem tipi seçimi zorunludur",
  }),
  lots: z.coerce.number().positive("Lot sayısı pozitif bir sayı olmalıdır"),
  price: z.coerce.number().positive("Fiyat pozitif bir sayı olmalıdır"),
  date: z.string().min(1, "Tarih seçimi zorunludur"),
  brokerId: z.string().min(1, "Broker seçimi zorunludur"),
  buyTransactionId: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function NewTransactionPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [buyTransactions, setBuyTransactions] = useState<BuyTransaction[]>([]);
  const [selectedType, setSelectedType] = useState<"BUY" | "SELL">("BUY");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "BUY",
      lots: undefined,
      price: undefined,
      date: new Date().toISOString().split("T")[0],
      brokerId: "",
      buyTransactionId: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, clientId, router]);

  const fetchData = async () => {
    try {
      // Fetch client details
      const clientResponse = await fetch(`/api/clients/${clientId}`);
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

      // Fetch buy transactions for this client (for sell reference)
      const buyTransactionsResponse = await fetch(`/api/clients/${clientId}/transactions?type=BUY`);
      if (!buyTransactionsResponse.ok) {
        throw new Error("Failed to fetch buy transactions");
      }
      const buyTransactionsData = await buyTransactionsResponse.json();
      setBuyTransactions(buyTransactionsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TransactionFormValues) => {
    if (!client) return;
    
    setSubmitting(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
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

        <Card>
          <CardHeader>
            <CardTitle>İşlem Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="brokerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Broker</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Broker seçiniz</option>
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

                {selectedType === "SELL" && buyTransactions.length > 0 && (
                  <FormField
                    control={form.control}
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
                                {buyTx.stock.symbol} - {buyTx.lots} lot - {new Date(buyTx.date).toLocaleDateString('tr-TR')} - ₺{buyTx.price}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="lots"
                    render={({ field }) => (
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
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                  control={form.control}
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
                  <Button type="submit" disabled={submitting}>
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