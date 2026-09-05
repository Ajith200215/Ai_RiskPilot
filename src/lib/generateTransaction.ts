import { faker } from "@faker-js/faker";
import { db } from "@/lib/db";

export type ProfileType = "normal" | "suspicious" | "high-risk" | "random";

export interface GenerateOptions {
  profile?: ProfileType;
}

export async function generateSyntheticTransaction(options: GenerateOptions = {}) {
  let profile = options.profile || "random";
  if (profile === "random") {
    const roll = Math.random();
    if (roll < 0.6) profile = "normal";
    else if (roll < 0.85) profile = "suspicious";
    else profile = "high-risk";
  }

  const now = new Date();

  // Scenario parameter rules
  let amount: number;
  let accountAgeMs: number;
  let isNewDevice: boolean;
  let failedAttempts: number;
  let isLocationAnomaly: boolean;

  const homeCity = faker.location.city();
  const homeCountry = "India";
  const customerLocation = `${homeCity}, ${homeCountry}`;
  let txLocation = customerLocation;

  if (profile === "normal") {
    // normal: amount 500–3000, account age 1-3 years, known device, 0 failed attempts, normal location
    amount = faker.number.int({ min: 500, max: 3000 });
    const ageDays = faker.number.int({ min: 365, max: 1095 });
    accountAgeMs = ageDays * 24 * 60 * 60 * 1000;
    isNewDevice = false;
    failedAttempts = 0;
    isLocationAnomaly = false;
  } else if (profile === "suspicious") {
    // suspicious: amount 15000-30000, account age 1-6 months, new device, 1-2 failed attempts, location anomaly possible
    amount = faker.number.int({ min: 15000, max: 30000 });
    const ageDays = faker.number.int({ min: 30, max: 180 });
    accountAgeMs = ageDays * 24 * 60 * 60 * 1000;
    isNewDevice = true;
    failedAttempts = faker.number.int({ min: 1, max: 2 });
    isLocationAnomaly = Math.random() > 0.5;
    if (isLocationAnomaly) {
      txLocation = `${faker.location.city()}, ${faker.location.country()}`;
    }
  } else {
    // high-risk: amount 50000-100000, account age under 1 hour, new device, 4-6 failed attempts, location anomaly true
    amount = faker.number.int({ min: 50000, max: 100000 });
    accountAgeMs = faker.number.int({ min: 5 * 60 * 1000, max: 55 * 60 * 1000 }); // 5 to 55 minutes
    isNewDevice = true;
    failedAttempts = faker.number.int({ min: 4, max: 6 });
    isLocationAnomaly = true;
    txLocation = `${faker.location.city()}, ${faker.location.country()}`;
  }

  const accountCreatedAt = new Date(now.getTime() - accountAgeMs);

  // 1. Create Customer
  const customer = await db.customer.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      accountCreatedAt,
      averageTransactionAmount:
        profile === "normal"
          ? faker.number.int({ min: 800, max: 2500 })
          : profile === "suspicious"
          ? faker.number.int({ min: 1200, max: 3500 })
          : faker.number.int({ min: 500, max: 2000 }), // high spike compared to historical avg
      location: customerLocation,
      totalTransactions: profile === "high-risk" ? 0 : faker.number.int({ min: 5, max: 40 }),
      failedAttemptsCount: failedAttempts,
    },
  });

  // 2. Create Merchant
  const categories = ["E-Commerce", "Electronics", "Travel & Airlines", "Gaming", "Digital Goods", "Crypto", "Jewelry"];
  const merchantCategory = faker.helpers.arrayElement(categories);
  const isHighRiskMerchant = profile === "high-risk" && Math.random() > 0.4;

  const merchant = await db.merchant.create({
    data: {
      name: faker.company.name() + (isHighRiskMerchant ? " Global Direct" : " Pay"),
      category: merchantCategory,
      domainAgeDays: isHighRiskMerchant
        ? faker.number.int({ min: 5, max: 30 })
        : faker.number.int({ min: 180, max: 2000 }),
      refundRate: isHighRiskMerchant ? 0.12 : faker.number.float({ min: 0.001, max: 0.03, fractionDigits: 3 }),
      chargebackRate: isHighRiskMerchant ? 0.045 : faker.number.float({ min: 0.0005, max: 0.008, fractionDigits: 4 }),
      transactionVolume: faker.number.int({ min: 50000, max: 2000000 }),
      merchantRiskScore: isHighRiskMerchant
        ? faker.number.int({ min: 75, max: 95 })
        : faker.number.int({ min: 5, max: 30 }),
      missingBusinessInfo: isHighRiskMerchant ? Math.random() > 0.5 : false,
    },
  });

  // 3. Create Transaction
  const transaction = await db.transaction.create({
    data: {
      customerId: customer.id,
      merchantId: merchant.id,
      amount,
      status: "PENDING",
      riskScore: 0,
      riskLevel: "LOW",
      deviceFingerprint: `fp_${faker.string.alphanumeric(12)}`,
      isNewDevice,
      location: txLocation,
      isLocationAnomaly,
      ipAddress: faker.internet.ip(),
      failedAttemptsBeforeSuccess: failedAttempts,
    },
  });

  // 4. Audit Event Logging (Phase 11 extension hooks)
  await db.event.createMany({
    data: [
      {
        customerId: customer.id,
        type: "ACCOUNT_CREATED",
        label: `Customer account created (${Math.round((now.getTime() - accountCreatedAt.getTime()) / (1000 * 60))} mins ago)`,
        createdAt: accountCreatedAt,
      },
      {
        transactionId: transaction.id,
        customerId: customer.id,
        merchantId: merchant.id,
        type: "TRANSACTION_INITIATED",
        label: `Payment of ₹${amount.toLocaleString("en-IN")} initiated at ${merchant.name}`,
        createdAt: now,
      },
      ...(isNewDevice
        ? [
            {
              transactionId: transaction.id,
              customerId: customer.id,
              type: "DEVICE_DETECTED",
              label: "New unrecognized device fingerprint detected",
              createdAt: now,
            },
          ]
        : []),
      ...(failedAttempts > 0
        ? [
            {
              transactionId: transaction.id,
              customerId: customer.id,
              type: "PAYMENT_FAILED",
              label: `${failedAttempts} failed authentication attempt(s) prior to authorization`,
              createdAt: now,
            },
          ]
        : []),
    ],
  });

  return { transaction, customer, merchant, profile };
}

/**
 * Bulk generate N transactions matching a realistic distribution mix:
 * 60% normal, 25% suspicious, 15% high-risk
 */
export async function generateBulkTransactions(count: number = 100) {
  const normalCount = Math.floor(count * 0.6);
  const suspiciousCount = Math.floor(count * 0.25);
  const highRiskCount = count - normalCount - suspiciousCount;

  const results = await Promise.all([
    ...Array.from({ length: normalCount }, () =>
      generateSyntheticTransaction({ profile: "normal" })
    ),
    ...Array.from({ length: suspiciousCount }, () =>
      generateSyntheticTransaction({ profile: "suspicious" })
    ),
    ...Array.from({ length: highRiskCount }, () =>
      generateSyntheticTransaction({ profile: "high-risk" })
    ),
  ]);

  return {
    totalGenerated: results.length,
    normalCount,
    suspiciousCount,
    highRiskCount,
    transactions: results.map((r) => r.transaction),
  };
}
