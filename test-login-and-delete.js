// Node.js built-in fetch kullanıyoruz (Node 18+)

async function testLoginAndDelete() {
    console.log('🔍 Login ve Delete Test Başlatılıyor...\n');
    
    try {
        // 1. Session durumunu kontrol et
        console.log('1️⃣ Session Durumu Kontrolü:');
        const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
        const sessionData = await sessionResponse.json();
        console.log(`   Status: ${sessionResponse.status}`);
        console.log(`   Session Data:`, JSON.stringify(sessionData, null, 2));
        
        if (!sessionData.user) {
            console.log('❌ Session bulunamadı! Giriş yapmanız gerekiyor.\n');
            return;
        }
        
        console.log(`✅ Giriş yapılmış! User: ${sessionData.user.email}\n`);
        
        // 2. Clients listesini al
        console.log('2️⃣ Clients Listesi:');
        const clientsResponse = await fetch('http://localhost:3000/api/clients');
        console.log(`   Status: ${clientsResponse.status}`);
        
        if (clientsResponse.ok) {
            const clients = await clientsResponse.json();
            console.log(`   Toplam Client Sayısı: ${clients.length}`);
            
            // Cem Karaca'yı bul
            const cemKaraca = clients.find(c => 
                c.name.includes('Cem Karaca') || c.phone === '05305758377'
            );
            
            if (cemKaraca) {
                console.log(`   ✅ Cem Karaca bulundu: ID = ${cemKaraca.id}`);
                
                // 3. Delete işlemini dene
                console.log('\n3️⃣ Delete İşlemi:');
                const deleteResponse = await fetch(`http://localhost:3000/api/clients/${cemKaraca.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`   Status: ${deleteResponse.status}`);
                const deleteResult = await deleteResponse.text();
                console.log(`   Response:`, deleteResult);
                
                if (deleteResponse.ok) {
                    console.log('✅ Client başarıyla silindi!');
                } else {
                    console.log('❌ Delete işlemi başarısız!');
                }
            } else {
                console.log('   ❌ Cem Karaca bulunamadı!');
                console.log('   Mevcut clientler:');
                clients.slice(0, 5).forEach(c => {
                    console.log(`     - ${c.name} (${c.phone}) - ID: ${c.id}`);
                });
            }
        } else {
            const error = await clientsResponse.text();
            console.log(`   ❌ Clients alınamadı: ${error}`);
        }
        
    } catch (error) {
        console.error('❌ Test sırasında hata:', error.message);
    }
}

testLoginAndDelete();
