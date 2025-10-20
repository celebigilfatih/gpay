"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Eye, TrendingUp, TrendingDown, Wallet, Users, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  date: string;
  stock: {
    symbol: string;
    name: string;
  };
  broker: {
    name: string;
  } | null;
  lots: number;
  price: number;
  profit: number | null;
  commission: number | null;
  type: string;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  date: string;
  description: string | null;
  client: {
    fullName: string;
  };
}

interface CollectionData {
  client: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
  totalCommission: number;
  positiveCommission: number;
  negativeCommission: number;
  totalPayments: number;
  remainingBalance: number;
  transactionCount: number;
  transactions: Transaction[];
}

interface Summary {
  totalClients: number;
  totalCommissionToCollect: number;
  totalCommissionToRefund: number;
  totalPayments: number;
  totalRemainingBalance: number;
  netCommission: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientPayments, setSelectedClientPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
  // Edit payment states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    date: '',
    description: '',
    method: 'CASH'
  });
  
  // Delete payment states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/collections', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCollections(data.clients || []); // API 'clients' döndürüyor, 'collections' değil
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientPayments = async (clientId: string) => {
    try {
      setLoadingPayments(true);
      const response = await fetch(`/api/payments?clientId=${clientId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSelectedClientPayments(data);
    } catch (error) {
      console.error('Error fetching client payments:', error);
      setSelectedClientPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setEditFormData({
      amount: payment.amount.toString(),
      date: new Date(payment.date).toISOString().split('T')[0],
      description: payment.description || '',
      method: payment.method
    });
    setEditDialogOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    try {
      const response = await fetch(`/api/payments/${editingPayment.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Refresh the collections and payments data
      await fetchCollections();
      if (selectedClientPayments.length > 0) {
        const clientId = collections.find(c => 
          c.client.fullName === editingPayment.client.fullName
        )?.client.id;
        if (clientId) {
          await fetchClientPayments(clientId);
        }
      }

      setEditDialogOpen(false);
      setEditingPayment(null);
      alert('Ödeme başarıyla güncellendi.');
    } catch (error) {
      console.error('Error updating payment:', error);
      alert(`Ödeme güncellenirken bir hata oluştu: ${(error as Error).message}`);
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
          await fetchCollections();
          setDeleteDialogOpen(false);
          setPaymentToDelete(null);
          return;
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Refresh the collections and payments data
      await fetchCollections();
      if (selectedClientPayments.length > 0) {
        const paymentToDeleteObj = selectedClientPayments.find(p => p.id === paymentId);
        if (paymentToDeleteObj) {
          const clientId = collections.find(c => 
            c.client.fullName === paymentToDeleteObj.client.fullName
          )?.client.id;
          if (clientId) {
            await fetchClientPayments(clientId);
          }
        }
      }

      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
      alert('Ödeme başarıyla silindi.');
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert(`Ödeme silinirken bir hata oluştu: ${(error as Error).message}`);
    }
  };

  const filteredCollections = collections?.filter(collection =>
    collection.client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.client.phoneNumber.includes(searchTerm)
  ) || [];

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Müşteri Tahsilat Listesi</h1>
            <Button asChild>
              <Link href="/collections/new">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Ödeme
              </Link>
            </Button>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalClients}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tahsil Edilecek</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ₺{summary.totalCommissionToCollect.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">İade Edilecek</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ₺{summary.totalCommissionToRefund.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Ödeme</CardTitle>
                  <Wallet className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ₺{summary.totalPayments.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Kalan Bakiye</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${summary.totalRemainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₺{summary.totalRemainingBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Komisyon</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${summary.netCommission >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₺{summary.netCommission.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search */}
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Müşteri adı veya telefon ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Collections Table */}
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Tahsilat Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Yükleniyor...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead className="text-right">Toplam Komisyon</TableHead>
                        <TableHead className="text-right">Toplam Ödeme</TableHead>
                        <TableHead className="text-right">Kalan Bakiye</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-center">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCollections.map((collection) => (
                        <TableRow key={collection.client.id}>
                          <TableCell className="font-medium">
                            {collection.client.fullName}
                          </TableCell>
                          <TableCell>{collection.client.phoneNumber}</TableCell>
                          <TableCell className="text-right">
                            <span className={collection.totalCommission >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ₺{collection.totalCommission.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            ₺{collection.totalPayments.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={collection.remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ₺{collection.remainingBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={collection.remainingBalance > 0 ? 'destructive' : collection.remainingBalance < 0 ? 'secondary' : 'default'}>
                              {collection.remainingBalance > 0 ? 'Borçlu' : collection.remainingBalance < 0 ? 'Alacaklı' : 'Eşit'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => fetchClientPayments(collection.client.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {collection.client.fullName} - İşlem Detayları
                                    </DialogTitle>
                                    <DialogDescription>
                                      Müşterinin komisyon işlemleri ve ödemeleri
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="space-y-6">
                                    {/* Summary */}
                                    <div className="grid grid-cols-4 gap-4">
                                      <div className="text-center">
                                        <div className="text-sm text-gray-500">Toplam Komisyon</div>
                                        <div className={`text-lg font-bold ${collection.totalCommission >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          ₺{collection.totalCommission.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-sm text-gray-500">Toplam Ödeme</div>
                                        <div className="text-lg font-bold text-blue-600">
                                          ₺{collection.totalPayments.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-sm text-gray-500">Kalan Bakiye</div>
                                        <div className={`text-lg font-bold ${collection.remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          ₺{collection.remainingBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-sm text-gray-500">İşlem Sayısı</div>
                                        <div className="text-lg font-bold">
                                          {collection.transactionCount}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Transactions */}
                                    <div>
                                      <h4 className="text-lg font-semibold mb-3">Komisyon İşlemleri</h4>
                                      <div className="overflow-x-auto">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Tarih</TableHead>
                                              <TableHead>Hisse</TableHead>
                                              <TableHead>Aracı Kurum</TableHead>
                                              <TableHead>Tip</TableHead>
                                              <TableHead className="text-right">Lot</TableHead>
                                              <TableHead className="text-right">Fiyat</TableHead>
                                              <TableHead className="text-right">Kar/Zarar</TableHead>
                                              <TableHead className="text-right">Komisyon</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {collection.transactions.map((transaction) => (
                                              <TableRow key={transaction.id}>
                                                <TableCell>
                                                  {new Date(transaction.date).toLocaleDateString('tr-TR')}
                                                </TableCell>
                                                <TableCell>
                                                  <div>
                                                    <div className="font-medium">{transaction.stock?.symbol}</div>
                                                    <div className="text-sm text-gray-500">{transaction.stock?.name}</div>
                                                  </div>
                                                </TableCell>
                                                <TableCell>{transaction.broker?.name || '-'}</TableCell>
                                                <TableCell>
                                                  <Badge variant={transaction.type === 'BUY' ? 'default' : 'secondary'}>
                                                    {transaction.type === 'BUY' ? 'Alış' : 'Satış'}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{transaction.lots}</TableCell>
                                                <TableCell className="text-right">
                                                  ₺{transaction.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {transaction.profit !== null ? (
                                                    <span className={transaction.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                      ₺{transaction.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                  ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {transaction.commission !== null ? (
                                                    <span className={transaction.commission >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                      ₺{transaction.commission.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                  ) : '-'}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>

                                    {/* Payments */}
                                    <div>
                                      <h4 className="text-lg font-semibold mb-3">Ödemeler</h4>
                                      {loadingPayments ? (
                                        <div className="text-center py-4">Ödemeler yükleniyor...</div>
                                      ) : selectedClientPayments.length > 0 ? (
                                        <div className="overflow-x-auto">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>Tarih</TableHead>
                                                <TableHead className="text-right">Tutar</TableHead>
                                                <TableHead>Yöntem</TableHead>
                                                <TableHead>Açıklama</TableHead>
                                                <TableHead className="text-center">İşlemler</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {selectedClientPayments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                  <TableCell>
                                                    {new Date(payment.date).toLocaleDateString('tr-TR')}
                                                  </TableCell>
                                                  <TableCell className="text-right">
                                                    ₺{payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                  </TableCell>
                                                  <TableCell>
                                                    <Badge variant="outline">
                                                      {payment.method === 'CASH' ? 'Nakit' :
                                                       payment.method === 'BANK' ? 'Banka' :
                                                       payment.method === 'CREDIT_CARD' ? 'Kredi Kartı' :
                                                       payment.method === 'CHECK' ? 'Çek' : 'Diğer'}
                                                    </Badge>
                                                  </TableCell>
                                                  <TableCell>{payment.description || '-'}</TableCell>
                                                  <TableCell>
                                                    <div className="flex items-center justify-center space-x-2">
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditPayment(payment)}
                                                      >
                                                        <Pencil className="h-4 w-4" />
                                                      </Button>
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                          setPaymentToDelete(payment.id);
                                                          setDeleteDialogOpen(true);
                                                        }}
                                                      >
                                                        <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                    </div>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      ) : (
                                        <div className="text-center py-4 text-gray-500">
                                          Bu müşteriye ait ödeme kaydı bulunmuyor.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              {collection.remainingBalance > 0 && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/collections/new?clientId=${collection.client.id}`}>
                                    <Plus className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredCollections.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Arama kriterine uygun müşteri bulunamadı.' : 'Henüz komisyon verisi bulunmuyor.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Payment Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ödeme Düzenle</DialogTitle>
              <DialogDescription>
                Ödeme bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-amount">Tutar</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit-date">Tarih</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-method">Ödeme Yöntemi</Label>
                <Select
                  value={editFormData.method}
                  onValueChange={(value) => setEditFormData({ ...editFormData, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Nakit</SelectItem>
                    <SelectItem value="BANK">Banka Transferi</SelectItem>
                    <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                    <SelectItem value="CHECK">Çek</SelectItem>
                    <SelectItem value="OTHER">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-description">Açıklama</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Ödeme açıklaması (opsiyonel)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleUpdatePayment}>
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Payment Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ödemeyi Sil</DialogTitle>
              <DialogDescription>
                Bu ödemeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDeleteDialogOpen(false);
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
      </div>
    </>
  );
}