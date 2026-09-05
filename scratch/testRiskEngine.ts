import { calculateRiskScore } from "../src/lib/riskEngine";
import { generateSyntheticTransaction } from "../src/lib/generateTransaction";
import { db } from "../src/lib/db";

async function testRiskEngine() {
  console.log("Testing Pure Risk Engine Function...");

  // Case 1: Normal transaction -> LOW
  const normalRisk = calculateRiskScore({
    amount: 1500,
    averageTransactionAmount: 2000,
    accountAgeDays: 400,
    failedAttempts: 0,
    isNewDevice: false,
    isLocationAnomaly: false,
    merchantRiskScore: 10,
  });
  console.log("Case 1 (Normal):", normalRisk.riskScore, normalRisk.riskLevel);
  if (normalRisk.riskLevel !== "LOW") throw new Error("Case 1 expected LOW");

  // Case 2: New account + large payment -> HIGH
  const case2Risk = calculateRiskScore({
    amount: 80000,
    averageTransactionAmount: 0,
    accountAgeDays: 0.01, // under 1 hour
    failedAttempts: 0,
    isNewDevice: true,
    isLocationAnomaly: true,
    merchantRiskScore: 20,
  });
  console.log("Case 2 (New account + large):", case2Risk.riskScore, case2Risk.riskLevel);
  if (case2Risk.riskLevel !== "HIGH") throw new Error("Case 2 expected HIGH");

  // Case 3: Multiple failed attempts (4+) -> HIGH
  const case3Risk = calculateRiskScore({
    amount: 5000,
    averageTransactionAmount: 4000,
    accountAgeDays: 100,
    failedAttempts: 5,
    isNewDevice: true,
    isLocationAnomaly: false,
    merchantRiskScore: 15,
  });
  console.log("Case 3 (4+ Failed attempts):", case3Risk.riskScore, case3Risk.riskLevel);
  if (case3Risk.riskLevel !== "HIGH") throw new Error("Case 3 expected HIGH");

  // Test DB integration by generating a synthetic high-risk transaction
  console.log("Testing DB Transaction Analysis Integration...");
  const { transaction } = await generateSyntheticTransaction({ profile: "high-risk" });

  const res = await fetch(`http://localhost:3000/api/transactions/${transaction.id}/analyze`, {
    method: "POST",
  });
  const data = await res.json();

  console.log("Analysis API Result:", {
    success: data.success,
    riskScore: data.transaction?.riskScore,
    riskLevel: data.transaction?.riskLevel,
    factorsCount: data.transaction?.riskFactors?.length,
  });

  if (!data.success) throw new Error("API analysis failed");

  console.log("Risk Engine & Analysis API Test SUCCESS!");
}

testRiskEngine()
  .catch((err) => {
    console.error("Risk engine test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
