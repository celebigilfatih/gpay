"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface CollectionData {
  client: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
  totalCommission: number;
  totalPayments: number;
  remainingBalance: number;
}

export default function NewPaymentPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    method: 'CASH'
  });

  const [selectedClient, setSelectedClient] = useState<CollectionData | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, collectionsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/collections')
      ]);

      if (clientsRes.ok && collectionsRes.ok) {
        const collectionsData = await collectionsRes.json();

        setCollections(collectionsData.clients || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, clientId });
    const client = collections.find(c => c.client.id === clientId);
    setSelectedClient(client || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/collections');
      } else {
        const error = await response.json();
        alert('Hata: ' + (error.error || 'Ödeme kaydedilemedi'));
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Ödeme kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const paymentMethods = [
    { value: 'CASH', label: 'Nakit' },
    { value: 'BANK', label: 'Banka Havalesi' },
    { value: 'CREDIT_CARD', label: 'Kredi Kartı' },
    { value: 'CHECK', label: 'Çek' },
    { value: 'OTHER', label: 'Diğer' }
  ];

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
        <div className="mb-6">
          <Link href="/collections" className="inline-flex items-center text-blue-600 hover:text-blue-800 cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tahsilatlara Dön
          </Link>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Yeni Tahsilat Girişi
            </CardTitle>
            <CardDescription>
              Müşteriden alınan ödemeyi kaydedin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="clientId">Müşteri *</Label>
                <Select value={formData.clientId} onValueChange={handleClientChange}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem key={collection.client.id} value={collection.client.id}>
                        {collection.client.fullName} - Kalan: ₺{collection.remainingBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClient && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Müşteri Bilgileri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Toplam Komisyon:</span>
                      <div className="font-medium">₺{selectedClient.totalCommission.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Toplam Ödeme:</span>
                      <div className="font-medium">₺{selectedClient.totalPayments.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Kalan Bakiye:</span>
                      <div className={`font-medium ${selectedClient.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₺{selectedClient.remainingBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Ödeme Tutarı (₺) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Ödeme Tarihi *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Ödeme Yöntemi</Label>
                <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ödeme ile ilgili notlar..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving || !formData.clientId || !formData.amount} className="cursor-pointer">
                  {saving ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/collections')} className="cursor-pointer">
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}