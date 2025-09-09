import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    // Global access - no authentication required

    const stocks = await prisma.stock.findMany({
      orderBy: {
        symbol: "asc",
      },
    });

    return NextResponse.json(stocks);
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return NextResponse.json(
      { message: "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Global access - no authentication required

    const { symbol, name } = await request.json();

    // Validate required fields
    if (!symbol || !name) {
      return NextResponse.json(
        { message: "Symbol and name are required" },
        { status: 400 }
      );
    }

    // Check if stock already exists
    const existingStock = await prisma.stock.findFirst({
      where: {
        symbol: symbol,
      },
    });

    if (existingStock) {
      return NextResponse.json(
        { message: "Stock with this symbol already exists" },
        { status: 400 }
      );
    }

    // Create new stock
    const stock = await prisma.stock.create({
      data: {
        symbol,
        name,
      },
    });

    return NextResponse.json(stock, { status: 201 });
  } catch (error) {
    console.error("Error creating stock:", error);
    return NextResponse.json(
      { message: "Failed to create stock" },
      { status: 500 }
    );
  }
}