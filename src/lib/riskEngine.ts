export interface RiskInput {
  amount: number;
  averageTransactionAmount: number;
  accountAgeDays: number;
  failedAttempts: number;
  isNewDevice: boolean;
  isLocationAnomaly: boolean;
  merchantRiskScore: number;
  merchantRefundRate?: number;
  merchantChargebackRate?: number;
}

export interface RiskFactorItem {
  factorKey: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  points: number;
  description: string;
  evidence: string;
}

export interface CalculatedRisk {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskFactors: RiskFactorItem[];
}

/**
 * Pure, deterministic risk engine function.
 * Evaluates payment signals against financial risk rules without side effects.
 */
export function calculateRiskScore(input: RiskInput): CalculatedRisk {
  const factors: RiskFactorItem[] = [];
  let score = 0;

  const {
    amount,
    averageTransactionAmount,
    accountAgeDays,
    failedAttempts,
    isNewDevice,
    isLocationAnomaly,
    merchantRiskScore,
    merchantRefundRate = 0,
    merchantChargebackRate = 0,
  } = input;

  // Rule 1: Account Age Analysis
  if (accountAgeDays < 1 / 24) {
    // Under 1 hour
    score += 35;
    factors.push({
      factorKey: "NEW_ACCOUNT_CRITICAL",
      severity: "HIGH",
      points: 35,
      description: "Brand new account created under 1 hour ago",
      evidence: `Account age is ${Math.max(1, Math.round(accountAgeDays * 24 * 60))} minute(s) old`,
    });
  } else if (accountAgeDays < 30) {
    // Under 30 days
    score += 15;
    factors.push({
      factorKey: "NEW_ACCOUNT_RECENT",
      severity: "MEDIUM",
      points: 15,
      description: "Recently registered customer account",
      evidence: `Account age is ${Math.round(accountAgeDays)} days old`,
    });
  }

  // Rule 2: Spending Spike vs Historical Average
  if (averageTransactionAmount > 0) {
    const ratio = amount / averageTransactionAmount;
    if (ratio >= 10) {
      score += 70;
      factors.push({
        factorKey: "SPENDING_SPIKE_EXTREME",
        severity: "HIGH",
        points: 70,
        description: "Severe spending anomaly (10x+ historical average)",
        evidence: `Tx amount ₹${amount.toLocaleString("en-IN")} is ${ratio.toFixed(1)}x customer average of ₹${averageTransactionAmount.toLocaleString("en-IN")}`,
      });
    } else if (ratio >= 5) {
      score += 35;
      factors.push({
        factorKey: "SPENDING_SPIKE_HIGH",
        severity: "HIGH",
        points: 35,
        description: "Significant spending spike (5x+ historical average)",
        evidence: `Tx amount ₹${amount.toLocaleString("en-IN")} is ${ratio.toFixed(1)}x customer average of ₹${averageTransactionAmount.toLocaleString("en-IN")}`,
      });
    } else if (ratio >= 2.5) {
      score += 15;
      factors.push({
        factorKey: "SPENDING_SPIKE_MODERATE",
        severity: "MEDIUM",
        points: 15,
        description: "Moderate spending elevation vs historical average",
        evidence: `Tx amount ₹${amount.toLocaleString("en-IN")} is ${ratio.toFixed(1)}x customer average of ₹${averageTransactionAmount.toLocaleString("en-IN")}`,
      });
    }
  } else if (amount >= 50000) {
    // First transaction large payment
    score += 40;
    factors.push({
      factorKey: "FIRST_TRANSACTION_LARGE",
      severity: "HIGH",
      points: 40,
      description: "High-value first transaction on unverified account",
      evidence: `First transaction amount is ₹${amount.toLocaleString("en-IN")}`,
    });
  }

  // Rule 3: Failed Authentication Attempts
  if (failedAttempts >= 4) {
    score += 70;
    factors.push({
      factorKey: "MULTIPLE_FAILED_ATTEMPTS",
      severity: "HIGH",
      points: 70,
      description: "Multiple failed authentication / OTP attempts prior to authorization",
      evidence: `${failedAttempts} failed attempts recorded before completion`,
    });
  } else if (failedAttempts >= 1) {
    score += 15;
    factors.push({
      factorKey: "FAILED_ATTEMPT_WARNING",
      severity: "MEDIUM",
      points: 15,
      description: "Failed authentication attempt prior to success",
      evidence: `${failedAttempts} failed attempt(s) recorded`,
    });
  }

  // Rule 4: Device Anomaly
  if (isNewDevice) {
    score += 15;
    factors.push({
      factorKey: "UNRECOGNIZED_DEVICE",
      severity: "MEDIUM",
      points: 15,
      description: "Unrecognized new device fingerprint",
      evidence: "Device fingerprint has no prior transaction history for this customer",
    });
  }

  // Rule 5: Location Anomaly
  if (isLocationAnomaly) {
    score += 20;
    factors.push({
      factorKey: "LOCATION_ANOMALY",
      severity: "HIGH",
      points: 20,
      description: "Geographic location velocity anomaly detected",
      evidence: "Transaction IP / city differs significantly from registered home location",
    });
  }

  // Rule 6: Merchant Risk Score & Signals
  const effectiveMerchantScore = Math.max(
    merchantRiskScore,
    merchantRefundRate >= 0.10 ? 85 : 0,
    merchantChargebackRate >= 0.03 ? 90 : 0
  );

  if (effectiveMerchantScore >= 80) {
    score += 70;
    factors.push({
      factorKey: "HIGH_RISK_MERCHANT",
      severity: "HIGH",
      points: 70,
      description: "Transaction routed through high-risk merchant",
      evidence: `Merchant risk score is ${effectiveMerchantScore}/100 (high refund/chargeback rate)`,
    });
  } else if (effectiveMerchantScore >= 50) {
    score += 25;
    factors.push({
      factorKey: "ELEVATED_MERCHANT_RISK",
      severity: "MEDIUM",
      points: 25,
      description: "Transaction routed through merchant with elevated risk indicators",
      evidence: `Merchant risk score is ${effectiveMerchantScore}/100`,
    });
  }

  // Clamp final score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, score));

  // Determine risk level badge
  let riskLevel: "LOW" | "MEDIUM" | "HIGH";
  if (finalScore >= 70) {
    riskLevel = "HIGH";
  } else if (finalScore >= 31) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  return {
    riskScore: finalScore,
    riskLevel,
    riskFactors: factors,
  };
}
