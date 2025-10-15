import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { Session } from "next-auth";

// GET - Belirli bir müşterinin hisse pozisyonlarını getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = params.id;

    // Müşterinin bu kullanıcıya ait olduğunu kontrol et
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Bu müşterinin tüm işlemlerini getir (BUY ve SELL)
    const transactions = await prisma.transaction.findMany({
      where: {
        clientId: clientId
      },
      select: {
        stockId: true,
        brokerId: true,
        lots: true,
        price: true,
        type: true,
        stock: {
          select: {
            id: true,
            symbol: true,
            name: true
          }
        },
        broker: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Hisse ve broker bazında grupla
    const groupedTransactions = transactions.reduce((acc, transaction) => {
      const key = `${transaction.stockId}-${transaction.brokerId || 'null'}`;
      if (!acc[key]) {
        acc[key] = {
          stockId: transaction.stockId,
          stock: transaction.stock,
          brokerId: transaction.brokerId,
          broker: transaction.broker,
          transactions: []
        };
      }
      acc[key].transactions.push(transaction);
      return acc;
    }, {} as Record<string, any>);

    // Her grup için net pozisyon hesapla
    const positions = Object.values(groupedTransactions).map((group: any) => {
      // Net lot hesapla (BUY pozitif, SELL negatif)
      const totalLots = group.transactions.reduce((sum: number, t: any) => {
        return sum + (t.type === 'BUY' ? t.lots : -t.lots);
      }, 0);

      // Sadece pozitif pozisyonları (satılabilir lotları) döndür
      if (totalLots > 0) {
        // Ortalama alış fiyatını hesapla
        const buyTransactions = group.transactions.filter((t: any) => t.type === 'BUY');
        const totalBuyValue = buyTransactions.reduce((sum: number, t: any) => sum + (t.lots * t.price), 0);
        const totalBuyLots = buyTransactions.reduce((sum: number, t: any) => sum + t.lots, 0);
        const averagePrice = totalBuyLots > 0 ? totalBuyValue / totalBuyLots : 0;

        return {
          stockId: group.stockId,
          stock: group.stock,
          broker: group.broker,
          availableLots: totalLots,
          averagePrice: averagePrice
        };
      }
      return null;
    }).filter(Boolean); // null değerleri filtrele

    return NextResponse.json(positions);
  } catch (error) {
    console.error("Error fetching client positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch client positions" },
      { status: 500 }
    );
  }
}