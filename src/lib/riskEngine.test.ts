import { describe, it, expect } from "vitest";
import { calculateRiskScore } from "./riskEngine";
import { TEST_CASES } from "./testCases";

describe("Risk Engine Suite — 10 Required Scenarios", () => {
  TEST_CASES.forEach((tc) => {
    it(`Case ${tc.id}: ${tc.name} should yield ${tc.expectedLevel}`, () => {
      const result = calculateRiskScore(tc.input);
      expect(result.riskLevel).toBe(tc.expectedLevel);
    });
  });
});
