import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import type { Session } from "next-auth";

// GET all clients for the logged-in user
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
   if (!session || !session.user) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

  try {
    const clients = await prisma.client.findMany({
      where: {
        userId: session.user.id,
      },
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
    const { fullName, phoneNumber, brokerageFirm, city } = await request.json();

    // Validate required fields
    if (!fullName || !phoneNumber || !brokerageFirm || !city) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        fullName,
        phoneNumber,
        brokerageFirm,
        city,
        userId: session.user.id,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}