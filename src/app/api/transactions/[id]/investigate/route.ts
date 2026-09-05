import { NextResponse } from "next/server";
import { investigateTransaction } from "@/lib/aiInvestigate";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const investigation = await investigateTransaction(id);
    return NextResponse.json({ success: true, investigation });
  } catch (error: any) {
    console.error("Error running AI investigation:", error);
    return NextResponse.json(
      { error: "Failed to complete AI investigation", details: error.message },
      { status: 500 }
    );
  }
}
