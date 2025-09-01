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

type Stock = {
  id: string;
  symbol: string;
  name: string;
};

const stockSchema = z.object({
  symbol: z.string().min(1, "Sembol zorunludur").max(10, "Sembol en fazla 10 karakter olabilir"),
  name: z.string().min(1, "İsim zorunludur").max(100, "İsim en fazla 100 karakter olabilir"),
});

type StockFormValues = z.infer<typeof stockSchema>;

export default function EditStockPage() {
  const params = useParams();
  const stockId = params.id as string;
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      symbol: "",
      name: "",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchStock();
    }
  }, [status, stockId, router]);

  const fetchStock = async () => {
    try {
      const response = await fetch(`/api/stocks/${stockId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stock");
      }
      const data = await response.json();
      setStock(data);
      form.reset({
        symbol: data.symbol,
        name: data.name,
      });
    } catch (error) {
      console.error("Error fetching stock:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StockFormValues) => {
    if (!stock) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/stocks/${stockId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Hisse senedi güncellenemedi");
      }

      router.push("/stocks");
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Hisse senedi güncellenemedi: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      const response = await fetch(`/api/stocks/${stockId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Hisse senedi silinemedi");
      }

      router.push("/stocks");
    } catch (error) {
      console.error("Error deleting stock:", error);
      alert("Hisse senedi silinemedi: " + (error as Error).message);
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

  if (!stock) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <p>Hisse senedi bulunamadı.</p>
          <Button asChild className="mt-4">
            <Link href="/stocks">Hisse Senetlerine Dön</Link>
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
          <h1 className="text-3xl font-bold">Hisse Senedi Düzenle</h1>
          <Button variant="outline" asChild>
            <Link href="/stocks">Hisse Senetlerine Dön</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hisse Senedi Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sembol</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: THYAO" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İsim</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Türk Hava Yolları" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                  >
                    {deleteConfirm ? "Silmeyi Onayla" : "Sil"}
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Kaydediliyor..." : "Güncelle"}
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