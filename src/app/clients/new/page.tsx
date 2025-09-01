"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { MultiSelect } from "@/components/ui/multi-select";

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
  { value: "investaz", label: "Invest-AZ Yatırım Menkul Değerler A.Ş." },
  { value: "info", label: "İnfo Yatırım Menkul Değerler A.Ş." },
  { value: "integral", label: "İntegral Yatırım Menkul Değerler A.Ş." },
  { value: "is", label: "İş Yatırım Menkul Değerler A.Ş." },
  { value: "jpmorgan", label: "J.P. Morgan Menkul Değerler A.Ş." },
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      // Seçilen aracı kurumları virgülle ayrılmış string olarak gönder
      const brokerageFirm = selectedBrokers.length > 0 
        ? selectedBrokers.map(id => brokersList.find(b => b.value === id)?.label).join(", ")
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
          city
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto py-8">
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
                  emptyMessage="Aracı kurum bulunamadı."
                />

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