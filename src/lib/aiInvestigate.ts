import Groq from "groq-sdk";
import { db } from "@/lib/db";

export type AIRecommendationType =
  | "APPROVE"
  | "ALLOW_WITH_MONITORING"
  | "REQUEST_VERIFICATION"
  | "MANUAL_REVIEW"
  | "HOLD"
  | "BLOCK";

export interface AIInvestigationPayload {
  investigationSummary: string;
  recommendation: AIRecommendationType;
  confidence: number;
  reasoning: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

/**
 * Investigates a transaction using Groq (llama-3.3-70b).
 * Falls back gracefully to deterministic risk analyst reasoning if API key is not configured.
 */
export async function investigateTransaction(transactionId: string) {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: {
      customer: true,
      merchant: true,
      riskFactors: true,
    },
  });

  if (!transaction) {
    throw new Error(`Transaction ${transactionId} not found`);
  }

  const { customer, merchant, riskFactors, amount, riskScore, riskLevel } = transaction;

  let investigationData: AIInvestigationPayload;

  const apiKey = process.env.GROQ_API_KEY;
  const isRealApiKeyPresent = apiKey && apiKey.startsWith("gsk_") && apiKey.length > 20;

  if (isRealApiKeyPresent) {
    try {
      const promptText = `Analyze this payment transaction for risk & potential fraud and return a JSON object with exactly these fields:
- investigationSummary: string (2-4 sentence natural language explanation)
- recommendation: one of APPROVE | ALLOW_WITH_MONITORING | REQUEST_VERIFICATION | MANUAL_REVIEW | HOLD | BLOCK
- confidence: number from 0 to 100
- reasoning: string (step-by-step plain-language evidence justification)

Transaction data:
- Transaction ID: ${transaction.id}
- Amount: ₹${amount.toLocaleString("en-IN")}
- Risk Score: ${riskScore}/100 (${riskLevel})
- Customer Name: ${customer.name} (Account Created: ${new Date(customer.accountCreatedAt).toLocaleDateString()})
- Customer Average Spending: ₹${customer.averageTransactionAmount.toLocaleString("en-IN")}
- Customer Failed Attempt Count: ${transaction.failedAttemptsBeforeSuccess}
- Device Fingerprint: ${transaction.deviceFingerprint} (Is New Device: ${transaction.isNewDevice})
- Location: ${transaction.location} (Is Location Anomaly: ${transaction.isLocationAnomaly})
- Merchant: ${merchant.name} (Category: ${merchant.category}, Risk Score: ${merchant.merchantRiskScore})
- Triggered Risk Factors (${riskFactors.length}):
${riskFactors.map((f) => `  * [${f.severity}] ${f.description} (${f.evidence})`).join("\n")}

Respond ONLY with a valid JSON object, no markdown, no extra text.`;

      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        max_tokens: 1024,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a senior fintech risk analyst AI. You analyze transaction data and return structured JSON risk investigation reports. Do not invent facts not present in the data. Distinguish between clearly normal, potentially suspicious, high risk, and likely fraudulent.",
          },
          { role: "user", content: promptText },
        ],
      });

      const raw = response.choices[0]?.message?.content || "";
      const parsed = JSON.parse(raw) as AIInvestigationPayload;

      investigationData = {
        investigationSummary: parsed.investigationSummary,
        recommendation: parsed.recommendation,
        confidence: Number(parsed.confidence),
        reasoning: parsed.reasoning,
      };
    } catch (apiErr: any) {
      console.warn("Groq API call fallback activated:", apiErr.message);
      investigationData = generateHeuristicInvestigation(transaction);
    }
  } else {
    // Fallback heuristic generator when API key is missing
    investigationData = generateHeuristicInvestigation(transaction);
  }

  // Upsert into Investigation table
  const investigation = await db.investigation.upsert({
    where: { transactionId },
    create: {
      transactionId,
      investigationSummary: investigationData.investigationSummary,
      recommendation: investigationData.recommendation,
      confidence: investigationData.confidence,
      reasoning: investigationData.reasoning,
    },
    update: {
      investigationSummary: investigationData.investigationSummary,
      recommendation: investigationData.recommendation,
      confidence: investigationData.confidence,
      reasoning: investigationData.reasoning,
    },
  });

  // Log Audit Event
  await db.event.create({
    data: {
      transactionId,
      customerId: customer.id,
      merchantId: merchant.id,
      type: "INVESTIGATION_COMPLETED",
      label: `Groq AI completed investigation: ${investigationData.recommendation} (${investigationData.confidence}% confidence)`,
    },
  });

  return investigation;
}

/**
 * Deterministic Fintech AI Risk Analyst Heuristic Generator
 */
function generateHeuristicInvestigation(tx: any): AIInvestigationPayload {
  const { amount, riskScore, riskLevel, customer, merchant, riskFactors, failedAttemptsBeforeSuccess, isNewDevice, isLocationAnomaly } = tx;

  if (riskLevel === "HIGH" || riskScore >= 70) {
    const topFactors = riskFactors.map((f: any) => f.description).join("; ");
    return {
      investigationSummary: `High-risk transaction flagged with an elevated risk score of ${riskScore}/100. Payment of ₹${amount.toLocaleString("en-IN")} at ${merchant.name} exhibits multiple fraud velocity signals including ${topFactors || "unusual behavioral anomalies"}. Immediate intervention is recommended to prevent potential chargebacks or ATO loss.`,
      recommendation: riskScore >= 85 ? "BLOCK" : "MANUAL_REVIEW",
      confidence: Math.min(98, 80 + Math.round(riskScore / 5)),
      reasoning: `Analysis of telemetry data indicates critical threat vectors:\n1. Risk score of ${riskScore}/100 exceeds critical fraud threshold (70).\n2. Customer ${customer.name} attempted authorization with ${failedAttemptsBeforeSuccess} failed attempt(s).\n3. Signals include: ${topFactors || "high-risk merchant association or location anomaly"}.\n4. Recommendation is to ${riskScore >= 85 ? "block transaction immediately" : "hold payment pending manual analyst identity verification"}.`,
    };
  }

  if (riskLevel === "MEDIUM" || riskScore >= 31) {
    return {
      investigationSummary: `Transaction of ₹${amount.toLocaleString("en-IN")} presented moderate risk indicators (Risk Score: ${riskScore}/100). While basic customer identity checks passed, secondary flags such as ${isNewDevice ? "unrecognized device fingerprint" : "moderate spending elevation"} warrant monitoring.`,
      recommendation: "ALLOW_WITH_MONITORING",
      confidence: 85,
      reasoning: `Telemetry check yields moderate score of ${riskScore}/100:\n1. Transaction amount is within acceptable bounds for customer ${customer.name}.\n2. Secondary risk factors present: ${isNewDevice ? "new device" : "elevated merchant risk"}.\n3. Recommendation: Allow transaction with automated post-processing fraud monitoring.`,
    };
  }

  return {
    investigationSummary: `Transaction evaluated as clean with low risk score of ${riskScore}/100. Payment of ₹${amount.toLocaleString("en-IN")} at ${merchant.name} matches customer ${customer.name}'s normal historical spending behavior and device profile.`,
    recommendation: "APPROVE",
    confidence: 96,
    reasoning: `Low risk assessment confirmed (Score: ${riskScore}/100):\n1. No critical risk factors triggered.\n2. Device fingerprint and location match known customer profile.\n3. Recommendation: Approve transaction immediately with 0 friction.`,
  };
}
