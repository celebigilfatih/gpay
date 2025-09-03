"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";

type Broker = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    transactions: number;
  };
  totalLots: number;
};

const brokerSchema = z.object({
  name: z.string().min(1, "Aracı kurum adı zorunludur"),
  code: z.string().min(1, "Aracı kurum kodu zorunludur"),
  isActive: z.boolean().default(true),
});

type BrokerFormValues = {
  name: string;
  code: string;
  isActive: boolean;
};

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stockBasedLots, setStockBasedLots] = useState<{ symbol: string; name: string; totalLots: number }[]>([]);
  const { data: session, status } = useSession();
  const router = useRouter();

  const addForm = useForm({
    resolver: zodResolver(brokerSchema),
    defaultValues: {
      name: "",
      code: "",
      isActive: true,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(brokerSchema),
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchBrokers();
      fetchStockBasedLots();
    }
  }, [status, router]);

  const fetchBrokers = async () => {
    try {
      const response = await fetch("/api/brokers");
      if (response.ok) {
        const data = await response.json();
        // Active broker'ları önce, pasif broker'ları sonra sırala
        const sortedData = data.sort((a: Broker, b: Broker) => {
          if (a.isActive === b.isActive) return 0;
          return a.isActive ? -1 : 1;
        });
        setBrokers(sortedData);
      } else {
        console.error("Failed to fetch brokers");
      }
    } catch (error) {
      console.error("Error fetching brokers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockBasedLots = async () => {
    try {
      const response = await fetch("/api/transactions/stock-summary");
      if (response.ok) {
        const data = await response.json();
        setStockBasedLots(data);
      }
    } catch (error) {
      console.error("Error fetching stock-based lots:", error);
    }
  };

  const handleAddBroker = async (data: BrokerFormValues) => {
    try {
      const response = await fetch("/api/brokers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchBrokers();
        addForm.reset();
        setIsAddDialogOpen(false);
      } else {
        const errorData = await response.json();
        console.error("Failed to add broker:", errorData.error);
      }
    } catch (error) {
      console.error("Error adding broker:", error);
    }
  };

  const handleEditBroker = async (data: BrokerFormValues) => {
    if (!editingBroker) return;

    try {
      const response = await fetch(`/api/brokers/${editingBroker.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchBrokers();
        setEditingBroker(null);
        setIsEditDialogOpen(false);
      } else {
        const errorData = await response.json();
        console.error("Failed to update broker:", errorData.error);
      }
    } catch (error) {
      console.error("Error updating broker:", error);
    }
  };

  const handleDeleteBroker = async (id: string) => {
    if (!confirm("Bu aracı kurumu silmek istediğinizden emin misiniz?")) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/brokers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchBrokers();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Silme işlemi başarısız");
      }
    } catch (error) {
      console.error("Error deleting broker:", error);
      alert("Silme işlemi sırasında hata oluştu");
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (broker: Broker) => {
    setEditingBroker(broker);
    editForm.reset({
      name: broker.name,
      code: broker.code,
      isActive: broker.isActive,
    });
    setIsEditDialogOpen(true);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Aracı Kurum Yönetimi</h1>
              <p className="text-gray-600">Menkul değerler şirketlerini yönetin ve takip edin</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Aracı Kurum
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Aracı Kurum Ekle</DialogTitle>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(handleAddBroker)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aracı Kurum Adı</FormLabel>
                        <FormControl>
                          <Input placeholder="Örn: Garanti Yatırım" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aracı Kurum Kodu</FormLabel>
                        <FormControl>
                          <Input placeholder="Örn: GARANTI" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Aktif</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Aracı kurum aktif durumda mı?
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button type="submit">Ekle</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Aracı Kurum</p>
                    <p className="text-2xl font-bold text-gray-900">{brokers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Aktif Aracı Kurum</p>
                    <p className="text-2xl font-bold text-gray-900">{brokers.filter(b => b.isActive).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam İşlem</p>
                    <p className="text-2xl font-bold text-gray-900">{brokers.reduce((sum, b) => sum + b._count.transactions, 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Lot</p>
                    <p className="text-2xl font-bold text-gray-900">{brokers.reduce((sum, b) => sum + (b.totalLots || 0), 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Based Lots - Full Width */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-lg font-medium text-gray-600 mb-4">Hisse Bazlı Toplam Lot</p>
                    <div className="text-sm">
                      {stockBasedLots.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {stockBasedLots.map((stock, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                              <span className="font-medium text-gray-700">{stock.symbol}:</span>
                              <span className="font-bold text-gray-900">{stock.totalLots.toLocaleString()} lot</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <span className="text-lg">Henüz hisse verisi bulunmuyor</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aracı Kurumlar ({brokers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {brokers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Henüz aracı kurum eklenmemiş.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aracı Kurum Adı</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlem Sayısı</TableHead>
                    <TableHead>Toplam Lot</TableHead>
                    <TableHead>Oluşturulma</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brokers.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell className="font-medium">{broker.name}</TableCell>
                      <TableCell>{broker.code}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            broker.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {broker.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </TableCell>
                      <TableCell>{broker._count.transactions}</TableCell>
                      <TableCell>{(broker.totalLots || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {new Date(broker.createdAt).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(broker)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBroker(broker.id)}
                            disabled={deleting === broker.id}
                          >
                            {deleting === broker.id ? (
                              "Siliniyor..."
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aracı Kurum Düzenle</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditBroker)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aracı Kurum Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Garanti Yatırım" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aracı Kurum Kodu</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: GARANTI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Aktif</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Aracı kurum aktif durumda mı?
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button type="submit">Güncelle</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}