import assert from "node:assert/strict";
import test from "node:test";

import { describeBackendFailure } from "./backendErrors";

test("flags a rejected session for 401/403 gateway responses", () => {
  for (const status of [401, 403]) {
    const message = describeBackendFailure("profile-upsert", status, "");
    assert.match(message, new RegExp(String(status)));
    assert.match(message, /sign out and sign in again/i);
  }
});

test("flags an undeployed function for a 404 and names the function", () => {
  const message = describeBackendFailure("profile-upsert", 404, "Function not found");
  assert.match(message, /profile-upsert/);
  assert.match(message, /not be deployed/i);
});

test("surfaces the status and a body snippet for 5xx errors", () => {
  const message = describeBackendFailure("creditors", 500, "boom");
  assert.match(message, /server error \(500\)/i);
  assert.match(message, /boom/);
});

test("truncates long bodies to keep alerts readable", () => {
  const longBody = "x".repeat(500);
  const message = describeBackendFailure("creditors", 500, longBody);
  // 200-char cap plus the surrounding template, never the full 500 chars.
  assert.ok(message.length < 300, `expected truncated message, got length ${message.length}`);
});

test("handles an unexpected non-error status without a body", () => {
  const message = describeBackendFailure("aggregate-program", 302, "");
  assert.match(message, /unexpected response \(302\)/i);
});
