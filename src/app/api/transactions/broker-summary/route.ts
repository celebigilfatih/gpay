import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all transactions with broker and stock information
    const transactions = await prisma.transaction.findMany({
      include: {
        broker: true,
        stock: true,
      },
    });

    // Group transactions by broker
    const brokerSummary = transactions.reduce((acc, transaction) => {
      // Skip transactions without broker
      if (!transaction.broker?.name) {
        return acc;
      }

      const brokerName = transaction.broker.name;
      
      if (!acc[brokerName]) {
        acc[brokerName] = {
          name: brokerName,
          code: transaction.broker.code,
          totalLots: 0,
          buyLots: 0,
          sellLots: 0,
          stocks: new Map(),
        };
      }

      // Calculate lot change (positive for BUY, negative for SELL)
      const lotChange = transaction.type === "BUY" ? transaction.lots : -transaction.lots;
      acc[brokerName].totalLots += lotChange;
      
      if (transaction.type === "BUY") {
        acc[brokerName].buyLots += transaction.lots;
      } else {
        acc[brokerName].sellLots += transaction.lots;
      }

      // Track stock-wise lots for this broker
      const stockSymbol = transaction.stock.symbol;
      if (!acc[brokerName].stocks.has(stockSymbol)) {
        acc[brokerName].stocks.set(stockSymbol, {
          symbol: stockSymbol,
          name: transaction.stock.name,
          totalLots: 0,
          buyLots: 0,
          sellLots: 0,
        });
      }
      
      const stockData = acc[brokerName].stocks.get(stockSymbol)!;
      stockData.totalLots += lotChange;
      
      if (transaction.type === "BUY") {
        stockData.buyLots += transaction.lots;
      } else {
        stockData.sellLots += transaction.lots;
      }
      
      return acc;
    }, {} as Record<string, {
      name: string;
      code: string;
      totalLots: number;
      buyLots: number;
      sellLots: number;
      stocks: Map<string, { symbol: string; name: string; totalLots: number; buyLots: number; sellLots: number }>;
    }>);

    // Convert Map to Object for JSON serialization and filter only positive lots
    const formattedBrokerSummary = Object.values(brokerSummary)
      .filter(broker => broker.totalLots > 0) // Only show brokers with positive total lots
      .map(broker => ({
        name: broker.name,
        code: broker.code,
        totalLots: broker.totalLots,
        buyLots: broker.buyLots,
        sellLots: broker.sellLots,
        stocks: Object.fromEntries(
          Array.from(broker.stocks.entries())
            .filter(([, data]) => data.totalLots > 0) // Only show stocks with positive lots
            .map(([stockSymbol, data]) => [
              stockSymbol,
              {
                symbol: data.symbol,
                name: data.name,
                totalLots: data.totalLots,
                buyLots: data.buyLots,
                sellLots: data.sellLots,
              },
            ])
        ),
      }));

    return NextResponse.json(formattedBrokerSummary);
  } catch (error) {
    console.error("Error fetching broker summary:", error);
    return NextResponse.json(
      { message: "Failed to fetch broker summary" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}