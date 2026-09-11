import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = await readFile(new URL("../app/utils/traderCardPrinting.js", import.meta.url), "utf8");
const { landDocumentPrefix, formatLandDocumentNumber, formatTraderCardNumber } =
  await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

test("creation prefix is KKIP for KKIP, SIL for the KIP land permit", () => {
  for (const type of ["kkip", "KKIP", "Kartu Khusus Identitas Pedagang (KKIP)"]) {
    assert.equal(landDocumentPrefix(type), "KKIP");
  }
  for (const type of ["kip", "KIP", "Kartu Identitas Pedagang(KIP)"]) {
    assert.equal(landDocumentPrefix(type), "SIL");
  }
});

test("legacy prefixes normalize without changing sequence, location, or dates", () => {
  for (const prefix of ["KTP", "SIL", "KIP", "KKIP"]) {
    const number = `002/PM/${prefix}-UPJB/VII/2026`;
    assert.equal(formatLandDocumentNumber(number, "kkip"), "002/PM/KKIP-UPJB/VII/2026");
    assert.equal(formatLandDocumentNumber(number, "kip"), "002/PM/SIL-UPJB/VII/2026");
    assert.equal(formatTraderCardNumber(number, "kkip"), "002/PM/KKIP-UPJB/VII/2026");
    assert.equal(formatTraderCardNumber(number, "kip"), "002/PM/KIP-UPJB/VII/2026");
  }
});

test("formatted numbers remain stable when read again", () => {
  for (const type of ["kip", "kkip"]) {
    const number = `1/PM/${landDocumentPrefix(type)}-UPJB/IX/2026`;
    assert.equal(formatLandDocumentNumber(number, type), number);
  }
});
