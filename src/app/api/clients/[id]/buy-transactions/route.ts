import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

// GET buy transactions for a specific client (global access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Global access - no authentication required

  const { id } = await params;
  const clientId = id;

  try {
    // Global access - no ownership check required

    const buyTransactions = await prisma.transaction.findMany({
      where: {
        clientId: clientId,
        type: TransactionType.BUY,
      },
      include: {
        client: true,
        stock: true,
        broker: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(buyTransactions);
  } catch (error) {
    console.error("Error fetching client buy transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch buy transactions" },
      { status: 500 }
    );
  }
}