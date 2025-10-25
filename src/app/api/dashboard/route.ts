import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Global access - no authentication required

    // Get total clients
    const totalClients = await prisma.client.count();

    // Get total transactions
    const totalTransactions = await prisma.transaction.count();

    // Get total profit and commission
    const profitAndCommission = await prisma.transaction.aggregate({
      where: {
        profit: {
          not: null,
        },
      },
      _sum: {
        profit: true,
        commission: true,
      },
    });

    const totalProfit = profitAndCommission._sum.profit || 0;
    const totalCommission = profitAndCommission._sum.commission || 0;

    // Get top clients with their transaction counts and profits
    const topClients = await prisma.client.findMany({
      take: 5,
      include: {
        transactions: {
          select: {
            profit: true,
            commission: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        transactions: {
          _count: 'desc',
        },
      },
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
          },
        },
        stock: {
          select: {
            symbol: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Format the response with optimized data processing
    const formattedTopClients = topClients.map((client) => {
      const totalProfit = client.transactions.reduce(
        (sum, t) => sum + (t.profit || 0),
        0
      );
      const totalCommission = client.transactions.reduce(
        (sum, t) => sum + (t.commission || 0),
        0
      );

      return {
        id: client.id,
        fullName: client.fullName,
        transactionCount: client._count.transactions,
        totalProfit,
        totalCommission,
      };
    });

    // Format recent transactions with minimal processing
    const formattedRecentTransactions = recentTransactions.map((t) => ({
      id: t.id,
      clientName: t.client.fullName,
      clientId: t.client.id,
      stockSymbol: t.stock.symbol,
      type: t.type,
      lots: t.lots,
      price: t.price,
      date: t.date.toISOString(),
      profit: t.profit,
      commission: t.commission,
    }));

    const response = NextResponse.json({
      totalClients,
      totalTransactions,
      totalProfit,
      totalCommission,
      recentTransactions: formattedRecentTransactions,
      topClients: formattedTopClients,
    });

    // Add performance headers
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    
    return response;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}