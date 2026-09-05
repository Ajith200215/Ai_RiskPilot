import { NextResponse } from "next/server";
import { calculateRiskScore } from "@/lib/riskEngine";
import { TEST_CASES } from "@/lib/testCases";

export async function GET() {
  const startTime = performance.now();
  const results = TEST_CASES.map((tc) => {
    const singleStart = performance.now();
    const riskResult = calculateRiskScore(tc.input);
    const singleLatencyMs = Math.round((performance.now() - singleStart) * 100) / 100;
    const passed = riskResult.riskLevel === tc.expectedLevel;

    return {
      id: tc.id,
      name: tc.name,
      description: tc.description,
      input: tc.input,
      expectedLevel: tc.expectedLevel,
      actualLevel: riskResult.riskLevel,
      actualScore: riskResult.riskScore,
      factorsCount: riskResult.riskFactors.length,
      factors: riskResult.riskFactors,
      passed,
      latencyMs: singleLatencyMs,
    };
  });

  const totalTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
  const passedCount = results.filter((r) => r.passed).length;

  return NextResponse.json({
    totalTests: results.length,
    passedCount,
    failedCount: results.length - passedCount,
    successRate: Math.round((passedCount / results.length) * 100),
    totalTimeMs,
    results,
  });
}
