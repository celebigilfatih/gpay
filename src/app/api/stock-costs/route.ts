import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { Session } from "next-auth";

// Define types for better type safety
type TransactionData = {
  stockId: string;
  clientId: string;
  brokerId: string | null;
  lots: number;
  price: number;
  type: string;
  createdAt?: Date;
};

type GroupedTransaction = {
  stockId: string;
  clientId: string;
  brokerId: string | null;
  transactions: TransactionData[];
};

type Purchase = {
  lots: number;
  price: number;
  totalCost: number;
};

type StockGroup = {
  stock: {
    id: string;
    symbol: string;
    name: string;
  } | null;
  clients: Array<{
    client: {
      id: string;
      fullName: string;
    } | null;
    broker: {
      id: string;
      name: string;
    } | null;
    totalLots: number;
    purchasePrice: number;
    purchases: Purchase[];
  }>;
};

// GET - Hisse bazlı müşteri maliyetlerini getir
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kullanıcının müşterilerine ait tüm işlemleri getir (BUY ve SELL)
    const transactions = await prisma.transaction.findMany({
      where: {
        client: {
          userId: session.user.id
        }
      },
      select: {
        stockId: true,
        clientId: true,
        brokerId: true,
        lots: true,
        price: true,
        type: true
      }
    });

    // Transaction'ları manuel olarak grupla
    const groupedTransactions = transactions.reduce((acc: Record<string, GroupedTransaction>, transaction) => {
      const key = `${transaction.stockId}-${transaction.clientId}-${transaction.brokerId || 'null'}`;
      if (!acc[key]) {
        acc[key] = {
          stockId: transaction.stockId,
          clientId: transaction.clientId,
          brokerId: transaction.brokerId,
          transactions: []
        };
      }
      acc[key].transactions.push(transaction);
      return acc;
    }, {});

    // Her grup için detaylı bilgileri getir
    const detailedStockCosts = await Promise.all(
      Object.values(groupedTransactions).map(async (group: GroupedTransaction) => {
        const client = await prisma.client.findUnique({
          where: { id: group.clientId },
          select: { id: true, fullName: true }
        });

        const stock = await prisma.stock.findUnique({
          where: { id: group.stockId },
          select: { id: true, symbol: true, name: true }
        });

        const broker = group.brokerId ? await prisma.broker.findUnique({
          where: { id: group.brokerId },
          select: { id: true, name: true }
        }) : null;

        // Net lot hesapla (BUY pozitif, SELL negatif)
        const totalLots = group.transactions.reduce((sum: number, t: TransactionData) => {
          return sum + (t.type === 'BUY' ? t.lots : -t.lots);
        }, 0);
        
        // Tüm alış işlemlerini al ve sırala
        const buyTransactions = group.transactions
          .filter((t: TransactionData) => t.type === 'BUY')
          .sort((a: TransactionData, b: TransactionData) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        
        // Her alış işlemini ayrı ayrı döndür
        const purchases: Purchase[] = buyTransactions.map((buyTx: TransactionData) => ({
          lots: buyTx.lots,
          price: buyTx.price,
          totalCost: buyTx.lots * buyTx.price
        }));
        
        // İlk alış fiyatını kullan
        const purchasePrice = buyTransactions.length > 0 ? buyTransactions[0].price : 0;

        return {
          stockId: group.stockId,
          stock: stock,
          client: client,
          broker: broker,
          totalLots: totalLots,
          purchasePrice: purchasePrice,
          purchases: purchases
        };
      })
    );

    // Hisse bazında grupla
    const groupedByStock = detailedStockCosts.reduce((acc, item) => {
      const stockKey = item.stockId;
      if (!acc[stockKey]) {
        acc[stockKey] = {
          stock: item.stock,
          clients: []
        };
      }
      acc[stockKey].clients.push({
        client: item.client,
        broker: item.broker,
        totalLots: item.totalLots,
        purchasePrice: item.purchasePrice,
        purchases: item.purchases
      });
      return acc;
    }, {} as Record<string, StockGroup>);

    // Array formatına çevir
    const result = Object.values(groupedByStock);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching stock costs:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock costs" },
      { status: 500 }
    );
  }
}