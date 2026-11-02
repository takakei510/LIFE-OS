import assert from "node:assert/strict";
import test from "node:test";
import { toJstLocalDateTime, serializeJstDateTime } from "./date-time.ts";
import { validateCreateAdventureLogInput } from "./validation.ts";

test("Japanese input survives UTC servers and local servers without a nine-hour shift", () => {
  const previous = process.env.TZ;
  try {
    for (const timezone of ["UTC", "Asia/Tokyo"]) {
      process.env.TZ = timezone;
      assert.equal(serializeJstDateTime("2026-11-02T19:58"), "2026-11-02T10:58:00.000Z");
      assert.equal(toJstLocalDateTime("2026-11-02T10:58:00.000Z"), "2026-11-02T19:58");
      assert.equal(serializeJstDateTime("2026-11-02T00:05"), "2026-11-01T15:05:00.000Z");
    }
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
test("server rejects ambiguous local timestamps and preserves explicit instants", () => {
  assert.equal(validateCreateAdventureLogInput({requestId:"test",loggedAt:"2026-11-02T19:58"}).ok,false);
  const result = validateCreateAdventureLogInput({requestId:"test",loggedAt:"2026-11-02T10:58:00.000Z"});
  assert.equal(result.ok,true);
  assert.equal(result.value.loggedAt,"2026-11-02T10:58:00.000Z");
});
