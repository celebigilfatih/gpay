import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import type { Session } from "next-auth";
import { TransactionType } from "@prisma/client";

// GET all transactions
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
   if (!session || !session.user) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const type = searchParams.get("type");

  try {
    const whereClause: { clientId?: string | { in: string[] }; type?: TransactionType } = {};
    
    if (clientId) {
      // First check if the client belongs to the current user
      const client = await prisma.client.findUnique({
        where: {
          id: clientId,
        },
      });

      if (!client || client.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      whereClause.clientId = clientId;
    } else {
      // If no clientId is provided, get all transactions for clients belonging to the user
      const userClients = await prisma.client.findMany({
        where: {
          userId: session.user.id as string,
        },
        select: {
          id: true,
        },
      });

      whereClause.clientId = {
        in: userClients.map((client) => client.id),
      };
    }

    if (type && Object.values(TransactionType).includes(type as TransactionType)) {
      whereClause.type = type as TransactionType;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        client: true,
        stock: true,
        broker: true,
        buyTransaction: {
          include: {
            stock: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST create a new transaction
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { clientId, stockId, type, lots, price, date, brokerId, buyTransactionId, notes } = await request.json();

    // Validate required fields
    if (!clientId || !stockId || !type || !lots || !price || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Broker ID is required only for BUY transactions
    if (type === "BUY" && !brokerId) {
      return NextResponse.json(
        { error: "Aracı kurum seçimi zorunludur" },
        { status: 400 }
      );
    }

    // Check if the client belongs to the current user
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
    });

    if (!client || client.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the stock exists
    const stock = await prisma.stock.findUnique({
      where: {
        id: stockId,
      },
    });

    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    // Calculate profit and commission for SELL transactions
    let profit = null;
    let commission = null;

    if (type === "SELL") {
      let buyTransaction = null;
      
      if (buyTransactionId) {
        // Use the specific buy transaction if provided
        buyTransaction = await prisma.transaction.findUnique({
          where: {
            id: buyTransactionId,
          },
        });
      } else {
        // Find the most recent BUY transaction for this stock and client
        buyTransaction = await prisma.transaction.findFirst({
          where: {
            clientId,
            stockId,
            type: "BUY",
          },
          orderBy: {
            date: "desc",
          },
        });
      }

      if (buyTransaction) {
        // Calculate profit: (sell price - buy price) * lots
        profit = (price - buyTransaction.price) * lots;
        
        // Calculate commission: 30% of profit (only if profit is positive)
        if (profit > 0) {
          commission = profit * 0.3;
        }
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        lots,
        price,
        date: new Date(date),
        notes,
        profit,
        commission,
        client: {
          connect: {
            id: clientId,
          },
        },
        stock: {
          connect: {
            id: stockId,
          },
        },
        ...(brokerId && {
          broker: {
            connect: {
              id: brokerId,
            },
          },
        }),
        ...(buyTransactionId && {
          buyTransaction: {
            connect: {
              id: buyTransactionId,
            },
          },
        }),
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}