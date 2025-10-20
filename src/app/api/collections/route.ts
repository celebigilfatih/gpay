import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import { PrismaClient } from "@prisma/client";
import type { Session } from "next-auth";

// Type tanımları
type ClientCommissionData = {
  client: {
    id: string;
    fullName: string;
  };
  totalCommission: number;
  positiveCommission: number;
  negativeCommission: number;
  totalPayments: number;
  remainingBalance: number;
  transactionCount: number;
  transactions: Array<{
    id: string;
    date: Date;
    stock: { symbol: string; name: string };
    broker: { name: string } | null;
    lots: number;
    price: number;
    profit: number | null;
    commission: number | null;
    type: string;
  }>;
};

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kullanıcının müşterilerine ait komisyon içeren işlemleri getir
    const transactions = await prisma.transaction.findMany({
      where: {
        client: {
          userId: session.user.id,
        },
        commission: {
          not: null, // Sadece komisyon olan işlemler
        },
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        stock: {
          select: {
            symbol: true,
            name: true,
          },
        },
        broker: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Kullanıcının müşterilerine ait ödemeleri getir
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Müşteri bazında komisyon ve ödeme toplamlarını hesapla
    const clientCommissions = transactions.reduce((acc, transaction) => {
      const clientId = transaction.client.id;
      
      if (!acc[clientId]) {
        acc[clientId] = {
          client: transaction.client,
          totalCommission: 0,
          positiveCommission: 0, // Tahsil edilecek
          negativeCommission: 0, // İade edilecek
          totalPayments: 0, // Toplam ödenen
          remainingBalance: 0, // Kalan bakiye
          transactionCount: 0,
          transactions: [],
        };
      }

      const commission = transaction.commission || 0;
      acc[clientId].totalCommission += commission;
      acc[clientId].transactionCount += 1;
      
      if (commission > 0) {
        acc[clientId].positiveCommission += commission;
      } else {
        acc[clientId].negativeCommission += Math.abs(commission);
      }

      acc[clientId].transactions.push({
        id: transaction.id,
        date: transaction.date,
        stock: transaction.stock,
        broker: transaction.broker,
        lots: transaction.lots,
        price: transaction.price,
        profit: transaction.profit,
        commission: transaction.commission,
        type: transaction.type,
      });

      return acc;
    }, {} as Record<string, ClientCommissionData>);

    // Ödemeleri müşteri bazında topla
    const clientPayments = payments.reduce((acc, payment) => {
      const clientId = payment.client.id;
      if (!acc[clientId]) {
        acc[clientId] = 0;
      }
      acc[clientId] += payment.amount;
      return acc;
    }, {} as Record<string, number>);

    // Komisyon verilerine ödeme bilgilerini ekle
    Object.keys(clientCommissions).forEach(clientId => {
      clientCommissions[clientId].totalPayments = clientPayments[clientId] || 0;
      clientCommissions[clientId].remainingBalance = 
        clientCommissions[clientId].totalCommission - clientCommissions[clientId].totalPayments;
    });

    // Array'e çevir ve sırala (kalan bakiyeye göre)
    const collectionsData = Object.values(clientCommissions).sort(
      (a, b) => Math.abs(b.remainingBalance) - Math.abs(a.remainingBalance)
    );

    // Özet istatistikleri hesapla
    const summary = {
      totalClients: collectionsData.length,
      totalCommissionToCollect: collectionsData.reduce(
        (sum, client) => sum + client.positiveCommission,
        0
      ),
      totalCommissionToRefund: collectionsData.reduce(
        (sum, client) => sum + client.negativeCommission,
        0
      ),
      totalPayments: collectionsData.reduce(
        (sum, client) => sum + client.totalPayments,
        0
      ),
      totalRemainingBalance: collectionsData.reduce(
        (sum, client) => sum + client.remainingBalance,
        0
      ),
      netCommission: collectionsData.reduce(
        (sum, client) => sum + client.totalCommission,
        0
      ),
      totalTransactions: transactions.length,
    };

    return NextResponse.json({
      summary,
      clients: collectionsData,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}