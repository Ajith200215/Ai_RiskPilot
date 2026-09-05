import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateRiskScore } from "@/lib/riskEngine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        customer: true,
        merchant: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const { customer, merchant } = transaction;

    const now = new Date();
    const accountAgeDays = Math.max(
      0.0001,
      (now.getTime() - new Date(customer.accountCreatedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Run pure risk engine calculation
    const riskResult = calculateRiskScore({
      amount: transaction.amount,
      averageTransactionAmount: customer.averageTransactionAmount,
      accountAgeDays,
      failedAttempts: transaction.failedAttemptsBeforeSuccess,
      isNewDevice: transaction.isNewDevice,
      isLocationAnomaly: transaction.isLocationAnomaly,
      merchantRiskScore: merchant.merchantRiskScore,
      merchantRefundRate: merchant.refundRate,
      merchantChargebackRate: merchant.chargebackRate,
    });

    // Clear existing factors for re-analysis
    await db.riskFactor.deleteMany({
      where: { transactionId: id },
    });

    // Write new RiskFactor rows
    if (riskResult.riskFactors.length > 0) {
      await db.riskFactor.createMany({
        data: riskResult.riskFactors.map((f) => ({
          transactionId: id,
          factorKey: f.factorKey,
          severity: f.severity,
          points: f.points,
          description: f.description,
          evidence: f.evidence,
        })),
      });
    }

    // Update Transaction risk score & level
    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: {
        riskScore: riskResult.riskScore,
        riskLevel: riskResult.riskLevel,
      },
      include: {
        customer: true,
        merchant: true,
        riskFactors: true,
      },
    });

    // Create Audit Event
    await db.event.create({
      data: {
        transactionId: id,
        customerId: customer.id,
        merchantId: merchant.id,
        type: "RISK_SCORED",
        label: `Risk Engine evaluated score: ${riskResult.riskScore}/100 (${riskResult.riskLevel})`,
      },
    });

    // Trigger High Risk Alert if applicable
    if (riskResult.riskLevel === "HIGH") {
      const topFactor = riskResult.riskFactors[0];
      await db.alert.create({
        data: {
          type: "HIGH_RISK_TRANSACTION",
          severity: "HIGH",
          message: `High risk transaction ₹${transaction.amount.toLocaleString("en-IN")} flagged. ${topFactor ? topFactor.description : ""}`,
          relatedTransactionId: id,
          relatedMerchantId: merchant.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      riskResult,
    });
  } catch (error: any) {
    console.error("Error analyzing transaction:", error);
    return NextResponse.json(
      { error: "Failed to analyze transaction", details: error.message },
      { status: 500 }
    );
  }
}
