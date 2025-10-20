import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import type { Session } from "next-auth";

// GET all clients (global access)
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        fullName: "asc",
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST create a new client
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fullName, phoneNumber, brokerageFirm, city, brokerIds } = await request.json();

    // Validate required fields
    if (!fullName || !phoneNumber || !brokerageFirm || !city) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the client
    const client = await prisma.client.create({
      data: {
        fullName,
        phoneNumber,
        brokerageFirm,
        city,
        userId: session.user.id,
      },
    });

    // Create ClientBroker relationships if brokerIds are provided
    if (brokerIds && Array.isArray(brokerIds) && brokerIds.length > 0) {
      // Ensure all brokerIds exist in the system
      const validBrokers = await prisma.broker.findMany({
        where: {
          id: {
            in: brokerIds,
          },
        },
      });

      const validBrokerIds = validBrokers.map(b => b.id);
      
      // Create ClientBroker entries for valid brokers
      if (validBrokerIds.length > 0) {
        await prisma.clientBroker.createMany({
          data: validBrokerIds.map(brokerId => ({
            clientId: client.id,
            brokerId: brokerId,
          })),
        });
      }
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}