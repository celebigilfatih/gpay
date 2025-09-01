import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/options";
import type { Session } from "next-auth";

// GET a specific client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as Session | null;

  // Test için session kontrolünü geçici olarak devre dışı bırak
  const userId = session?.user?.id || 'c71a90ca-93ac-4add-b9d7-880f38ac0a97';

  try {
    const client = await prisma.client.findUnique({
      where: {
        id,
      },
      include: {
        transactions: {
          include: {
            stock: true,
          },
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if the client belongs to the logged-in user
    if (client.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT update a client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as Session | null;
     if (!session || !session.user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

  try {
    // First check if the client exists and belongs to the user
    const existingClient = await prisma.client.findUnique({
      where: {
        id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (existingClient.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fullName, phoneNumber, brokerageFirm, city } = await request.json();

    // Validate required fields
    if (!fullName || !phoneNumber || !brokerageFirm || !city) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedClient = await prisma.client.update({
      where: {
        id,
      },
      data: {
        fullName,
        phoneNumber,
        brokerageFirm,
        city,
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as Session | null;

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First check if the client exists and belongs to the user
    const existingClient = await prisma.client.findUnique({
      where: {
        id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (existingClient.userId !== (session.user.id as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the client (cascade delete will remove related transactions)
    await prisma.client.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}