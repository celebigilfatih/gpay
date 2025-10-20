import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/options';
import { PrismaClient } from '@prisma/client';
import { Session } from 'next-auth';

const prisma = new PrismaClient();

// GET a specific payment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: Session | null = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const paymentId = id;

    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
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

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if the payment belongs to the current user
    if (payment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT (update) a payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: Session | null = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const paymentId = id;
    const body = await request.json();
    const { amount, date, description, method } = body;

    // Validation
    if (!amount || !date) {
      return NextResponse.json(
        { error: 'Amount and date are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // First, check if the payment exists and belongs to the user
    const existingPayment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        client: true,
      },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if the payment belongs to the current user
    if (existingPayment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the payment
    const updatedPayment = await prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        amount: parseFloat(amount),
        date: new Date(date),
        description: description || null,
        method: method || 'CASH',
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

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session: Session | null = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const paymentId = id;

    // First, check if the payment exists and belongs to the user
    const existingPayment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if the payment belongs to the current user
    if (existingPayment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the payment
    await prisma.payment.delete({
      where: {
        id: paymentId,
      },
    });

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}