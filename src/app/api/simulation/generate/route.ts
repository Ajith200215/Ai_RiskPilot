import { NextResponse } from "next/server";
import { generateSyntheticTransaction, generateBulkTransactions, ProfileType } from "@/lib/generateTransaction";
import { calculateRiskScore } from "@/lib/riskEngine";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const profile: ProfileType = body.profile || "random";
    const count: number = body.count || 1;

    const generatedItems = [];

    for (let i = 0; i < count; i++) {
      const result = await generateSyntheticTransaction({ profile });
      const { transaction, customer, merchant } = result;

      // Calculate risk score immediately
      const now = new Date();
      const accountAgeDays = Math.max(
        0.0001,
        (now.getTime() - new Date(customer.accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

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

      // Write risk factors to DB
      if (riskResult.riskFactors.length > 0) {
        await db.riskFactor.createMany({
          data: riskResult.riskFactors.map((f) => ({
            transactionId: transaction.id,
            factorKey: f.factorKey,
            severity: f.severity,
            points: f.points,
            description: f.description,
            evidence: f.evidence,
          })),
        });
      }

      // Update Transaction status/risk level
      let autoStatus = "APPROVED";
      if (riskResult.riskLevel === "HIGH") autoStatus = "FLAGGED";
      else if (riskResult.riskLevel === "MEDIUM") autoStatus = "ALLOW_WITH_MONITORING";

      const updatedTransaction = await db.transaction.update({
        where: { id: transaction.id },
        data: {
          riskScore: riskResult.riskScore,
          riskLevel: riskResult.riskLevel,
          status: autoStatus,
        },
        include: {
          customer: true,
          merchant: true,
          riskFactors: true,
        },
      });

      // Emit Risk Scored Event
      await db.event.create({
        data: {
          transactionId: transaction.id,
          customerId: customer.id,
          merchantId: merchant.id,
          type: "RISK_SCORED",
          label: `Automated Risk Engine score: ${riskResult.riskScore}/100 (${riskResult.riskLevel})`,
        },
      });

      // Emit Alert if high risk
      if (riskResult.riskLevel === "HIGH") {
        await db.alert.create({
          data: {
            type: "HIGH_RISK_TRANSACTION",
            severity: "HIGH",
            message: `High risk payment ₹${transaction.amount.toLocaleString("en-IN")} flagged for ${customer.name}`,
            relatedTransactionId: transaction.id,
            relatedMerchantId: merchant.id,
          },
        });
      }

      generatedItems.push(updatedTransaction);
    }

    return NextResponse.json({
      success: true,
      count: generatedItems.length,
      transactions: generatedItems,
    });
  } catch (error: any) {
    console.error("Error generating simulation transactions:", error);
    return NextResponse.json(
      { error: "Failed to generate transactions", details: error.message },
      { status: 500 }
    );
  }
}
