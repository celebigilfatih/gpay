import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get all transactions with stock and broker information
    const transactions = await prisma.transaction.findMany({
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
          },
        },
        broker: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Group transactions by stock and calculate total lots
    const stockSummary = transactions.reduce((acc, transaction) => {
      const stockSymbol = transaction.stock.symbol;
      const stockName = transaction.stock.name;
      
      if (!acc[stockSymbol]) {
        acc[stockSymbol] = {
          symbol: stockSymbol,
          name: stockName,
          totalLots: 0,
          buyLots: 0,
          sellLots: 0,
          brokers: new Map(),
        };
      }
      
      // Calculate net position (BUY - SELL)
      const lotChange = transaction.type === "BUY" ? transaction.lots : -transaction.lots;
      acc[stockSymbol].totalLots += lotChange;
      
      if (transaction.type === "BUY") {
        acc[stockSymbol].buyLots += transaction.lots;
      } else {
        acc[stockSymbol].sellLots += transaction.lots;
      }
      
      // Track broker-wise lots
      if (transaction.broker?.name) {
        const brokerName = transaction.broker.name;
        if (!acc[stockSymbol].brokers.has(brokerName)) {
          acc[stockSymbol].brokers.set(brokerName, {
            totalLots: 0,
            buyLots: 0,
            sellLots: 0,
          });
        }
        
        const brokerData = acc[stockSymbol].brokers.get(brokerName)!;
        brokerData.totalLots += lotChange;
        
        if (transaction.type === "BUY") {
          brokerData.buyLots += transaction.lots;
        } else {
          brokerData.sellLots += transaction.lots;
        }
      }
      
      return acc;
    }, {} as Record<string, {
      symbol: string;
      name: string;
      totalLots: number;
      buyLots: number;
      sellLots: number;
      brokers: Map<string, { totalLots: number; buyLots: number; sellLots: number }>;
    }>);

    // Convert Map to Object for JSON serialization and filter only positive lots
    const formattedStockSummary = Object.values(stockSummary)
      .filter(stock => stock.totalLots > 0) // Only show stocks with positive total lots
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        totalLots: stock.totalLots,
        buyLots: stock.buyLots,
        sellLots: stock.sellLots,
        brokers: Object.fromEntries(
          Array.from(stock.brokers.entries())
            .filter(([_, data]) => data.totalLots > 0) // Only show brokers with positive lots
            .map(([brokerName, data]) => [
              brokerName,
              {
                totalLots: data.totalLots,
                buyLots: data.buyLots,
                sellLots: data.sellLots,
              },
            ])
        ),
      }));

    return NextResponse.json(formattedStockSummary);
  } catch (error) {
    console.error("Error fetching stock summary:", error);
    return NextResponse.json(
      { message: "Failed to fetch stock summary" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}