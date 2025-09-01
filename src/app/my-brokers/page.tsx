"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";

type Broker = {
  id: string;
  name: string;
  code: string;
};

type UserBroker = {
  id: string;
  broker: Broker;
};

export default function MyBrokersPage() {
  const [userBrokers, setUserBrokers] = useState<UserBroker[]>([]);
  const [allBrokers, setAllBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedBrokerId, setSelectedBrokerId] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchUserBrokers();
      fetchAllBrokers();
    }
  }, [status, router]);

  const fetchUserBrokers = async () => {
    try {
      const response = await fetch("/api/user-brokers");
      if (response.ok) {
        const data = await response.json();
        setUserBrokers(data);
      } else {
        console.error("Failed to fetch user brokers");
      }
    } catch (error) {
      console.error("Error fetching user brokers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBrokers = async () => {
    try {
      const response = await fetch("/api/brokers/all");
      if (response.ok) {
        const data = await response.json();
        setAllBrokers(data);
      } else {
        console.error("Failed to fetch all brokers");
      }
    } catch (error) {
      console.error("Error fetching all brokers:", error);
    }
  };

  const handleAddBroker = async () => {
    if (!selectedBrokerId) return;

    try {
      const response = await fetch("/api/user-brokers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brokerId: selectedBrokerId }),
      });

      if (response.ok) {
        await fetchUserBrokers();
        setSelectedBrokerId("");
        setIsAddDialogOpen(false);
      } else {
        const errorData = await response.json();
        alert("Hata: " + errorData.error);
      }
    } catch (error) {
      console.error("Error adding broker:", error);
      alert("Aracı kurum eklenirken bir hata oluştu");
    }
  };

  const handleRemoveBroker = async (brokerId: string) => {
    if (!confirm("Bu aracı kurumu kaldırmak istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/user-brokers?brokerId=${brokerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchUserBrokers();
      } else {
        const errorData = await response.json();
        alert("Hata: " + errorData.error);
      }
    } catch (error) {
      console.error("Error removing broker:", error);
      alert("Aracı kurum kaldırılırken bir hata oluştu");
    }
  };

  // Kullanıcının kayıtlı olmadığı aracı kurumları filtrele
  const availableBrokers = allBrokers.filter(
    (broker) => !userBrokers.some((ub) => ub.broker.id === broker.id)
  );

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
          <h1 className="text-2xl font-bold">Aracı Kurumlarım</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Aracı Kurum Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Aracı Kurum Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Aracı Kurum Seçin
                  </label>
                  <select
                    value={selectedBrokerId}
                    onChange={(e) => setSelectedBrokerId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Aracı kurum seçiniz</option>
                    {availableBrokers.map((broker) => (
                      <option key={broker.id} value={broker.id}>
                        {broker.name} ({broker.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleAddBroker}
                    disabled={!selectedBrokerId}
                  >
                    Ekle
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kayıtlı Aracı Kurumlar</CardTitle>
          </CardHeader>
          <CardContent>
            {userBrokers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Henüz kayıtlı aracı kurumunuz bulunmuyor.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aracı Kurum Adı</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userBrokers.map((userBroker) => (
                    <TableRow key={userBroker.id}>
                      <TableCell className="font-medium">
                        {userBroker.broker.name}
                      </TableCell>
                      <TableCell>{userBroker.broker.code}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveBroker(userBroker.broker.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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