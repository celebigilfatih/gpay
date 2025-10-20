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
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;

    // Tüm aracı kurumları getir
    const allBrokers = await prisma.broker.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    // Bu müşterinin aracı kurumlarını getir
    const clientBrokers = await prisma.clientBroker.findMany({
      where: {
        clientId: clientId
      },
      include: {
        broker: true
      }
    });

    // Aracı kurumları işaretle (müşteriye ait olanları selected: true)
    const brokers = allBrokers.map(broker => ({
      id: broker.id,
      name: broker.name,
      selected: clientBrokers.some(cb => cb.brokerId === broker.id)
    }));

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
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;
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

    // Müşteri-aracı kurum ilişkisinin zaten var olup olmadığını kontrol et
    const existingRelation = await prisma.clientBroker.findFirst({
      where: {
        clientId: clientId,
        brokerId: brokerId
      }
    });

    if (existingRelation) {
      return NextResponse.json(
        { error: "This broker is already associated with the client" },
        { status: 409 }
      );
    }

    // Yeni müşteri-aracı kurum ilişkisi oluştur
    const clientBroker = await prisma.clientBroker.create({
      data: {
        clientId: clientId,
        brokerId: brokerId
      },
      include: {
        broker: true
      }
    });

    return NextResponse.json(clientBroker.broker);
  } catch (error) {
    console.error("Error adding broker to client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Müşterinin aracı kurumlarını güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;
    const body = await request.json();
    const { brokerIds } = body;

    if (!Array.isArray(brokerIds)) {
      return NextResponse.json(
        { error: "Broker IDs must be an array" },
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

    // Kullanıcının bu müşteriyi düzenleme yetkisi var mı kontrol et
    if (client.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Mevcut tüm client-broker ilişkilerini sil
    await prisma.clientBroker.deleteMany({
      where: {
        clientId: clientId
      }
    });

    // Yeni ilişkileri oluştur
    if (brokerIds.length > 0) {
      // Broker ID'lerin geçerli olduğunu kontrol et
      const validBrokers = await prisma.broker.findMany({
        where: {
          id: {
            in: brokerIds
          }
        }
      });

      const validBrokerIds = validBrokers.map(b => b.id);

      if (validBrokerIds.length > 0) {
        await prisma.clientBroker.createMany({
          data: validBrokerIds.map(brokerId => ({
            clientId: clientId,
            brokerId: brokerId
          }))
        });
      }
    }

    // Güncellenmiş aracı kurum listesini döndür
    const updatedClientBrokers = await prisma.clientBroker.findMany({
      where: {
        clientId: clientId
      },
      include: {
        broker: true
      }
    });

    const brokers = updatedClientBrokers.map(cb => cb.broker);
    return NextResponse.json(brokers);
  } catch (error) {
    console.error("Error updating client brokers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}