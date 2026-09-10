import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { crc32 } from "node:zlib";
import sharp from "sharp";
import JSZip from "jszip";

// Load the browser helper without changing the application's module configuration.
const source = await readFile(new URL("../app/utils/traderCardPrinting.js", import.meta.url), "utf8");
const { applyPngDensity } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

function validateChunks(png) {
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const chunks = [];
  let offset = 8;
  while (offset < png.length) {
    assert.ok(offset + 12 <= png.length, "Complete PNG chunk header and CRC");
    const length = png.readUInt32BE(offset);
    const crcOffset = offset + 8 + length;
    assert.ok(crcOffset + 4 <= png.length, "Chunk stays within PNG bounds");
    const type = png.toString("ascii", offset + 4, offset + 8);
    assert.equal(png.readUInt32BE(crcOffset), crc32(png.subarray(offset + 4, crcOffset)), `${type} CRC must be valid`);
    chunks.push({ type, data: png.subarray(offset + 8, crcOffset) });
    offset = crcOffset + 4;
  }
  assert.equal(chunks[0].type, "IHDR");
  assert.equal(chunks.at(-1).type, "IEND");
  const density = chunks.filter(({ type }) => type === "pHYs");
  assert.equal(density.length, 1, "Exactly one density chunk");
  assert.equal(density[0].data.length, 9);
  assert.equal(density[0].data.readUInt32BE(0), 23622);
  assert.equal(density[0].data.readUInt32BE(4), 23622);
  assert.equal(density[0].data[8], 1);
  assert.ok(chunks.findIndex(({ type }) => type === "pHYs") < chunks.findIndex(({ type }) => type === "IDAT"));
}

for (const side of ["depan", "belakang"]) {
  test(`${side}: export and repeated DPI update preserve valid, decodable PNG pixels`, async () => {
    const template = side === "depan" ? "depan-v2" : "belakang";
    const original = await sharp(fileURLToPath(new URL(`../public/template-id-card-pedagang-${template}.png`, import.meta.url)))
      .resize(2031, 1276).png().toBuffer();
    let output = original;
    for (let pass = 0; pass < 2; pass += 1) {
      output = Buffer.from(await (await applyPngDensity(new Blob([output]))).arrayBuffer());
      validateChunks(output);
      const metadata = await sharp(output).metadata();
      assert.equal(metadata.width, 2031);
      assert.equal(metadata.height, 1276);
      assert.equal(metadata.density, 600);
      assert.deepEqual(await sharp(output).raw().toBuffer(), await sharp(original).raw().toBuffer());
    }
    const zip = new JSZip();
    zip.file(`${side}/kartu.png`, output);
    const restored = await JSZip.loadAsync(await zip.generateAsync({ type: "nodebuffer" }));
    const extracted = await restored.file(`${side}/kartu.png`).async("nodebuffer");
    assert.deepEqual(extracted, output);
    validateChunks(extracted);
  });
}
