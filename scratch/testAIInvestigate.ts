import { generateSyntheticTransaction } from "../src/lib/generateTransaction";
import { calculateRiskScore } from "../src/lib/riskEngine";
import { investigateTransaction } from "../src/lib/aiInvestigate";
import { db } from "../src/lib/db";

async function testAI() {
  console.log("Testing AI Investigation Layer...");

  // Generate high-risk transaction
  const { transaction, customer, merchant } = await generateSyntheticTransaction({ profile: "high-risk" });
  console.log("Generated Tx for Investigation:", transaction.id);

  // Score transaction first
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
  });

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

  await db.transaction.update({
    where: { id: transaction.id },
    data: {
      riskScore: riskResult.riskScore,
      riskLevel: riskResult.riskLevel,
    },
  });

  // Run AI investigation
  const investigation = await investigateTransaction(transaction.id);

  console.log("AI Investigation Created:", {
    id: investigation.id,
    recommendation: investigation.recommendation,
    confidence: investigation.confidence,
    summary: investigation.investigationSummary,
  });

  if (!investigation.recommendation || !investigation.investigationSummary) {
    throw new Error("Invalid investigation object returned");
  }

  console.log("AI Investigation Test SUCCESS!");
}

testAI()
  .catch((err) => {
    console.error("AI test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
