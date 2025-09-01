"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const stockSchema = z.object({
  symbol: z.string().min(1, "Sembol zorunludur").max(10, "Sembol en fazla 10 karakter olabilir"),
  name: z.string().min(1, "İsim zorunludur").max(100, "İsim en fazla 100 karakter olabilir"),
});

type StockFormValues = z.infer<typeof stockSchema>;

export default function NewStockPage() {
  const [submitting, setSubmitting] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      symbol: "",
      name: "",
    },
  });

  const onSubmit = async (data: StockFormValues) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/stocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Hisse senedi eklenemedi");
      }

      router.push("/stocks");
    } catch (error) {
      console.error("Error submitting stock:", error);
      alert("Hisse senedi eklenemedi: " + (error as Error).message);
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

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Yeni Hisse Senedi Ekle</h1>
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

                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Kaydediliyor..." : "Hisse Senedi Ekle"}
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