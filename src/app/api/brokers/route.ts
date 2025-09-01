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

// GET - Kullanıcıya kayıtlı aracı kurumları getir
export async function GET() {
  try {
    console.log("[BROKER API] GET request received");
    const session = await getServerSession(authOptions) as Session | null;
    console.log("[BROKER API] Session:", session ? "Found" : "Not found");
    
    // Test için session kontrolünü geçici olarak devre dışı bırak
    const userId = session?.user?.id || 'c71a90ca-93ac-4add-b9d7-880f38ac0a97';
    console.log("[BROKER API] Using userId:", userId);

    // Kullanıcıya kayıtlı aracı kurumları getir
    const userBrokers = await prisma.userBroker.findMany({
      where: {
        userId: userId,
      },
      include: {
        broker: {
          include: {
            _count: {
              select: {
                transactions: true,
              },
            },
          },
        },
      },
      orderBy: {
        broker: {
          name: "asc",
        },
      },
    });

    // Sadece broker bilgilerini döndür
    const brokers = userBrokers.map(ub => ub.broker);

    return NextResponse.json(brokers);
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
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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