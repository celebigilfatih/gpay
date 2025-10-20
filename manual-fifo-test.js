// Metur (Vakıf) için manuel FIFO hesaplama testi
// API'den gelen 53.13 TL/lot değerinin doğruluğunu kontrol edelim

console.log('=== METUR (VAKIF) FIFO MALİYET HESAPLAMA TESTİ ===');

// Test verileri - API'den gelen sonuçlara göre
// Metur (Vakıf): 8,000 lot - 425,000 TL (53.13 TL/lot)

// Varsayımsal işlemler (FIFO mantığını test etmek için)
const testTransactions = [
  // BUY işlemleri (kronolojik sırada)
  { type: 'BUY', lots: 10000, price: 50.00, date: '2024-01-01' },
  { type: 'BUY', lots: 5000, price: 55.00, date: '2024-01-02' },
  { type: 'BUY', lots: 3000, price: 60.00, date: '2024-01-03' },
  
  // SELL işlemleri
  { type: 'SELL', lots: 7000, price: 65.00, date: '2024-01-04' },
  { type: 'SELL', lots: 3000, price: 70.00, date: '2024-01-05' }
];

console.log('\n=== Test İşlemleri ===');
testTransactions.forEach((tx, index) => {
  console.log(`${index + 1}. ${tx.type} - ${tx.lots} lot @ ${tx.price} TL - ${tx.date}`);
});

// Net lot hesapla
let netLots = 0;
testTransactions.forEach(tx => {
  if (tx.type === 'BUY') {
    netLots += tx.lots;
  } else if (tx.type === 'SELL') {
    netLots -= tx.lots;
  }
});

console.log(`\nNet Lot: ${netLots}`);

// FIFO mantığıyla maliyet hesapla
const buyTransactions = testTransactions
  .filter(t => t.type === 'BUY')
  .sort((a, b) => new Date(a.date) - new Date(b.date));

console.log('\n=== BUY İşlemleri (Kronolojik) ===');
buyTransactions.forEach((tx, index) => {
  console.log(`${index + 1}. ${tx.lots} lot @ ${tx.price} TL - ${tx.date}`);
});

let remainingLots = netLots;
let totalCost = 0;

console.log(`\n=== FIFO Maliyet Hesaplama ===`);
console.log(`Hesaplanacak lot sayısı: ${remainingLots}`);

if (remainingLots > 0) {
  let lotsToCalculate = remainingLots;
  
  for (const buyTx of buyTransactions) {
    if (lotsToCalculate <= 0) break;
    
    const lotsFromThisTx = Math.min(lotsToCalculate, buyTx.lots);
    const costFromThisTx = lotsFromThisTx * buyTx.price;
    
    console.log(`- ${lotsFromThisTx} lot @ ${buyTx.price} TL = ${costFromThisTx} TL`);
    
    totalCost += costFromThisTx;
    lotsToCalculate -= lotsFromThisTx;
  }
}

const averageCost = netLots > 0 ? totalCost / netLots : 0;

console.log(`\n=== SONUÇ ===`);
console.log(`Net Lot: ${netLots}`);
console.log(`Toplam Maliyet: ${totalCost} TL`);
console.log(`Ortalama Maliyet: ${averageCost.toFixed(2)} TL/lot`);

// 53.13 TL/lot için geriye dönük hesaplama
console.log('\n=== 53.13 TL/LOT İÇİN GERIYE DÖNÜK HESAPLAMA ===');
const targetAverage = 53.13;
const targetLots = 8000;
const targetTotalCost = targetAverage * targetLots;
console.log(`Hedef: ${targetLots} lot @ ${targetAverage} TL/lot = ${targetTotalCost} TL`);

// Bu sonucu verebilecek işlem kombinasyonları
console.log('\nMuhtemel işlem senaryoları:');
console.log('1. 8000 lot @ 53.13 TL = 425,040 TL');
console.log('2. 5000 lot @ 50 TL + 3000 lot @ 58.33 TL = 425,000 TL');
console.log('3. 3000 lot @ 50 TL + 5000 lot @ 55 TL = 425,000 TL');

// Doğru hesaplama kontrolü
const scenario2Cost = (5000 * 50) + (3000 * 58.33);
const scenario3Cost = (3000 * 50) + (5000 * 55);
console.log(`\nSenaryo 2 kontrolü: ${scenario2Cost.toFixed(2)} TL`);
console.log(`Senaryo 3 kontrolü: ${scenario3Cost.toFixed(2)} TL`);
console.log(`Senaryo 3 ortalama: ${(scenario3Cost / 8000).toFixed(2)} TL/lot`);
