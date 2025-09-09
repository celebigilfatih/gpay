import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const brokerSchema = z.object({
  name: z.string().min(1, "Aracı kurum adı zorunludur"),
  code: z.string().min(1, "Aracı kurum kodu zorunludur"),
  isActive: z.boolean().optional().default(true),
});

// GET - Tüm aktif aracı kurumları getir (global access)
export async function GET() {
  try {
    console.log("[BROKER API] GET request received");
    // Global access - no authentication required
    
    console.log("[BROKER API] Fetching all brokers");

    // Tüm aracı kurumları getir ve toplam lot sayılarını hesapla
    const brokers = await prisma.broker.findMany({
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
        transactions: {
          select: {
            lots: true,
            type: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Her aracı kurum için toplam lot sayısını hesapla
    const brokersWithLotCounts = brokers.map(broker => {
      const totalLots = broker.transactions.reduce((total, transaction) => {
        return transaction.type === 'BUY' 
          ? total + transaction.lots 
          : total - transaction.lots;
      }, 0);

      return {
        id: broker.id,
        name: broker.name,
        code: broker.code,
        isActive: broker.isActive,
        createdAt: broker.createdAt,
        updatedAt: broker.updatedAt,
        _count: broker._count,
        totalLots: Math.max(0, totalLots), // Negatif değerleri 0 olarak al
      };
    });

    return NextResponse.json(brokersWithLotCounts);
  } catch (error) {
    console.error("Error fetching brokers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Yeni aracı kurum ekle
export async function POST(request: NextRequest) {
  try {
    // Global access - no authentication required

    const body = await request.json();
    const validatedData = brokerSchema.parse(body);

    // Aynı isim veya kod var mı kontrol et
    const existingBroker = await prisma.broker.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          { code: validatedData.code },
        ],
      },
    });

    if (existingBroker) {
      return NextResponse.json(
        { error: "Bu isim veya kod ile aracı kurum zaten mevcut" },
        { status: 400 }
      );
    }

    const broker = await prisma.broker.create({
      data: validatedData,
    });

    return NextResponse.json(broker, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating broker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}