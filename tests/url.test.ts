import test from "node:test";
import assert from "node:assert/strict";
import { isValidHttpUrl } from "../src/lib/validators/url";

test("accepts valid http and https URLs", () => {
  assert.equal(isValidHttpUrl("http://example.com"), true);
  assert.equal(isValidHttpUrl("https://example.com/path?q=1"), true);
});

test("rejects non-http protocols", () => {
  assert.equal(isValidHttpUrl("ftp://example.com"), false);
  assert.equal(isValidHttpUrl("mailto:test@example.com"), false);
});

test("rejects malformed URLs", () => {
  assert.equal(isValidHttpUrl("not-a-url"), false);
  assert.equal(isValidHttpUrl(""), false);
});
