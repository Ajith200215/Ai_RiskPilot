import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { decision, analystNotes } = body; // "APPROVE" | "REVIEW" | "HOLD" | "BLOCK"

    if (!["APPROVE", "REVIEW", "HOLD", "BLOCK"].includes(decision)) {
      return NextResponse.json(
        { error: "Invalid decision action" },
        { status: 400 }
      );
    }

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: { investigation: true, customer: true, merchant: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if decision overrides AI recommendation
    let overriddenByAnalyst = false;
    if (transaction.investigation) {
      const aiRec = transaction.investigation.recommendation;
      if (
        (decision === "APPROVE" && (aiRec === "BLOCK" || aiRec === "HOLD" || aiRec === "MANUAL_REVIEW")) ||
        (decision === "BLOCK" && (aiRec === "APPROVE" || aiRec === "ALLOW_WITH_MONITORING")) ||
        (decision === "REVIEW" && aiRec === "APPROVE")
      ) {
        overriddenByAnalyst = true;
      }
    }

    // Map decision to TransactionStatus
    let newStatus = transaction.status;
    if (decision === "APPROVE") newStatus = "APPROVED";
    else if (decision === "BLOCK") newStatus = "BLOCK";
    else if (decision === "HOLD") newStatus = "HOLD";
    else if (decision === "REVIEW") newStatus = "MANUAL_REVIEW";

    // Upsert Decision record
    const decisionRecord = await db.decision.upsert({
      where: { transactionId: id },
      create: {
        transactionId: id,
        decision,
        overriddenByAnalyst,
        analystNotes: analystNotes || "Decision recorded by human risk analyst",
      },
      update: {
        decision,
        overriddenByAnalyst,
        analystNotes: analystNotes || "Decision updated by human risk analyst",
      },
    });

    // Update Transaction status
    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: { status: newStatus },
      include: {
        customer: true,
        merchant: true,
        riskFactors: true,
        investigation: true,
        decision: true,
      },
    });

    // Log Audit Event
    await db.event.create({
      data: {
        transactionId: id,
        customerId: transaction.customerId,
        merchantId: transaction.merchantId,
        type: "DECISION_MADE",
        label: `Analyst recorded decision: ${decision}${overriddenByAnalyst ? " (AI Recommendation Overridden)" : ""}`,
      },
    });

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      decisionRecord,
    });
  } catch (error: any) {
    console.error("Error recording analyst decision:", error);
    return NextResponse.json(
      { error: "Failed to record decision", details: error.message },
      { status: 500 }
    );
  }
}
