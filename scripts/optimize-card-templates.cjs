const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('sharp');

async function main() {
  const root = path.resolve(__dirname, '../public');
  await fs.mkdir(path.join(root, 'card-export'), { recursive: true });
  for (const [side, source] of [['front', 'depan-v2'], ['back', 'belakang']]) {
    const input = await fs.readFile(path.join(root, `template-id-card-pedagang-${source}.png`));
    const compressed = await sharp(input).keepMetadata().png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toBuffer();
    assert.deepEqual(await sharp(compressed).raw().toBuffer(), await sharp(input).raw().toBuffer());
    const output = compressed.length < input.length ? compressed : input;
    await fs.writeFile(path.join(root, 'card-export', `${side}-v1.png`), output);
    console.log(`${side}: ${input.length} -> ${output.length} bytes; decoded pixels identical`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
