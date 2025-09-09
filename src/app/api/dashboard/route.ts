import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
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

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      select: {
        id: true,
        type: true,
        lots: true,
        price: true,
        date: true,
        profit: true,
        commission: true,
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
        date: "desc",
      },
      take: 5,
    });

    // Get top clients by commission
    const topClients = await prisma.client.findMany({
      where: {
        transactions: {
          some: {},
        },
      },
      select: {
        id: true,
        fullName: true,
        _count: {
          select: {
            transactions: true,
          },
        },
        transactions: {
          select: {
            profit: true,
            commission: true,
          },
          where: {
            profit: {
              not: null,
            },
          },
        },
      },
      orderBy: {
        transactions: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Format the response
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

    // Format recent transactions
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

    return NextResponse.json({
      totalClients,
      totalTransactions,
      totalProfit,
      totalCommission,
      recentTransactions: formattedRecentTransactions,
      topClients: formattedTopClients,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}