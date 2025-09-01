import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const userBrokerSchema = z.object({
  brokerId: z.string().min(1, "Broker ID zorunludur"),
});

// GET - Kullanıcının kayıtlı aracı kurumlarını getir
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userBrokers = await prisma.userBroker.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        broker: true,
      },
      orderBy: {
        broker: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(userBrokers);
  } catch (error) {
    console.error("Error fetching user brokers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Kullanıcıya yeni aracı kurum ekle
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = userBrokerSchema.parse(body);

    // Zaten kayıtlı mı kontrol et
    const existingUserBroker = await prisma.userBroker.findUnique({
      where: {
        userId_brokerId: {
          userId: session.user.id,
          brokerId: validatedData.brokerId,
        },
      },
    });

    if (existingUserBroker) {
      return NextResponse.json(
        { error: "Bu aracı kurum zaten kayıtlı" },
        { status: 400 }
      );
    }

    const userBroker = await prisma.userBroker.create({
      data: {
        userId: session.user.id,
        brokerId: validatedData.brokerId,
      },
      include: {
        broker: true,
      },
    });

    return NextResponse.json(userBroker, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating user broker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Kullanıcıdan aracı kurum kaldır
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get("brokerId");

    if (!brokerId) {
      return NextResponse.json(
        { error: "Broker ID gerekli" },
        { status: 400 }
      );
    }

    await prisma.userBroker.deleteMany({
      where: {
        userId: session.user.id,
        brokerId: brokerId,
      },
    });

    return NextResponse.json({ message: "Aracı kurum kaldırıldı" });
  } catch (error) {
    console.error("Error deleting user broker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}