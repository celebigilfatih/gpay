"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/navbar";
import { Users, Plus, Eye, Activity, Trash2, User, Phone, Building2, MapPin, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  fullName: string;
  phoneNumber: string;
  brokerageFirm: string;
  city: string;
};

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const { status } = useSession();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchClients = useCallback(async (search = "", page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: "10"
      });
      
      const response = await fetch(`/api/clients?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const data = await response.json();
      setClients(data.clients);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated" && searchTerm === "" && currentPage === 1) {
      fetchClients("", 1);
    }
  }, [status, router, fetchClients]);

  // Handle page changes (not search)
  useEffect(() => {
    if (status === "authenticated" && currentPage > 1) {
      fetchClients(searchTerm, currentPage);
    }
  }, [currentPage, status, fetchClients, searchTerm]);

  // Debounced search effect
  useEffect(() => {
    if (searchTerm === "") {
      // If search is cleared, fetch first page
      if (status === "authenticated") {
        setCurrentPage(1);
        fetchClients("", 1);
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      if (status === "authenticated") {
        setCurrentPage(1); // Reset to first page when searching
        fetchClients(searchTerm, 1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, status, fetchClients]);

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (confirm(`${clientName} isimli müşteriyi silmek istediğinizden emin misiniz?`)) {
      try {
        const response = await fetch(`/api/clients/${clientId}`, {
          method: "DELETE",
          credentials: 'include',
        });

        if (response.ok) {
          // Refresh the clients list
          fetchClients(searchTerm, currentPage);
        } else {
          alert("Müşteri silinirken bir hata oluştu.");
        }
      } catch (error) {
        console.error("Error deleting client:", error);
        alert("Müşteri silinirken bir hata oluştu.");
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setSearchTerm(value);
    
    // Maintain focus and cursor position after state update
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
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
          <div>
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Müşteriler</h1>
            </div>
            <p className="text-muted-foreground mt-2">Müşteri bilgilerini yönetin</p>
          </div>
          <Link href="/clients/new">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Yeni Müşteri Ekle</span>
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="İsim, telefon, şirket veya şehir ile ara..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Müşteri Listesi
              </div>
              {pagination && (
                <div className="text-sm text-gray-500">
                  Toplam {pagination.totalCount} müşteri
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Yükleniyor...</div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "Arama kriterlerine uygun müşteri bulunamadı." : "Henüz müşteri bulunmuyor."}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Ad Soyad</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>Telefon</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <span>Aracı Kurum</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>Şehir</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.fullName}</TableCell>
                        <TableCell>{client.phoneNumber}</TableCell>
                        <TableCell>{client.brokerageFirm}</TableCell>
                        <TableCell>{client.city}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/clients/${client.id}`} className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>Detay</span>
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/clients/${client.id}/transactions`} className="flex items-center space-x-1">
                                <Activity className="h-4 w-4" />
                                <span>İşlemler</span>
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClient(client.id, client.fullName)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Sayfa {pagination.currentPage} / {pagination.totalPages} 
                      ({pagination.totalCount} toplam kayıt)
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Önceki
                      </Button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNext}
                      >
                        Sonraki
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}