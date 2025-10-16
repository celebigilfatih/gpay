"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Search, X } from "lucide-react";

type Client = {
  id: string;
  fullName: string;
};

type Broker = {
  id: string;
  name: string;
};

type Stock = {
  id: string;
  symbol: string;
  name: string;
};

type Purchase = {
  lots: number;
  price: number;
  totalCost: number;
};

type ClientCost = {
  client: Client;
  broker: Broker | null;
  totalLots: number;
  purchasePrice: number;
  purchases: Purchase[];
};

type StockCost = {
  stock: Stock;
  clients: ClientCost[];
};

type FlattenedRow = {
  stockSymbol: string;
  stockName: string;
  clientName: string;
  brokerName: string;
  lots: number;
  price: number;
  totalCost: number;
  netLots: number;
};

type SortConfig = {
  key: keyof FlattenedRow;
  direction: 'asc' | 'desc';
};

type FilterConfig = {
  stockSymbol: string;
  stockName: string;
  clientName: string;
  brokerName: string;
};

export default function StockCostsPage() {
  const [stockCosts, setStockCosts] = useState<StockCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'stockSymbol', direction: 'asc' });
  const [filters, setFilters] = useState<FilterConfig>({
    stockSymbol: '',
    stockName: '',
    clientName: '',
    brokerName: ''
  });
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchStockCosts();
    }
  }, [status, router]);

  const fetchStockCosts = async () => {
    try {
      const response = await fetch("/api/stock-costs");
      if (!response.ok) {
        throw new Error("Failed to fetch stock costs");
      }
      const data = await response.json();
      setStockCosts(data);
    } catch (error) {
      console.error("Error fetching stock costs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("tr-TR").format(num);
  };

  // Verileri düzleştir ve tablo için hazırla
  const flattenData = (): FlattenedRow[] => {
    const rows: FlattenedRow[] = [];
    
    stockCosts.forEach((stockCost) => {
      stockCost.clients.forEach((clientCost) => {
        clientCost.purchases.forEach((purchase) => {
          rows.push({
            stockSymbol: stockCost.stock.symbol,
            stockName: stockCost.stock.name,
            clientName: clientCost.client.fullName,
            brokerName: clientCost.broker?.name || '-',
            lots: purchase.lots,
            price: purchase.price,
            totalCost: purchase.totalCost,
            netLots: clientCost.totalLots,
          });
        });
      });
    });
    
    return rows;
  };

  // Sıralama fonksiyonu
  const handleSort = (key: keyof FlattenedRow) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Sıralanmış veriyi al
  const getSortedData = (): FlattenedRow[] => {
    const data = flattenData();
    
    if (!sortConfig) {
      return data;
    }
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'tr-TR');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
  };

  // Filtrelenmiş ve sıralanmış veriyi al
  const getFilteredAndSortedData = (): FlattenedRow[] => {
    const data = flattenData();
    
    // Önce filtreleme uygula
    const filteredData = data.filter(row => {
      return (
        row.stockSymbol.toLowerCase().includes(filters.stockSymbol.toLowerCase()) &&
        row.stockName.toLowerCase().includes(filters.stockName.toLowerCase()) &&
        row.clientName.toLowerCase().includes(filters.clientName.toLowerCase()) &&
        row.brokerName.toLowerCase().includes(filters.brokerName.toLowerCase())
      );
    });
    
    // Sonra sıralama uygula
    if (!sortConfig) {
      return filteredData;
    }
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'tr-TR');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
  };

  // Filtre güncelleme fonksiyonu
  const updateFilter = (key: keyof FilterConfig, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Filtreleri temizle
  const clearFilters = () => {
    setFilters({
      stockSymbol: '',
      stockName: '',
      clientName: '',
      brokerName: ''
    });
  };

  // Excel export fonksiyonu
  const exportToExcel = () => {
    const data = getFilteredAndSortedData();
    const headers = [
      'Hisse Kodu',
      'Hisse Adı', 
      'Müşteri',
      'Aracı Kurum',
      'Alış Lot Adedi',
      'Alış Fiyatı',
      'Alış Maliyeti',
      'Net Lot'
    ];
    
    let csvContent = '\uFEFF' + headers.join(',') + '\n'; // UTF-8 BOM eklendi
    
    data.forEach(row => {
      const csvRow = [
        row.stockSymbol,
        `"${row.stockName}"`,
        `"${row.clientName}"`,
        `"${row.brokerName}"`,
        row.lots,
        row.price.toFixed(2),
        row.totalCost.toFixed(2),
        row.netLots
      ].join(',');
      csvContent += csvRow + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hisse-maliyetleri-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sıralama ikonu
  const getSortIcon = (key: keyof FlattenedRow) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Hisse Bazlı Müşteri Maliyetleri</h1>
              <p className="text-muted-foreground">
                Müşterilerinizin hisse senetlerindeki pozisyonlarını ve maliyetlerini görüntüleyin.
              </p>
            </div>
            <Button 
              onClick={exportToExcel}
              className="flex items-center gap-2"
              disabled={stockCosts.length === 0}
            >
              <Download className="h-4 w-4" />
              Excel'e Aktar
            </Button>
          </div>
        </div>

        {stockCosts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Henüz hisse pozisyonu bulunmuyor.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            {/* Filtreleme Bölümü */}
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filtreler</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Temizle
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hisse Kodu</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Hisse kodu ara..."
                      value={filters.stockSymbol}
                      onChange={(e) => updateFilter('stockSymbol', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hisse Adı</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Hisse adı ara..."
                      value={filters.stockName}
                      onChange={(e) => updateFilter('stockName', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Müşteri</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Müşteri ara..."
                      value={filters.clientName}
                      onChange={(e) => updateFilter('clientName', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Aracı Kurum</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Aracı kurum ara..."
                      value={filters.brokerName}
                      onChange={(e) => updateFilter('brokerName', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('stockSymbol')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Hisse Kodu
                        {getSortIcon('stockSymbol')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('stockName')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Hisse Adı
                        {getSortIcon('stockName')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('clientName')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Müşteri
                        {getSortIcon('clientName')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('brokerName')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Aracı Kurum
                        {getSortIcon('brokerName')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('lots')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Alış Lot Adedi
                        {getSortIcon('lots')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('price')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Alış Fiyatı
                        {getSortIcon('price')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('totalCost')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Alış Maliyeti
                        {getSortIcon('totalCost')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('netLots')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Net Lot
                        {getSortIcon('netLots')}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredAndSortedData().map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {row.stockSymbol}
                      </TableCell>
                      <TableCell>
                        {row.stockName}
                      </TableCell>
                      <TableCell>
                        {row.clientName}
                      </TableCell>
                      <TableCell>
                        {row.brokerName !== '-' ? (
                          <Badge variant="outline">
                            {row.brokerName}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(row.lots)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.totalCost)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatNumber(row.netLots)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}