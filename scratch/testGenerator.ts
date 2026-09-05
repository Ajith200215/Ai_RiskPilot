import {
  generateSyntheticTransaction,
  generateBulkTransactions,
} from "../src/lib/generateTransaction";
import { db } from "../src/lib/db";

async function testGenerator() {
  console.log("Testing Synthetic Data Generator...");

  // Test normal profile
  const normalRes = await generateSyntheticTransaction({ profile: "normal" });
  console.log(
    "Normal Tx Generated:",
    normalRes.transaction.id,
    "Amount:",
    normalRes.transaction.amount,
    "Failed Attempts:",
    normalRes.transaction.failedAttemptsBeforeSuccess,
    "New Device:",
    normalRes.transaction.isNewDevice
  );

  // Test suspicious profile
  const suspiciousRes = await generateSyntheticTransaction({
    profile: "suspicious",
  });
  console.log(
    "Suspicious Tx Generated:",
    suspiciousRes.transaction.id,
    "Amount:",
    suspiciousRes.transaction.amount,
    "Failed Attempts:",
    suspiciousRes.transaction.failedAttemptsBeforeSuccess,
    "New Device:",
    suspiciousRes.transaction.isNewDevice
  );

  // Test high-risk profile
  const highRiskRes = await generateSyntheticTransaction({
    profile: "high-risk",
  });
  console.log(
    "High Risk Tx Generated:",
    highRiskRes.transaction.id,
    "Amount:",
    highRiskRes.transaction.amount,
    "Failed Attempts:",
    highRiskRes.transaction.failedAttemptsBeforeSuccess,
    "New Device:",
    highRiskRes.transaction.isNewDevice
  );

  // Test bulk generator (generate 10)
  const bulkRes = await generateBulkTransactions(10);
  console.log("Bulk Generator Output:", {
    total: bulkRes.totalGenerated,
    normal: bulkRes.normalCount,
    suspicious: bulkRes.suspiciousCount,
    highRisk: bulkRes.highRiskCount,
  });

  const dbTxCount = await db.transaction.count();
  console.log("Total Transactions in Database:", dbTxCount);

  console.log("Synthetic Data Generator Test SUCCESS!");
}

testGenerator()
  .catch((err) => {
    console.error("Generator test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
