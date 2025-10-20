"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Navbar } from "@/components/layout/navbar";
import { Users, Plus, Eye, Activity, Trash2, User, Phone, Building2, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  fullName: string;
  phoneNumber: string;
  brokerageFirm: string;
  city: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchClients();
    }
  }, [status, router]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`${clientName} adlı müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve müşteriye ait tüm işlemler de silinecektir.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete client");
      }

      // Refresh the clients list
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Müşteri silinemedi. Lütfen tekrar deneyin.");
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

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Müşteriler</h1>
              <p className="text-gray-600 text-sm">Müşteri bilgilerini yönetin</p>
            </div>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
            <Link href="/clients/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Yeni Müşteri Ekle
            </Link>
          </Button>
        </div>

        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">Müşteri Listesi</CardTitle>
              <span className="ml-auto bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {clients.length} müşteri
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {clients.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Henüz müşteri bulunmamaktadır.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        İsim
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefon
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Aracı Kurum
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Şehir
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-blue-50/30 transition-colors">
                      <TableCell className="font-medium text-gray-900">{client.fullName}</TableCell>
                      <TableCell className="text-gray-700">{client.phoneNumber}</TableCell>
                      <TableCell className="text-gray-700">{client.brokerageFirm}</TableCell>
                      <TableCell className="text-gray-700">{client.city}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 hover:border-blue-300">
                            <Link href={`/clients/${client.id}`} className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Detaylar
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="hover:bg-green-50 hover:border-green-300">
                            <Link href={`/clients/${client.id}/transactions`} className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              İşlemler
                            </Link>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteClient(client.id, client.fullName)}
                            className="hover:bg-red-600 flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Sil
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
      </div>
    </>
  );
}