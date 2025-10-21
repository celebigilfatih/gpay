"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Download, Filter } from "lucide-react";
import Link from "next/link";
import * as XLSX from 'xlsx';

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchTransactions();
    }
  }, [status, router]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 404) {
          alert('İşlem bulunamadı. Sayfa yenileniyor...');
          // Refresh the transactions list
          await fetchTransactions();
          setDeleteDialogOpen(false);
          setTransactionToDelete(null);
          return;
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Remove the transaction from the local state
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      
      // Close the dialog
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      
      alert('İşlem başarıyla silindi.');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert(`İşlem silinirken bir hata oluştu: ${(error as Error).message}`);
    }
  };

  // Excel export function
  const exportTransactionsToExcel = () => {
    const exportData = filteredTransactions.map(transaction => ({
      'Tarih': new Date(transaction.date).toLocaleDateString('tr-TR'),
      'Müşteri': transaction.client.fullName,
      'Hisse': transaction.stock.symbol,
      'Hisse Adı': transaction.stock.name,
      'İşlem Tipi': transaction.type === "BUY" ? "ALIŞ" : "SATIŞ",
      'Lot': transaction.lots,
      'Fiyat': transaction.price,
      'Toplam': transaction.lots * transaction.price,
      'Aracı Kurum': transaction.broker?.name || transaction.brokerageFirm || "-",
      'Kar': transaction.profit || 0,
      'Komisyon': transaction.commission || 0,
      'Notlar': transaction.notes || "-"
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const colWidths = [
      { wch: 12 }, // Tarih
      { wch: 20 }, // Müşteri
      { wch: 10 }, // Hisse
      { wch: 25 }, // Hisse Adı
      { wch: 12 }, // İşlem Tipi
      { wch: 8 },  // Lot
      { wch: 12 }, // Fiyat
      { wch: 15 }, // Toplam
      { wch: 20 }, // Aracı Kurum
      { wch: 12 }, // Kar
      { wch: 12 }, // Komisyon
      { wch: 20 }  // Notlar
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "İşlemler");
    
    const fileName = `islemler_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Filter transactions based on search term, type, and date
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === "" || 
      transaction.client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.broker?.name || transaction.brokerageFirm || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "ALL" || transaction.type === typeFilter;
    
    const matchesDate = dateFilter === "" || 
      new Date(transaction.date).toISOString().split('T')[0] === dateFilter;
    
    return matchesSearch && matchesType && matchesDate;
  });

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

  // Calculate total profit and commission from filtered transactions
  const totalProfit = filteredTransactions
    .filter(t => t.profit !== null)
    .reduce((sum, t) => sum + (t.profit || 0), 0);
  
  const totalCommission = filteredTransactions
    .filter(t => t.commission !== null)
    .reduce((sum, t) => sum + (t.commission || 0), 0);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">İşlemler</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtrele
            </Button>
            <Button
              variant="outline"
              onClick={exportTransactionsToExcel}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel'e Aktar
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtreler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Arama</label>
                  <Input
                    placeholder="Müşteri, hisse, aracı kurum ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">İşlem Tipi</label>
                  <Select value={typeFilter} onValueChange={(value: "ALL" | "BUY" | "SELL") => setTypeFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tümü</SelectItem>
                      <SelectItem value="BUY">Alış</SelectItem>
                      <SelectItem value="SELL">Satış</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tarih</label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("ALL");
                    setDateFilter("");
                  }}
                >
                  Filtreleri Temizle
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam İşlem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{filteredTransactions.length}</p>
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
            ) : filteredTransactions.length === 0 ? (
              <p>Filtrelere uygun işlem bulunamadı.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Hisse</TableHead>
                    <TableHead>İşlem</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Fiyat</TableHead>
                    <TableHead>Aracı Kurum</TableHead>
                    <TableHead>Alış Referansı</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Kar</TableHead>
                    <TableHead>Komisyon</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell>
                        <Link href={`/clients/${transaction.client.id}`} className="text-blue-600 hover:underline">
                          {transaction.client.fullName}
                        </Link>
                      </TableCell>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <Link href={`/transactions/${transaction.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                          <Dialog open={deleteDialogOpen && transactionToDelete === transaction.id} onOpenChange={(open) => {
                            setDeleteDialogOpen(open);
                            if (!open) setTransactionToDelete(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTransactionToDelete(transaction.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>İşlemi Sil</DialogTitle>
                              </DialogHeader>
                              <p>Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  setDeleteDialogOpen(false);
                                  setTransactionToDelete(null);
                                }}>
                                  İptal
                                </Button>
                                <Button variant="destructive" onClick={() => handleDeleteTransaction(transaction.id)}>
                                  Sil
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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