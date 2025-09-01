"use client";

import { useState, useEffect } from "react";
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

// Aracı kurum listesi
const brokersList = [
  { value: "a1capital", label: "A1 Capital Yatırım Menkul Değerler A.Ş." },
  { value: "acar", label: "Acar Menkul Değerler A.Ş." },
  { value: "ahlatci", label: "Ahlatcı Yatırım Menkul Değerler A.Ş." },
  { value: "akyatirim", label: "Ak Yatırım Menkul Değerler A.Ş." },
  { value: "alb", label: "ALB Yatırım Menkul Değerler A.Ş." },
  { value: "allbatross", label: "Allbatross Yatırım Menkul Değerler A.Ş." },
  { value: "alnus", label: "Alnus Yatırım Menkul Değerler A.Ş." },
  { value: "alternatif", label: "Alternatif Menkul Değerler A.Ş." },
  { value: "anadolu", label: "Anadolu Yatırım Menkul Kıymetler A.Ş." },
  { value: "ata", label: "Ata Yatırım Menkul Kıymetler A.Ş." },
  { value: "baskent", label: "Başkent Menkul Değerler A.Ş." },
  { value: "bizim", label: "Bizim Menkul Değerler A.Ş." },
  { value: "blupay", label: "Blupay Menkul Değerler A.Ş." },
  { value: "btcturk", label: "BtcTurk Yatırım Menkul Değerler A.Ş." },
  { value: "bulls", label: "Bulls Yatırım Menkul Değerler A.Ş." },
  { value: "burgan", label: "Burgan Yatırım Menkul Değerler A.Ş." },
  { value: "citi", label: "Citi Menkul Değerler A.Ş." },
  { value: "colendi", label: "Colendi Menkul Değerler A.Ş." },
  { value: "delta", label: "Delta Menkul Değerler A.Ş." },
  { value: "deniz", label: "Deniz Yatırım Menkul Kıymetler A.Ş." },
  { value: "destek", label: "Destek Yatırım Menkul Değerler A.Ş." },
  { value: "dinamik", label: "Dinamik Yatırım Menkul Değerler A.Ş." },
  { value: "eurofinans", label: "Euro Finans Menkul Değerler A.Ş." },
  { value: "fiba", label: "Fiba Yatırım Menkul Değerler A.Ş." },
  { value: "galata", label: "Galata Menkul Değerler A.Ş." },
  { value: "garanti", label: "Garanti Yatırım Menkul Kıymetler A.Ş." },
  { value: "gcm", label: "GCM Yatırım Menkul Değerler A.Ş." },
  { value: "gedik", label: "Gedik Yatırım Menkul Değerler A.Ş." },
  { value: "global", label: "Global Menkul Değerler A.Ş." },
  { value: "halk", label: "Halk Yatırım Menkul Değerler A.Ş." },
  { value: "hsbc", label: "HSBC Yatırım Menkul Değerler A.Ş." },
  { value: "icbc", label: "ICBC Turkey Yatırım Menkul Değerler A.Ş." },
  { value: "ikon", label: "Ikon Menkul Değerler A.Ş." },
  { value: "ing", label: "ING Yatırım Menkul Değerler A.Ş." },
  { value: "is", label: "İş Yatırım Menkul Değerler A.Ş." },
  { value: "k", label: "K Menkul Kıymetler A.Ş." },
  { value: "kuveytturk", label: "Kuveyt Türk Yatırım Menkul Değerler A.Ş." },
  { value: "marbas", label: "Marbaş Menkul Değerler A.Ş." },
  { value: "meksa", label: "Meksa Yatırım Menkul Değerler A.Ş." },
  { value: "metro", label: "Metro Menkul Değerler A.Ş." },
  { value: "midas", label: "Midas Menkul Değerler A.Ş." },
  { value: "ncm", label: "Ncm Investment Menkul Değerler A.Ş." },
  { value: "neta", label: "Neta Menkul Değerler A.Ş." },
  { value: "osmanli", label: "Osmanlı Yatırım Menkul Değerler A.Ş." },
  { value: "oyak", label: "Oyak Yatırım Menkul Değerler A.Ş." },
  { value: "papara", label: "Papara Menkul Değerler A.Ş." },
  { value: "pay", label: "Pay Menkul Değerler A.Ş." },
  { value: "phillipcapital", label: "Phillipcapital Menkul Değerler A.Ş." },
  { value: "piramit", label: "Piramit Menkul Kıymetler A.Ş." },
  { value: "prim", label: "Prim Menkul Değerler A.Ş." },
  { value: "qnb", label: "QNB Yatırım Menkul Değerler A.Ş." },
  { value: "raymond", label: "Raymond James Yatırım Menkul Kıymetler A.Ş." },
  { value: "strateji", label: "Strateji Menkul Değerler A.Ş." },
  { value: "seker", label: "Şeker Yatırım Menkul Değerler A.Ş." },
  { value: "tacirler", label: "Tacirler Yatırım Menkul Değerler A.Ş." },
  { value: "teb", label: "TEB Yatırım Menkul Değerler A.Ş." },
  { value: "tera", label: "Tera Yatırım Menkul Değerler A.Ş." },
  { value: "tfg", label: "TFG İstanbul Menkul Değerler A.Ş." },
  { value: "trive", label: "Trive Yatırım Menkul Değerler A.Ş." },
  { value: "turkish", label: "Turkish Menkul Değerler A.Ş." },
  { value: "unlu", label: "Ünlü Menkul Değerler A.Ş." },
  { value: "vakif", label: "Vakıf Yatırım Menkul Değerler A.Ş." },
  { value: "venbey", label: "Venbey Yatırım Menkul Değerler A.Ş." },
  { value: "yapikredi", label: "Yapı Kredi Yatırım Menkul Değerler A.Ş." },
  { value: "yatirim", label: "Yatırım Finansman Menkul Değerler A.Ş." },
  { value: "ziraat", label: "Ziraat Yatırım Menkul Değerler A.Ş." },
];

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
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchClient();
    }
  }, [status, clientId, router]);

  const fetchClient = async () => {
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
      
      // Dropdown'lar için value'ları bul
      const brokerValues = clientData.brokerageFirm ? 
        clientData.brokerageFirm.split(',').map((firm: string) => {
          const trimmedFirm = firm.trim();
          return brokersList.find(b => b.label === trimmedFirm)?.value || trimmedFirm;
        }) : [];
      const cityValue = citiesList.find(c => c.label === clientData.city)?.value || clientData.city;
      
      reset({
        fullName: clientData.fullName,
        phoneNumber: clientData.phoneNumber,
        brokerageFirm: brokerValues,
        city: cityValue
      });
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      // Value'ları label'lara dönüştür
      const brokerLabels = Array.isArray(data.brokerageFirm) ? 
        data.brokerageFirm.map(value => brokersList.find(b => b.value === value)?.label || value).join(', ') :
        data.brokerageFirm;
      const cityLabel = citiesList.find(c => c.value === data.city)?.label || data.city;
      
      const submitData = {
        ...data,
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
    if (client) {
      // Dropdown'lar için value'ları bul
      const brokerValues = client.brokerageFirm ? 
        client.brokerageFirm.split(',').map((firm: string) => {
          const trimmedFirm = firm.trim();
          return brokersList.find(b => b.label === trimmedFirm)?.value || trimmedFirm;
        }) : [];
      const cityValue = citiesList.find(c => c.label === client.city)?.value || client.city;
      
      reset({
        fullName: client.fullName,
        phoneNumber: client.phoneNumber,
        brokerageFirm: brokerValues,
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
                <Button onClick={() => setIsEditing(true)}>Düzenle</Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    İptal
                  </Button>
                  <Button 
                    onClick={handleSubmit(onSubmit)}
                    disabled={saving}
                  >
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Ad Soyad</Label>
                  <p className="text-lg">{client.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Telefon</Label>
                  <p className="text-lg">{client.phoneNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Aracı Kurum</Label>
                  <p className="text-lg">{client.brokerageFirm}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Şehir</Label>
                  <p className="text-lg">{client.city}</p>
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
                    render={({ field }) => (
                      <MultiSelect
                        options={brokersList}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Aracı kurum seçiniz..."
                      />
                    )}
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