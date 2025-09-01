import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/options";
import type { Session } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

     if (!session || !session.user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

    const { id: stockId } = await params;

    const stock = await prisma.stock.findUnique({
      where: {
        id: stockId,
      },
    });

    if (!stock) {
      return NextResponse.json({ message: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json(stock);
  } catch (error) {
    console.error("Error fetching stock:", error);
    return NextResponse.json(
      { message: "Failed to fetch stock" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: stockId } = await params;
    const { symbol, name } = await request.json();

    // Validate required fields
    if (!symbol || !name) {
      return NextResponse.json(
        { message: "Symbol and name are required" },
        { status: 400 }
      );
    }

    // Check if stock exists
    const existingStock = await prisma.stock.findUnique({
      where: {
        id: stockId,
      },
    });

    if (!existingStock) {
      return NextResponse.json({ message: "Stock not found" }, { status: 404 });
    }

    // Update stock
    const updatedStock = await prisma.stock.update({
      where: {
        id: stockId,
      },
      data: {
        symbol,
        name,
      },
    });

    return NextResponse.json(updatedStock);
  } catch (error) {
    console.error("Error updating stock:", error);
    return NextResponse.json(
      { message: "Failed to update stock" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: stockId } = await params;

    // Check if stock exists
    const existingStock = await prisma.stock.findUnique({
      where: {
        id: stockId,
      },
    });

    if (!existingStock) {
      return NextResponse.json({ message: "Stock not found" }, { status: 404 });
    }

    // Check if stock is used in any transactions
    const transactionsWithStock = await prisma.transaction.findFirst({
      where: {
        stockId: stockId,
      },
    });

    if (transactionsWithStock) {
      return NextResponse.json(
        { message: "Cannot delete stock that is used in transactions" },
        { status: 400 }
      );
    }

    // Delete stock
    await prisma.stock.delete({
      where: {
        id: stockId,
      },
    });

    return NextResponse.json({ message: "Stock deleted successfully" });
  } catch (error) {
    console.error("Error deleting stock:", error);
    return NextResponse.json(
      { message: "Failed to delete stock" },
      { status: 500 }
    );
  }
}