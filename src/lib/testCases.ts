import { RiskInput } from "./riskEngine";

export interface TestCaseDefinition {
  id: number;
  name: string;
  description: string;
  input: RiskInput;
  expectedLevel: "LOW" | "MEDIUM" | "HIGH";
}

export const TEST_CASES: TestCaseDefinition[] = [
  {
    id: 1,
    name: "Normal Transaction",
    description: "Standard transaction for returning customer with average spending, known device, 0 failed attempts",
    input: {
      amount: 1500,
      averageTransactionAmount: 2000,
      accountAgeDays: 400,
      failedAttempts: 0,
      isNewDevice: false,
      isLocationAnomaly: false,
      merchantRiskScore: 10,
    },
    expectedLevel: "LOW",
  },
  {
    id: 2,
    name: "New Account + Large Payment",
    description: "Brand new customer account (< 1 hour) making high amount payment",
    input: {
      amount: 80000,
      averageTransactionAmount: 0,
      accountAgeDays: 0.01,
      failedAttempts: 0,
      isNewDevice: true,
      isLocationAnomaly: false,
      merchantRiskScore: 20,
    },
    expectedLevel: "HIGH",
  },
  {
    id: 3,
    name: "New Device + Location Anomaly",
    description: "Unrecognized device combined with geographic velocity anomaly",
    input: {
      amount: 2000,
      averageTransactionAmount: 2000,
      accountAgeDays: 200,
      failedAttempts: 0,
      isNewDevice: true,
      isLocationAnomaly: true,
      merchantRiskScore: 10,
    },
    expectedLevel: "MEDIUM",
  },
  {
    id: 4,
    name: "Multiple Failed Attempts (4+)",
    description: "Customer experienced 5 failed OTP / authorization attempts prior to success",
    input: {
      amount: 3000,
      averageTransactionAmount: 3000,
      accountAgeDays: 150,
      failedAttempts: 5,
      isNewDevice: false,
      isLocationAnomaly: false,
      merchantRiskScore: 15,
    },
    expectedLevel: "HIGH",
  },
  {
    id: 5,
    name: "Normal Returning Customer, Moderate Amount",
    description: "Established customer account making standard repeat purchase",
    input: {
      amount: 2500,
      averageTransactionAmount: 3000,
      accountAgeDays: 500,
      failedAttempts: 0,
      isNewDevice: false,
      isLocationAnomaly: false,
      merchantRiskScore: 5,
    },
    expectedLevel: "LOW",
  },
  {
    id: 6,
    name: "High-Risk Merchant (Score 80+)",
    description: "Payment processed at high risk flagged merchant store",
    input: {
      amount: 2000,
      averageTransactionAmount: 2000,
      accountAgeDays: 200,
      failedAttempts: 0,
      isNewDevice: false,
      isLocationAnomaly: false,
      merchantRiskScore: 85,
    },
    expectedLevel: "HIGH",
  },
  {
    id: 7,
    name: "Sudden Spending Spike (10x Average)",
    description: "Transaction amount is 12.5x customer's historical average spending",
    input: {
      amount: 25000,
      averageTransactionAmount: 2000,
      accountAgeDays: 300,
      failedAttempts: 0,
      isNewDevice: false,
      isLocationAnomaly: false,
      merchantRiskScore: 10,
    },
    expectedLevel: "HIGH",
  },
  {
    id: 8,
    name: "High Refund Merchant",
    description: "Merchant has 15% refund rate, elevating effective risk score",
    input: {
      amount: 2000,
      averageTransactionAmount: 2000,
      accountAgeDays: 100,
      failedAttempts: 0,
      isNewDevice: false,
      isLocationAnomaly: false,
      merchantRiskScore: 20,
      merchantRefundRate: 0.15,
    },
    expectedLevel: "HIGH",
  },
  {
    id: 9,
    name: "High Chargeback Merchant",
    description: "Merchant has 5% chargeback rate, triggering critical merchant flag",
    input: {
      amount: 2000,
      averageTransactionAmount: 2000,
      accountAgeDays: 100,
      failedAttempts: 0,
      isNewDevice: false,
      isLocationAnomaly: false,
      merchantRiskScore: 20,
      merchantChargebackRate: 0.05,
    },
    expectedLevel: "HIGH",
  },
  {
    id: 10,
    name: "Multiple Signals Combined",
    description: "New device + recent account + 5x spending spike combined signals",
    input: {
      amount: 15000,
      averageTransactionAmount: 2000,
      accountAgeDays: 0.02,
      failedAttempts: 0,
      isNewDevice: true,
      isLocationAnomaly: false,
      merchantRiskScore: 10,
    },
    expectedLevel: "HIGH",
  },
];
