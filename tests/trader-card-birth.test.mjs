import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = await readFile(new URL("../app/utils/traderCardPrinting.js", import.meta.url), "utf8");
const { getTraderCardBirthPlace } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

test("legacy TTL removes only the matching trailing birth date", () => {
  assert.equal(getTraderCardBirthPlace("Gorontalo, 21-01-2004", "2004-01-21"), "Gorontalo");
  assert.equal(getTraderCardBirthPlace("Gorontalo, 21/1/2004", "2004-01-21T00:00:00.000Z"), "Gorontalo");
  assert.equal(getTraderCardBirthPlace("NOONGAN", "2002-08-05"), "NOONGAN");
  assert.equal(getTraderCardBirthPlace("Kota, Kabupaten", "2004-01-21"), "Kota, Kabupaten");
  assert.equal(getTraderCardBirthPlace("Gorontalo, 21-01-2004", "2024-01-21"), "Gorontalo, 21-01-2004");
  assert.equal(getTraderCardBirthPlace("Gorontalo, 21-01-2004", null), "Gorontalo, 21-01-2004");
  assert.equal(getTraderCardBirthPlace(null, null), "");
});
