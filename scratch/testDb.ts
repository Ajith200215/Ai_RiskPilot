import { db } from "../src/lib/db";

async function main() {
  console.log("Testing database connection...");
  const customer = await db.customer.create({
    data: {
      email: "test.customer@example.com",
      name: "Test Customer",
      location: "Mumbai, India",
      averageTransactionAmount: 2500,
    },
  });
  console.log("Created Customer:", customer.id, customer.name);

  const merchant = await db.merchant.create({
    data: {
      name: "Razorpay Electronics Test Store",
      category: "E-Commerce",
      merchantRiskScore: 12,
    },
  });
  console.log("Created Merchant:", merchant.id, merchant.name);

  const transaction = await db.transaction.create({
    data: {
      customerId: customer.id,
      merchantId: merchant.id,
      amount: 1500,
      status: "APPROVED",
      riskScore: 15,
      riskLevel: "LOW",
      deviceFingerprint: "fp_test_12345",
      location: "Mumbai, India",
      ipAddress: "103.22.45.1",
    },
  });
  console.log("Created Transaction:", transaction.id, transaction.amount);

  const count = await db.transaction.count();
  console.log("Total Transactions in DB:", count);

  // Cleanup test rows
  await db.transaction.delete({ where: { id: transaction.id } });
  await db.customer.delete({ where: { id: customer.id } });
  await db.merchant.delete({ where: { id: merchant.id } });
  console.log("Cleanup complete. DB verification SUCCESS!");
}

main()
  .catch((e) => {
    console.error("DB verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
