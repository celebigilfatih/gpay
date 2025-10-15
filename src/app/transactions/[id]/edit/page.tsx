"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  client: {
    id: string;
    fullName: string;
  };
  stock: {
    id: string;
    symbol: string;
    name: string;
  };
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

type Broker = {
  id: string;
  name: string;
  code: string;
};

type BuyTransaction = {
  id: string;
  date: string;
  price: number;
  lots: number;
  stock: {
    symbol: string;
  };
};

const transactionSchema = z.object({
  type: z.enum(["BUY", "SELL"]),
  lots: z.number().min(1, "Lot sayısı en az 1 olmalıdır"),
  price: z.number().min(0.01, "Fiyat 0'dan büyük olmalıdır"),
  date: z.string().min(1, "Tarih zorunludur"),
  brokerId: z.string().optional(),
  buyTransactionId: z.string().optional(),
  commission: z.number().optional(),
  profit: z.number().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function EditTransactionPage() {
  const params = useParams();
  const transactionId = params.id as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [buyTransactions, setBuyTransactions] = useState<BuyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "BUY",
      lots: 0,
      price: 0,
      date: "",
      brokerId: "",
      buyTransactionId: "",
      commission: 0,
      profit: 0,
      notes: "",
    },
  });

  const selectedType = form.watch("type");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, transactionId, router]);

  const fetchData = async () => {
    try {
      // Fetch transaction data
      const transactionResponse = await fetch(`/api/transactions/${transactionId}`);
      if (!transactionResponse.ok) {
        throw new Error("Failed to fetch transaction");
      }
      const transactionData = await transactionResponse.json();
      setTransaction(transactionData);

      // Set form values
      form.reset({
        type: transactionData.type,
        lots: transactionData.lots,
        price: transactionData.price,
        date: new Date(transactionData.date).toISOString().split("T")[0],
        brokerId: transactionData.brokerId || "",
        buyTransactionId: transactionData.buyTransactionId || "",
        commission: transactionData.commission || 0,
        profit: transactionData.profit || 0,
        notes: transactionData.notes || "",
      });

      // Fetch brokers - müşteriye kayıtlı olanlar
      const brokersResponse = await fetch(`/api/clients/${transactionData.client.id}/brokers`);
      if (brokersResponse.ok) {
        const brokersData = await brokersResponse.json();
        setBrokers(brokersData);
      }

      // If it's a SELL transaction, fetch buy transactions for the same client and stock
      if (transactionData.type === "SELL") {
        const buyTransactionsResponse = await fetch(
          `/api/transactions?clientId=${transactionData.client.id}&type=BUY`
        );
        if (buyTransactionsResponse.ok) {
          const buyTransactionsData = await buyTransactionsResponse.json();
          // Filter for the same stock
          const sameBuyTransactions = buyTransactionsData.filter(
            (t: any) => t.stock.id === transactionData.stock.id
          );
          setBuyTransactions(sameBuyTransactions);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: TransactionFormValues) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      router.push("/transactions");
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("İşlem güncellenirken bir hata oluştu.");
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

  if (!transaction) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <p>İşlem bulunamadı.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/transactions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">İşlemi Düzenle</h1>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>
              {transaction.client.fullName} - {transaction.stock.symbol} İşlemini Düzenle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İşlem Türü</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="İşlem türü seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BUY">Alış</SelectItem>
                            <SelectItem value="SELL">Satış</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lots"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lot Sayısı</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tarih</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="brokerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aracı Kurum</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Aracı kurum seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Seçim yapın</SelectItem>
                          {brokers.map((broker) => (
                            <SelectItem key={broker.id} value={broker.id}>
                              {broker.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <FormLabel>Alış Referansı</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Alış işlemi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Seçim yapın</SelectItem>
                            {buyTransactions.map((buyTx) => (
                              <SelectItem key={buyTx.id} value={buyTx.id}>
                                {new Date(buyTx.date).toLocaleDateString("tr-TR")} - {buyTx.lots} lot - ₺{buyTx.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="commission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Komisyon (₺)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedType === "SELL" && (
                    <FormField
                      control={form.control}
                      name="profit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kar/Zarar (₺)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Güncelleniyor..." : "Güncelle"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/transactions")}>
                    İptal
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