const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const brokers = [
  { name: 'A1 Capital Yatırım Menkul Değerler A.Ş.', code: 'A1CAP', isActive: true },
  { name: 'Acar Menkul Değerler A.Ş.', code: 'ACAR', isActive: true },
  { name: 'Ahlatcı Yatırım Menkul Değerler A.Ş.', code: 'AHLAT', isActive: true },
  { name: 'Ak Yatırım Menkul Değerler A.Ş.', code: 'AKYAT', isActive: true },
  { name: 'ALB Yatırım Menkul Değerler A.Ş.', code: 'ALB', isActive: true },
  { name: 'Allbatross Yatırım Menkul Değerler A.Ş.', code: 'ALLBT', isActive: true },
  { name: 'Alnus Yatırım Menkul Değerler A.Ş.', code: 'ALNUS', isActive: true },
  { name: 'Alternatif Menkul Değerler A.Ş.', code: 'ALTER', isActive: true },
  { name: 'Anadolu Yatırım Menkul Kıymetler A.Ş.', code: 'ANADL', isActive: true },
  { name: 'Ata Yatırım Menkul Kıymetler A.Ş.', code: 'ATA', isActive: true },
  { name: 'Başkent Menkul Değerler A.Ş.', code: 'BASKN', isActive: true },
  { name: 'Bizim Menkul Değerler A.Ş.', code: 'BIZIM', isActive: true },
  { name: 'Blupay Menkul Değerler A.Ş.', code: 'BLUPA', isActive: true },
  { name: 'Bulls Yatırım Menkul Değerler A.Ş.', code: 'BULLS', isActive: true },
  { name: 'BtcTurk Yatırım Menkul Değerler A.Ş.', code: 'BTCTR', isActive: true },
  { name: 'Burgan Yatırım Menkul Değerler A.Ş.', code: 'BURGN', isActive: true },
  { name: 'Citi Menkul Değerler A.Ş.', code: 'CITI', isActive: true },
  { name: 'Colendi Menkul Değerler A.Ş.', code: 'COLEN', isActive: true },
  { name: 'Delta Menkul Değerler A.Ş.', code: 'DELTA', isActive: true },
  { name: 'Deniz Yatırım Menkul Kıymetler A.Ş.', code: 'DENIZ', isActive: true },
  { name: 'Destek Yatırım Menkul Değerler A.Ş.', code: 'DESTEK', isActive: true },
  { name: 'Dinamik Yatırım Menkul Değerler A.Ş.', code: 'DINAM', isActive: true },
  { name: 'Euro Finans Menkul Değerler A.Ş.', code: 'EUROF', isActive: true },
  { name: 'Fiba Yatırım Menkul Değerler A.Ş.', code: 'FIBA', isActive: true },
  { name: 'Galata Menkul Değerler A.Ş.', code: 'GALAT', isActive: true },
  { name: 'Garanti Yatırım Menkul Kıymetler A.Ş.', code: 'GARAN', isActive: true },
  { name: 'GCM Yatırım Menkul Değerler A.Ş.', code: 'GCM', isActive: true },
  { name: 'Gedik Yatırım Menkul Değerler A.Ş.', code: 'GEDIK', isActive: true },
  { name: 'Global Menkul Değerler A.Ş.', code: 'GLOBL', isActive: true },
  { name: 'Halk Yatırım Menkul Değerler A.Ş.', code: 'HALK', isActive: true },
  { name: 'HSBC Yatırım Menkul Değerler A.Ş.', code: 'HSBC', isActive: true },
  { name: 'ICBC Turkey Yatırım Menkul Değerler A.Ş.', code: 'ICBC', isActive: true },
  { name: 'Ikon Menkul Değerler A.Ş.', code: 'IKON', isActive: true },
  { name: 'ING Yatırım Menkul Değerler A.Ş.', code: 'ING', isActive: true },
  { name: 'Invest-AZ Yatırım Menkul Değerler A.Ş.', code: 'INVAZ', isActive: true },
  { name: 'Info Yatırım Menkul Değerler A.Ş.', code: 'INFO', isActive: true },
  { name: 'İntegral Yatırım Menkul Değerler A.Ş.', code: 'INTEG', isActive: true },
  { name: 'İş Yatırım Menkul Değerler A.Ş.', code: 'ISYAT', isActive: true },
  { name: 'J.P. Morgan Menkul Değerler A.Ş.', code: 'JPMOR', isActive: true },
  { name: 'K Menkul Kıymetler A.Ş.', code: 'KMKUL', isActive: true },
  { name: 'Kuveyt Türk Yatırım Menkul Değerler A.Ş.', code: 'KUVEY', isActive: true },
  { name: 'Marbaş Menkul Değerler A.Ş.', code: 'MARBA', isActive: true },
  { name: 'Meksa Yatırım Menkul Değerler A.Ş.', code: 'MEKSA', isActive: true },
  { name: 'Metro Menkul Değerler A.Ş.', code: 'METRO', isActive: true },
  { name: 'Midas Menkul Değerler A.Ş.', code: 'MIDAS', isActive: true },
  { name: 'Ncm Investment Menkul Değerler A.Ş.', code: 'NCM', isActive: true },
  { name: 'Neta Menkul Değerler A.Ş.', code: 'NETA', isActive: true },
  { name: 'Osmanlı Yatırım Menkul Değerler A.Ş.', code: 'OSMAN', isActive: true },
  { name: 'Oyak Yatırım Menkul Değerler A.Ş.', code: 'OYAK', isActive: true },
  { name: 'Papara Menkul Değerler A.Ş.', code: 'PAPAR', isActive: true },
  { name: 'Pay Menkul Değerler A.Ş.', code: 'PAY', isActive: true },
  { name: 'Phillipcapital Menkul Değerler A.Ş.', code: 'PHILL', isActive: true },
  { name: 'Piramit Menkul Kıymetler A.Ş.', code: 'PIRAM', isActive: true },
  { name: 'Prim Menkul Değerler A.Ş.', code: 'PRIM', isActive: true },
  { name: 'QNB Yatırım Menkul Değerler A.Ş.', code: 'QNB', isActive: true },
  { name: 'Raymond James Yatırım Menkul Kıymetler A.Ş.', code: 'RAYMO', isActive: true },
  { name: 'Strateji Menkul Değerler A.Ş.', code: 'STRAT', isActive: true },
  { name: 'Şeker Yatırım Menkul Değerler A.Ş.', code: 'SEKER', isActive: true },
  { name: 'Tacirler Yatırım Menkul Değerler A.Ş.', code: 'TACIR', isActive: true },
  { name: 'TEB Yatırım Menkul Değerler A.Ş.', code: 'TEB', isActive: true },
  { name: 'Tera Yatırım Menkul Değerler A.Ş.', code: 'TERA', isActive: true },
  { name: 'TFG İstanbul Menkul Değerler A.Ş.', code: 'TFG', isActive: true },
  { name: 'Trive Yatırım Menkul Değerler A.Ş.', code: 'TRIVE', isActive: true },
  { name: 'Turkish Menkul Değerler A.Ş.', code: 'TURKI', isActive: true },
  { name: 'Ünlü Menkul Değerler A.Ş.', code: 'UNLU', isActive: true },
  { name: 'Vakıf Yatırım Menkul Değerler A.Ş.', code: 'VAKIF', isActive: true },
  { name: 'Venbey Yatırım Menkul Değerler A.Ş.', code: 'VENBE', isActive: true },
  { name: 'Yapı Kredi Yatırım Menkul Değerler A.Ş.', code: 'YAPIK', isActive: true },
  { name: 'Yatırım Finansman Menkul Değerler A.Ş.', code: 'YATFI', isActive: true },
  { name: 'Ziraat Yatırım Menkul Değerler A.Ş.', code: 'ZIRAT', isActive: true }
];

async function seedBrokers() {
  try {
    console.log('Aracı kurumlar ekleniyor...');
    
    for (const broker of brokers) {
      const existingBroker = await prisma.broker.findFirst({
        where: {
          OR: [
            { name: broker.name },
            { code: broker.code }
          ]
        }
      });
      
      if (!existingBroker) {
        await prisma.broker.create({
          data: broker
        });
        console.log(`✓ ${broker.name} eklendi`);
      } else {
        console.log(`- ${broker.name} zaten mevcut`);
      }
    }
    
    console.log('\nTüm aracı kurumlar başarıyla işlendi!');
    
    const totalBrokers = await prisma.broker.count();
    console.log(`Toplam aracı kurum sayısı: ${totalBrokers}`);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBrokers();