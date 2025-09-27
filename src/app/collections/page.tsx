"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';
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

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      if (response.ok) {
        const data = await response.json();
        setCollections(data.clients || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter((collection) =>
    collection.client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.client.phoneNumber.includes(searchTerm)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tahsilatlar</h1>
            <p className="text-gray-600 mt-2">Müşteri komisyon tahsilat takibi</p>
          </div>
          <Link href="/collections/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yeni Tahsilat
            </Button>
          </Link>
        </div>

        {/* Özet Kartları */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                <CardTitle className="text-sm font-medium">Toplam Komisyon</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.netCommission)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Ödeme</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPayments)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kalan Bakiye</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.totalRemainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(summary.totalRemainingBalance)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tahsil Oranı</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.netCommission > 0 ? Math.round((summary.totalPayments / summary.netCommission) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Arama */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Müşteri adı veya telefon ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tahsilat Tablosu */}
        <Card>
          <CardHeader>
            <CardTitle>Müşteri Tahsilat Listesi</CardTitle>
            <CardDescription>
              Müşteri bazında komisyon ve ödeme durumu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead className="text-right">Toplam Komisyon</TableHead>
                    <TableHead className="text-right">Toplam Ödeme</TableHead>
                    <TableHead className="text-right">Kalan Bakiye</TableHead>
                    <TableHead className="text-center">Durum</TableHead>
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
                        {formatCurrency(collection.totalCommission)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(collection.totalPayments)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        collection.remainingBalance > 0 ? 'text-red-600' : 
                        collection.remainingBalance < 0 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(collection.remainingBalance)}
                      </TableCell>
                      <TableCell className="text-center">
                        {collection.remainingBalance > 0 ? (
                          <Badge variant="destructive">Borçlu</Badge>
                        ) : collection.remainingBalance < 0 ? (
                          <Badge variant="secondary">İade</Badge>
                        ) : (
                          <Badge variant="default">Tamam</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{collection.client.fullName} - İşlem Detayları</DialogTitle>
                                <DialogDescription>
                                  Komisyon hesaplanan işlemler ve ödeme geçmişi
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                                  <div>
                                    <div className="text-sm text-gray-600">Toplam Komisyon</div>
                                    <div className="font-bold">{formatCurrency(collection.totalCommission)}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-600">Toplam Ödeme</div>
                                    <div className="font-bold text-green-600">{formatCurrency(collection.totalPayments)}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-600">Kalan Bakiye</div>
                                    <div className={`font-bold ${collection.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {formatCurrency(collection.remainingBalance)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-600">İşlem Sayısı</div>
                                    <div className="font-bold">{collection.transactionCount}</div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Komisyon İşlemleri</h4>
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
                                            <TableCell>{formatDate(transaction.date)}</TableCell>
                                            <TableCell>
                                              <div>
                                                <div className="font-medium">{transaction.stock.symbol}</div>
                                                <div className="text-sm text-gray-500">{transaction.stock.name}</div>
                                              </div>
                                            </TableCell>
                                            <TableCell>{transaction.broker?.name || '-'}</TableCell>
                                            <TableCell>
                                              <Badge variant={transaction.type === 'BUY' ? 'secondary' : 'default'}>
                                                {transaction.type === 'BUY' ? 'Alış' : 'Satış'}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{transaction.lots.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(transaction.price)}</TableCell>
                                            <TableCell className={`text-right ${
                                              (transaction.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                              {transaction.profit ? formatCurrency(transaction.profit) : '-'}
                                            </TableCell>
                                            <TableCell className={`text-right font-medium ${
                                              (transaction.commission || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                              {transaction.commission ? formatCurrency(transaction.commission) : '-'}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {collection.remainingBalance > 0 && (
                            <Link href={`/collections/new?clientId=${collection.client.id}`}>
                              <Button size="sm">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredCollections.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Arama kriterine uygun müşteri bulunamadı.' : 'Henüz komisyon verisi bulunmuyor.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}