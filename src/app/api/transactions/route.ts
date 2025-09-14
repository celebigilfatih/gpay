import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import type { Session } from "next-auth";
import { TransactionType } from "@prisma/client";

// GET all transactions (global access)
export async function GET(request: NextRequest) {
  // Global access - no authentication required

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const type = searchParams.get("type");

  try {
    const whereClause: { clientId?: string | { in: string[] }; type?: TransactionType } = {};
    
    if (clientId) {
      // Global access - no ownership check required
      whereClause.clientId = clientId;
    }
    // If no clientId is provided, get all transactions (global access)

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
  // Global access - no authentication required

  try {
    const body = await request.json();
    console.log('Received transaction data:', body);
    const { clientId, stockId, type, lots, price, date, brokerId, buyTransactionId, notes } = body;

    // Validate required fields
    if (!clientId || !stockId || !type || lots === undefined || lots === null || price === undefined || price === null || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert and validate numeric fields
    const lotsNum = Number(lots);
    const priceNum = Number(price);
    
    if (isNaN(lotsNum) || lotsNum <= 0) {
      return NextResponse.json(
        { error: "Lot sayısı pozitif bir sayı olmalıdır" },
        { status: 400 }
      );
    }
    
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { error: "Fiyat pozitif bir sayı olmalıdır" },
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

    // Global access - no client ownership check required

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
        profit = (priceNum - buyTransaction.price) * lotsNum;
        
        // Calculate commission: 30% of profit (positive for profit, negative for loss)
        commission = profit * 0.3;
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        lots: lotsNum,
        price: priceNum,
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