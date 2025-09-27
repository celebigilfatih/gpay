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

  // Global access - no authentication required

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

    // Global access - no ownership check required

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
  
  // Debug logging
  console.log('🔍 DELETE request received for client:', id);
  console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
  
  const session = await getServerSession(authOptions) as Session | null;
  
  console.log('🔍 Session status:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userEmail: session?.user?.email
  });

  if (!session || !session.user) {
    console.log('❌ Unauthorized: No session or user');
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