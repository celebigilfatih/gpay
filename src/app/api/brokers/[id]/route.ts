import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const brokerUpdateSchema = z.object({
  name: z.string().min(1, "Aracı kurum adı zorunludur").optional(),
  code: z.string().min(1, "Aracı kurum kodu zorunludur").optional(),
  isActive: z.boolean().optional(),
});

// GET - Tek aracı kurum getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const broker = await prisma.broker.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!broker) {
      return NextResponse.json(
        { error: "Aracı kurum bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(broker);
  } catch (error) {
    console.error("Error fetching broker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Aracı kurum güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = brokerUpdateSchema.parse(body);

    // Mevcut broker var mı kontrol et
    const existingBroker = await prisma.broker.findUnique({
      where: { id: params.id },
    });

    if (!existingBroker) {
      return NextResponse.json(
        { error: "Aracı kurum bulunamadı" },
        { status: 404 }
      );
    }

    // Aynı isim veya kod başka bir broker'da var mı kontrol et
    if (validatedData.name || validatedData.code) {
      const duplicateBroker = await prisma.broker.findFirst({
        where: {
          AND: [
            { id: { not: params.id } },
            {
              OR: [
                validatedData.name ? { name: validatedData.name } : {},
                validatedData.code ? { code: validatedData.code } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (duplicateBroker) {
        return NextResponse.json(
          { error: "Bu isim veya kod ile başka bir aracı kurum zaten mevcut" },
          { status: 400 }
        );
      }
    }

    const updatedBroker = await prisma.broker.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return NextResponse.json(updatedBroker);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating broker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Aracı kurum sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mevcut broker var mı kontrol et
    const existingBroker = await prisma.broker.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!existingBroker) {
      return NextResponse.json(
        { error: "Aracı kurum bulunamadı" },
        { status: 404 }
      );
    }

    // İşlem varsa silmeye izin verme
    if (existingBroker._count.transactions > 0) {
      return NextResponse.json(
        { error: "Bu aracı kurumun işlemleri bulunduğu için silinemez. Önce pasif duruma getirebilirsiniz." },
        { status: 400 }
      );
    }

    await prisma.broker.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Aracı kurum başarıyla silindi" });
  } catch (error) {
    console.error("Error deleting broker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}