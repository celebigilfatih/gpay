"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
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

type Payment = {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  method: string;
  client: {
    id: string;
    fullName: string;
  };
};

interface CollectionData {
  totalCommission: number;
  totalPayments: number;
  remainingBalance: number;
  paymentCount: number;
  payments?: Payment[];
}

export default function ClientTransactionsPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { status } = useSession();
  const [client, setClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [paymentDeleteDialogOpen, setPaymentDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const fetchClientData = useCallback(async () => {
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

      // Fetch collection data (payments) for this client
      const paymentsResponse = await fetch(`/api/payments?clientId=${clientId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        
        // Calculate collection summary
        const totalCommission = transactionsData
          .filter((t: Transaction) => t.commission !== null)
          .reduce((sum: number, t: Transaction) => sum + (t.commission || 0), 0);
        
        const totalPayments = paymentsData.reduce((sum: number, p: Payment) => sum + p.amount, 0);
        const remainingBalance = totalCommission - totalPayments;
        
        setCollectionData({
          totalCommission,
          totalPayments,
          remainingBalance,
          paymentCount: paymentsData.length,
          payments: paymentsData
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchClientData();
    }
  }, [status, clientId, router, fetchClientData]);

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
          // Refresh all data
          await fetchClientData();
          setDeleteDialogOpen(false);
          setTransactionToDelete(null);
          return;
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Refresh all client data to ensure collection calculations are updated
      await fetchClientData();
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      
      alert('İşlem başarıyla silindi.');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert(`İşlem silinirken bir hata oluştu: ${(error as Error).message}`);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 404) {
          alert('Ödeme bulunamadı. Sayfa yenileniyor...');
          // Refresh all data
          await fetchClientData();
          setPaymentDeleteDialogOpen(false);
          setPaymentToDelete(null);
          return;
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Refresh all client data to ensure collection calculations are updated
      await fetchClientData();
      setPaymentDeleteDialogOpen(false);
      setPaymentToDelete(null);
      
      alert('Ödeme başarıyla silindi.');
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert(`Ödeme silinirken bir hata oluştu: ${(error as Error).message}`);
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
    
  // Group transactions by stock
  const stockSummary = transactions.reduce((acc, transaction) => {
    const stockSymbol = transaction.stock.symbol;
    if (!acc[stockSymbol]) {
      acc[stockSymbol] = {
        symbol: stockSymbol,
        name: transaction.stock.name,
        totalLots: 0,
        brokers: new Map(),
        brokerNames: []
      };
    }
    
    // Add lots (positive for BUY, negative for SELL to get net position)
    acc[stockSymbol].totalLots += transaction.type === "BUY" ? transaction.lots : -transaction.lots;
    
    // Add broker if exists
    if (transaction.broker?.name) {
      const brokerName = transaction.broker.name;
      if (!acc[stockSymbol].brokers.has(brokerName)) {
        acc[stockSymbol].brokers.set(brokerName, 0);
        acc[stockSymbol].brokerNames.push(brokerName);
      }
      // Increment broker's lot count
      const currentLots = acc[stockSymbol].brokers.get(brokerName) || 0;
      acc[stockSymbol].brokers.set(brokerName, currentLots + (transaction.type === "BUY" ? transaction.lots : -transaction.lots));
    }
    
    return acc;
  }, {} as Record<string, { symbol: string, name: string, totalLots: number, brokers: Map<string, number>, brokerNames: string[] }>);
  
  // Convert to array for rendering
  const stockSummaryArray = Object.values(stockSummary);

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
          {collectionData && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tahsilat Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Toplam Ödeme:</span>
                    <span className="font-medium text-green-600">₺{collectionData.totalPayments.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Kalan Bakiye:</span>
                    <span className={`font-medium ${collectionData.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₺{collectionData.remainingBalance.toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Ödeme Sayısı:</span>
                    <span>{collectionData.paymentCount}</span>
                  </div>
                </div>
                
                {/* Ödeme Listesi */}
                {collectionData.payments && collectionData.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Ödemeler:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {collectionData.payments.map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                          <div>
                            <div className="font-medium">₺{payment.amount.toLocaleString('tr-TR')}</div>
                            <div className="text-gray-500">{new Date(payment.date).toLocaleDateString('tr-TR')}</div>
                            {payment.description && (
                              <div className="text-gray-500 text-xs">{payment.description}</div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPaymentToDelete(payment.id);
                              setPaymentDeleteDialogOpen(true);
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Hisse Özeti - Full Width */}
        <div className="mb-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Hisse Özeti</CardTitle>
                <div className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium">
                  Toplam: {stockSummaryArray
                    .filter(stock => stock.totalLots > 0)
                    .reduce((total, stock) => total + stock.totalLots, 0)} Lot
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stockSummaryArray.length === 0 ? (
                <p className="text-gray-500">Henüz hisse işlemi bulunmamaktadır.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {stockSummaryArray
                    .filter(stock => stock.totalLots > 0) // Sadece pozitif (kalan) lotları göster
                    .map(stock => (
                    <div key={stock.symbol} className="bg-gray-50 rounded-lg border p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{stock.symbol}</span>
                        <span className="font-bold text-blue-600">{stock.totalLots} Lot</span>
                      </div>
                      <div className="space-y-1">
                        {stock.brokerNames
                          .filter(broker => (stock.brokers.get(broker) || 0) > 0) // Sadece pozitif lot sayısına sahip aracı kurumları göster
                          .map((broker, index) => (
                          <div key={index} className="text-xs text-gray-600 flex justify-between">
                            <span>{broker}</span>
                            <span className="font-medium">{stock.brokers.get(broker)} Lot</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    <TableHead>İşlemler</TableHead>
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
                      <TableCell>
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTransactionToDelete(transaction.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>İşlemi Sil</DialogTitle>
                                <DialogDescription>
                                  Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </DialogDescription>
                              </DialogHeader>
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

      {/* Ödeme Silme Dialog'u */}
      <Dialog open={paymentDeleteDialogOpen} onOpenChange={setPaymentDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödemeyi Sil</DialogTitle>
            <DialogDescription>
              Bu ödemeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPaymentDeleteDialogOpen(false);
              setPaymentToDelete(null);
            }}>
              İptal
            </Button>
            <Button variant="destructive" onClick={() => {
              if (paymentToDelete) {
                handleDeletePayment(paymentToDelete);
              }
            }}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}