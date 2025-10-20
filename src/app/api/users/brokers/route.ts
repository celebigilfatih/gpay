import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { Session } from 'next-auth';

// GET - Kullanıcının aracı kurumlarını getir
export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Tüm aktif aracı kurumları getir (müşteri ekleme için)
    const allBrokers = await prisma.broker.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // UserBroker formatına çevir
    const userBrokers = allBrokers.map(broker => ({
      id: broker.id,
      broker: broker
    }));

    return NextResponse.json(userBrokers);
  } catch (error) {
    console.error("Error fetching user brokers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}