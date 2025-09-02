"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { MultiSelect } from "@/components/ui/multi-select";

type Broker = {
  id: string;
  name: string;
  code: string;
};

type UserBroker = {
  id: string;
  broker: Broker;
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

type FormData = {
  fullName: string;
  phoneNumber: string;
  city: string;
};

export default function NewClientPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [userBrokers, setUserBrokers] = useState<UserBroker[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  // Tüm aracı kurumları getir
  useEffect(() => {
    const fetchBrokers = async () => {
      if (status === "authenticated") {
        try {
          const response = await fetch("/api/users/brokers", {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            setUserBrokers(data);
          } else {
            console.error("Failed to fetch brokers");
          }
        } catch (error) {
          console.error("Error fetching brokers:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBrokers();
  }, [status]);

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      // Seçilen aracı kurumları virgülle ayrılmış string olarak gönder
      const brokerageFirm = selectedBrokers.length > 0 
        ? selectedBrokers.map(id => userBrokers.find(ub => ub.broker.id === id)?.broker.name).join(", ")
        : "";
      
      // Seçilen şehirleri virgülle ayrılmış string olarak gönder
      const city = selectedCities.length > 0
        ? selectedCities.map(id => citiesList.find(c => c.value === id)?.label).join(", ")
        : data.city;

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          brokerageFirm,
          city,
          brokerIds: selectedBrokers
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Müşteri eklenirken bir hata oluştu");
      }

      router.push("/clients");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UserBroker verilerini MultiSelect için uygun formata çevir
  const brokersList = userBrokers.map(ub => ({
    value: ub.broker.id,
    label: ub.broker.name
  }));

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Yeni Müşteri Ekle</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  {...register("fullName", { required: "Ad Soyad gereklidir" })}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Telefon Numarası</Label>
                <Input
                  id="phoneNumber"
                  {...register("phoneNumber", {
                    required: "Telefon numarası gereklidir",
                  })}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brokerageFirm">Aracı Kurum</Label>
                <MultiSelect
                  options={brokersList}
                  selected={selectedBrokers}
                  onChange={setSelectedBrokers}
                  placeholder="Aracı kurum seçiniz..."
                  searchPlaceholder="Aracı kurum ara..."
                  emptyMessage={userBrokers.length === 0 ? "Önce aracı kurum eklemelisiniz." : "Aracı kurum bulunamadı."}
                />
                {userBrokers.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Aracı kurum seçebilmek için önce "Aracı Kurumlarım" sayfasından aracı kurum eklemelisiniz.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Şehir</Label>
                <MultiSelect
                  options={citiesList}
                  selected={selectedCities}
                  onChange={setSelectedCities}
                  placeholder="Şehir seçiniz..."
                  searchPlaceholder="Şehir ara..."
                  emptyMessage="Şehir bulunamadı."
                />
                {errors.city && (
                  <p className="text-red-500 text-sm">{errors.city.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Müşteri Ekle
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}