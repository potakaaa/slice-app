import assert from "node:assert/strict";
import test from "node:test";

import {
  AiScriptResponse,
  AiStrategyResponse,
  CoachingBookingResponse,
} from "@workspace/api-zod";

import { IntegrationError, toIntegrationError } from "./integrationErrors";
import {
  highestEntitlementTier,
  tierForPackageIdentifier,
} from "./revenueCatUtils";

test("maps current offering package identifiers to paid tiers", () => {
  assert.equal(tierForPackageIdentifier("silver_monthly"), "silver");
  assert.equal(tierForPackageIdentifier("gold_monthly"), "gold");
  assert.equal(tierForPackageIdentifier("platinum_monthly"), "platinum");
  assert.equal(tierForPackageIdentifier("$rc_monthly"), null);
});

test("uses tier precedence instead of lexical entitlement ordering", () => {
  assert.equal(
    highestEntitlementTier(["slice_gold", "slice_silver", "slice_platinum"]),
    "platinum",
  );
  assert.equal(highestEntitlementTier(["unrelated"]), "free");
});

test("normalizes a cancelled RevenueCat purchase without exposing a raw error", () => {
  const error = toIntegrationError(
    { code: "PURCHASE_CANCELLED", message: "cancelled", userCancelled: true },
    "purchase_failed",
    "Purchase failed",
  );

  assert.ok(error instanceof IntegrationError);
  assert.equal(error.cancelled, true);
  assert.equal(error.code, "purchase_cancelled");
});

test("validates stable AI response contracts", () => {
  assert.equal(
    AiStrategyResponse.safeParse({
      strategy: {
        suggested_first_offer_percentage: 0.35,
        reasoning: "Leaves negotiation room.",
        strategy_steps: ["Prepare documents."],
        risks: ["The creditor may decline."],
        disclaimer: "Educational only.",
      },
      model: "gemini",
    }).success,
    true,
  );

  assert.equal(
    AiScriptResponse.safeParse({
      script: {
        tone: "calm",
        sections: { first_call: "Hello." },
        reminders: ["Get the agreement in writing."],
        disclaimer: "Educational only.",
      },
      saved_script_id: "f53ed0f5-70dd-4b6c-bf0a-46ac7d69c035",
      model: "gemini",
    }).success,
    true,
  );
});

test("accepts available and unavailable coaching scheduling responses", () => {
  const booking = {
    id: "f53ed0f5-70dd-4b6c-bf0a-46ac7d69c035",
    topic: "Debt settlement strategy",
    notes: null,
    starts_at: null,
    status: "pending",
    created_at: "2026-06-07T00:00:00.000Z",
  };

  assert.equal(
    CoachingBookingResponse.safeParse({
      booking,
      scheduling_url: "https://calendly.com/slice/coaching",
      scheduling_available: true,
    }).success,
    true,
  );
  assert.equal(
    CoachingBookingResponse.safeParse({
      booking,
      scheduling_url: null,
      scheduling_available: false,
    }).success,
    true,
  );
});
