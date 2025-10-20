import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

// GET transactions for a specific client (global access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Global access - no authentication required

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const { id } = await params;
  const clientId = id;

  try {
    // Global access - no ownership check required

    const whereClause: { clientId: string; type?: TransactionType } = {
      clientId: clientId,
    };

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
    console.error("Error fetching client transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}