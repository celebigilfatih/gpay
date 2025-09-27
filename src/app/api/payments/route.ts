import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    let payments;
    
    if (clientId) {
      // Belirli bir müşterinin ödemelerini getir
      payments = await prisma.payment.findMany({
        where: {
          clientId: clientId,
          userId: session.user.id,
        },
        include: {
          client: {
            select: {
              fullName: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
    } else {
      // Tüm ödemeleri getir
      payments = await prisma.payment.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          client: {
            select: {
              fullName: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
    }

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, amount, date, description, method } = body;

    // Validation
    if (!clientId || !amount || !date) {
      return NextResponse.json(
        { error: 'Client ID, amount, and date are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Müşterinin bu kullanıcıya ait olduğunu kontrol et
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      );
    }

    // Ödemeyi kaydet
    const payment = await prisma.payment.create({
      data: {
        clientId,
        amount: parseFloat(amount),
        date: new Date(date),
        description: description || null,
        method: method || 'CASH',
        userId: session.user.id,
      },
      include: {
        client: {
          select: {
            fullName: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}