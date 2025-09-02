import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/options";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

// GET - Belirli bir müşteriye kayıtlı aracı kurumları getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("[CLIENT BROKERS API] GET request received for client:", resolvedParams.id);
    const session = await getServerSession(authOptions) as Session | null;
    
    // Geçici olarak auth kontrolünü devre dışı bırak
    console.log("[CLIENT BROKERS API] Session:", session ? "exists" : "null");
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const clientId = resolvedParams.id;
    console.log("[CLIENT BROKERS API] Using clientId:", clientId);

    // Müşteriye kayıtlı aracı kurumları getir
    const clientBrokers = await prisma.clientBroker.findMany({
      where: {
        clientId: clientId,
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
    const brokers = clientBrokers.map(cb => cb.broker);

    return NextResponse.json(brokers);
  } catch (error) {
    console.error("Error fetching client brokers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Müşteriye yeni aracı kurum ekle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = resolvedParams.id;
    const body = await request.json();
    const { brokerId } = body;

    if (!brokerId) {
      return NextResponse.json(
        { error: "Broker ID is required" },
        { status: 400 }
      );
    }

    // Müşterinin varlığını kontrol et
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Aracı kurumun varlığını kontrol et
    const broker = await prisma.broker.findUnique({
      where: { id: brokerId },
    });

    if (!broker) {
      return NextResponse.json(
        { error: "Broker not found" },
        { status: 404 }
      );
    }

    // Zaten kayıtlı mı kontrol et
    const existingClientBroker = await prisma.clientBroker.findUnique({
      where: {
        clientId_brokerId: {
          clientId: clientId,
          brokerId: brokerId,
        },
      },
    });

    if (existingClientBroker) {
      return NextResponse.json(
        { error: "Bu aracı kurum zaten müşteriye kayıtlı" },
        { status: 400 }
      );
    }

    // Yeni ClientBroker kaydı oluştur
    const clientBroker = await prisma.clientBroker.create({
      data: {
        clientId: clientId,
        brokerId: brokerId,
      },
      include: {
        broker: true,
      },
    });

    return NextResponse.json(clientBroker, { status: 201 });
  } catch (error) {
    console.error("Error adding broker to client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Müşteriden aracı kurum kaldır
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('brokerId');

    if (!brokerId) {
      return NextResponse.json(
        { error: "Broker ID is required" },
        { status: 400 }
      );
    }

    // ClientBroker kaydını bul ve sil
    const clientBroker = await prisma.clientBroker.findUnique({
      where: {
        clientId_brokerId: {
          clientId: clientId,
          brokerId: brokerId,
        },
      },
    });

    if (!clientBroker) {
      return NextResponse.json(
        { error: "Bu aracı kurum müşteriye kayıtlı değil" },
        { status: 404 }
      );
    }

    await prisma.clientBroker.delete({
      where: {
        id: clientBroker.id,
      },
    });

    return NextResponse.json({ message: "Aracı kurum başarıyla kaldırıldı" });
  } catch (error) {
    console.error("Error removing broker from client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}