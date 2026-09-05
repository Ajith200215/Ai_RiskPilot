import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ transactions: [], customers: [], merchants: [] });
    }

    const searchTerm = query.trim();

    // Run searches in parallel
    const [transactions, customers, merchants] = await Promise.all([
      db.transaction.findMany({
        where: {
          id: { contains: searchTerm, mode: "insensitive" },
        },
        include: {
          customer: { select: { name: true } },
          merchant: { select: { name: true } },
        },
        take: 5,
      }),
      db.customer.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
            { id: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
      db.merchant.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { category: { contains: searchTerm, mode: "insensitive" } },
            { id: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      transactions,
      customers,
      merchants,
    });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
