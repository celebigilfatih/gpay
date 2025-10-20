"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Navbar } from "@/components/layout/navbar";
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Müşteriler</h1>
          <Button asChild>
            <Link href="/clients/new">Yeni Müşteri Ekle</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Müşteri Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p>Henüz müşteri bulunmamaktadır.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İsim</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Aracı Kurum</TableHead>
                    <TableHead>Şehir</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.fullName}</TableCell>
                      <TableCell>{client.phoneNumber}</TableCell>
                      <TableCell>{client.brokerageFirm}</TableCell>
                      <TableCell>{client.city}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/clients/${client.id}`}>Detaylar</Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/clients/${client.id}/transactions`}>İşlemler</Link>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteClient(client.id, client.fullName)}
                          >
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