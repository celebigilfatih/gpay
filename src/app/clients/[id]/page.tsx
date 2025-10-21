"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { User, Phone, Building2, MapPin, Edit, Save, X } from "lucide-react";

// Broker ve UserBroker tipleri
type Broker = {
  id: string;
  name: string;
};

// Türkiye şehirleri listesi
const citiesList = [
  { value: "adana", label: "Adana" },
  { value: "adiyaman", label: "Adıyaman" },
  { value: "afyonkarahisar", label: "Afyonkarahisar" },
  { value: "agri", label: "Ağrı" },
  { value: "aksaray", label: "Aksaray" },
  { value: "amasya", label: "Amasya" },
  { value: "ankara", label: "Ankara" },
  { value: "antalya", label: "Antalya" },
  { value: "ardahan", label: "Ardahan" },
  { value: "artvin", label: "Artvin" },
  { value: "aydin", label: "Aydın" },
  { value: "balikesir", label: "Balıkesir" },
  { value: "bartin", label: "Bartın" },
  { value: "batman", label: "Batman" },
  { value: "bayburt", label: "Bayburt" },
  { value: "bilecik", label: "Bilecik" },
  { value: "bingol", label: "Bingöl" },
  { value: "bitlis", label: "Bitlis" },
  { value: "bolu", label: "Bolu" },
  { value: "burdur", label: "Burdur" },
  { value: "bursa", label: "Bursa" },
  { value: "canakkale", label: "Çanakkale" },
  { value: "cankiri", label: "Çankırı" },
  { value: "corum", label: "Çorum" },
  { value: "denizli", label: "Denizli" },
  { value: "diyarbakir", label: "Diyarbakır" },
  { value: "duzce", label: "Düzce" },
  { value: "edirne", label: "Edirne" },
  { value: "elazig", label: "Elazığ" },
  { value: "erzincan", label: "Erzincan" },
  { value: "erzurum", label: "Erzurum" },
  { value: "eskisehir", label: "Eskişehir" },
  { value: "gaziantep", label: "Gaziantep" },
  { value: "giresun", label: "Giresun" },
  { value: "gumushane", label: "Gümüşhane" },
  { value: "hakkari", label: "Hakkari" },
  { value: "hatay", label: "Hatay" },
  { value: "igdir", label: "Iğdır" },
  { value: "isparta", label: "Isparta" },
  { value: "istanbul", label: "İstanbul" },
  { value: "izmir", label: "İzmir" },
  { value: "kahramanmaras", label: "Kahramanmaraş" },
  { value: "karabuk", label: "Karabük" },
  { value: "karaman", label: "Karaman" },
  { value: "kars", label: "Kars" },
  { value: "kastamonu", label: "Kastamonu" },
  { value: "kayseri", label: "Kayseri" },
  { value: "kirikkale", label: "Kırıkkale" },
  { value: "kirklareli", label: "Kırklareli" },
  { value: "kirsehir", label: "Kırşehir" },
  { value: "kilis", label: "Kilis" },
  { value: "kocaeli", label: "Kocaeli" },
  { value: "konya", label: "Konya" },
  { value: "kutahya", label: "Kütahya" },
  { value: "malatya", label: "Malatya" },
  { value: "manisa", label: "Manisa" },
  { value: "mardin", label: "Mardin" },
  { value: "mersin", label: "Mersin" },
  { value: "mugla", label: "Muğla" },
  { value: "mus", label: "Muş" },
  { value: "nevsehir", label: "Nevşehir" },
  { value: "nigde", label: "Niğde" },
  { value: "ordu", label: "Ordu" },
  { value: "osmaniye", label: "Osmaniye" },
  { value: "rize", label: "Rize" },
  { value: "sakarya", label: "Sakarya" },
  { value: "samsun", label: "Samsun" },
  { value: "sanliurfa", label: "Şanlıurfa" },
  { value: "siirt", label: "Siirt" },
  { value: "sinop", label: "Sinop" },
  { value: "sivas", label: "Sivas" },
  { value: "sirnak", label: "Şırnak" },
  { value: "tekirdag", label: "Tekirdağ" },
  { value: "tokat", label: "Tokat" },
  { value: "trabzon", label: "Trabzon" },
  { value: "tunceli", label: "Tunceli" },
  { value: "usak", label: "Uşak" },
  { value: "van", label: "Van" },
  { value: "yalova", label: "Yalova" },
  { value: "yozgat", label: "Yozgat" },
  { value: "zonguldak", label: "Zonguldak" },
];

type Client = {
  id: string;
  fullName: string;
  phoneNumber: string;
  brokerageFirm: string;
  city: string;
};

type FormData = {
  fullName: string;
  phoneNumber: string;
  brokerageFirm: string[];
  city: string;
};

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allBrokers, setAllBrokers] = useState<Broker[]>([]);
  const [clientBrokers, setClientBrokers] = useState<string[]>([]);
  const { status } = useSession();
  const router = useRouter();
  
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>();

  const fetchAllBrokers = useCallback(async () => {
    try {
      const response = await fetch('/api/brokers', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch all brokers');
      }
      const data = await response.json();
      setAllBrokers(data);
    } catch (error) {
      console.error('Error fetching all brokers:', error);
    }
  }, []);

  const fetchClientBrokers = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/brokers`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch client brokers');
      }
      const data = await response.json();
      // Sadece seçili aracı kurumların ID'lerini al
      const selectedBrokerIds = data.filter((broker: any) => broker.selected).map((broker: any) => broker.id);
      setClientBrokers(selectedBrokerIds);
    } catch (error) {
      console.error('Error fetching client brokers:', error);
    }
  }, [clientId]);

  const fetchClient = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch client");
      }
      const clientData = await response.json();
      setClient(clientData);
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchClient();
      fetchAllBrokers();
      fetchClientBrokers();
    }
  }, [status, clientId, router, fetchClient, fetchAllBrokers, fetchClientBrokers]);

  // client ve clientBrokers yüklendikten sonra form'u yeniden reset et
  useEffect(() => {
    if (client && clientBrokers.length >= 0) {
      const cityValue = citiesList.find(c => c.label === client.city)?.value || client.city;
      
      reset({
        fullName: client.fullName,
        phoneNumber: client.phoneNumber,
        brokerageFirm: clientBrokers,
        city: cityValue
      });
    }
  }, [client, clientBrokers, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      // Aracı kurum değişikliklerini kaydet
      const brokerResponse = await fetch(`/api/clients/${clientId}/brokers`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ brokerIds: data.brokerageFirm })
      });

      if (!brokerResponse.ok) {
        throw new Error("Failed to update client brokers");
      }

      // Diğer müşteri bilgilerini kaydet
      const brokerLabels = Array.isArray(data.brokerageFirm) ? 
        data.brokerageFirm.map(brokerId => {
          const broker = allBrokers.find(b => b.id === brokerId);
          return broker ? broker.name : brokerId;
        }).join(', ') :
        data.brokerageFirm;
      const cityLabel = citiesList.find(c => c.value === data.city)?.label || data.city;
      
      const submitData = {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        brokerageFirm: brokerLabels,
        city: cityLabel
      };
      
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error("Failed to update client");
      }

      const updatedClient = await response.json();
      setClient(updatedClient);
      // Aracı kurum listesini yeniden yükle
      await fetchClientBrokers();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating client:", error);
      alert("Müşteri güncellenemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (client && clientBrokers.length >= 0) {
      const cityValue = citiesList.find(c => c.label === client.city)?.value || client.city;
      
      reset({
        fullName: client.fullName,
        phoneNumber: client.phoneNumber,
        brokerageFirm: clientBrokers,
        city: cityValue
      });
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

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-10">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{client.fullName}</h1>
            <p className="text-muted-foreground">Müşteri Detayları</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/clients">Müşteri Listesi</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/clients/${clientId}/transactions`}>İşlemler</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Müşteri Bilgileri</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Düzenle
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    İptal
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSubmit(onSubmit)}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Ad Soyad
                  </Label>
                  <p className="text-base">{client.fullName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefon
                  </Label>
                  <p className="text-base">{client.phoneNumber}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Aracı Kurum
                  </Label>
                  <p className="text-base">{client.brokerageFirm}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Şehir
                  </Label>
                  <p className="text-base">{client.city}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName">Ad Soyad</Label>
                  <Input
                    id="fullName"
                    {...register("fullName", { required: "Ad soyad gereklidir" })}
                    disabled={saving}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Telefon</Label>
                  <Input
                    id="phoneNumber"
                    {...register("phoneNumber", { required: "Telefon numarası gereklidir" })}
                    disabled={saving}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="brokerageFirm">Aracı Kurum</Label>
                  <Controller
                    name="brokerageFirm"
                    control={control}
                    rules={{ required: "Aracı kurum gereklidir" }}
                    render={({ field }) => {
                       const options = allBrokers.map(broker => ({
                         value: broker.id,
                         label: broker.name
                       })).filter(option => option.value && option.label);
                       

                       
                       return (
                         <>
                           {options.length === 0 ? (
                             <p className="text-sm text-muted-foreground">
                               Henüz aracı kurum bulunmuyor.
                             </p>
                           ) : (
                             <MultiSelect
                               options={options}
                               selected={field.value || []}
                               onChange={field.onChange}
                               placeholder="Aracı kurum seçiniz..."
                             />
                           )}
                         </>
                       );
                     }}
                  />
                  {errors.brokerageFirm && (
                    <p className="text-sm text-red-500 mt-1">{errors.brokerageFirm.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="city">Şehir</Label>
                  <Controller
                    name="city"
                    control={control}
                    rules={{ required: "Şehir gereklidir" }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Şehir seçiniz..." />
                        </SelectTrigger>
                        <SelectContent>
                          {citiesList.map((city) => (
                            <SelectItem key={city.value} value={city.value}>
                              {city.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}