// Ukuran fisik tray PVC Epson: 86 x 54 mm (landscape).
export const CARD_WIDTH_MM = 86;
export const CARD_HEIGHT_MM = 54;
export const TRADER_CARD_EXPORT_DPI = 600;

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const pngTextDecoder = new TextDecoder();
const pngTextEncoder = new TextEncoder();

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const createPngChunk = (type, data) => {
  const typeBytes = pngTextEncoder.encode(type);
  // PNG: 4 length bytes + 4 type bytes + data + 4 CRC bytes.
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  const crcOffset = 8 + data.length;
  view.setUint32(crcOffset, crc32(chunk.subarray(4, crcOffset)));
  return chunk;
};

/** Adds PNG pHYs metadata so photo software reads the exported card as 600 DPI. */
export async function applyPngDensity(blob, dpi = TRADER_CARD_EXPORT_DPI) {
  const source = new Uint8Array(await blob.arrayBuffer());
  if (!PNG_SIGNATURE.every((value, index) => source[index] === value)) return blob;

  const pixelsPerMeter = Math.round(dpi / 0.0254);
  const physData = new Uint8Array(9);
  const physView = new DataView(physData.buffer);
  physView.setUint32(0, pixelsPerMeter);
  physView.setUint32(4, pixelsPerMeter);
  physData[8] = 1;
  const physChunk = createPngChunk("pHYs", physData);

  const parts = [source.slice(0, 8)];
  let offset = 8;
  let inserted = false;
  while (offset + 12 <= source.length) {
    const length = new DataView(source.buffer, source.byteOffset + offset, 4).getUint32(0);
    const end = offset + 12 + length;
    if (end > source.length) return blob;
    const type = pngTextDecoder.decode(source.slice(offset + 4, offset + 8));
    if (type === "pHYs") {
      if (!inserted) {
        parts.push(physChunk);
        inserted = true;
      }
    } else {
      parts.push(source.slice(offset, end));
      if (type === "IHDR" && !inserted) {
        parts.push(physChunk);
        inserted = true;
      }
    }
    offset = end;
  }
  return new Blob(parts, { type: "image/png" });
}
export const administrationLabel = value => {
  const normalized = String(value || "").toLowerCase().replace(/\s/g, "");
  if (["kip", "kartuidentitaspedagang(kip)"].includes(normalized)) return "KIP";
  if (["kkip", "kartukhususidentitaspedagang(kkip)"].includes(normalized)) return "KKIP";
  return "-";
};
export const administrationFullLabel = value => ({
  KIP: "Kartu Identitas Pedagang",
  KKIP: "Kartu Khusus Identitas Pedagang",
})[administrationLabel(value)] || "-";

export const landDocumentPrefix = type => administrationLabel(type) === "KKIP" ? "KKIP" : "SIL";
export const formatLandDocumentNumber = (number, type) =>
  String(number || "-").trim().replace(/\/(?:SIL|KTP|KIP|KKIP)-/i, `/${landDocumentPrefix(type)}-`);

// Card numbering is a presentation of the same record; keep stored/SIL numbers intact.
export const formatTraderCardNumber = (number, type) => {
  const value = String(number || "-").trim();
  const prefix = administrationLabel(type);
  return prefix === "-"
    ? value
    : value.replace(/\/(?:SIL|KTP|KIP|KKIP)-/i, `/${prefix}-`);
};

export const formatTraderAddress = data => [
  data.street_address,
  data.rt || data.rw ? `RT ${data.rt || "-"} / RW ${data.rw || "-"}` : "",
  data.kelurahan, data.district, data.city, data.province,
].filter(Boolean).join(", ");

async function loadPrintImage(image) {
  image.loading = "eager";
  // Some browsers reject decode() even though a cached image is drawable.
  if (image.complete && image.naturalWidth > 0) return;
  if (!image.complete) await new Promise(resolve => {
    const finish = () => {
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      resolve();
    };
    image.addEventListener("load", finish);
    image.addEventListener("error", finish);
  });
  if (image.naturalWidth > 0) {
    if (image.decode) await image.decode().catch(() => undefined);
    return;
  }
  throw new Error(`Gambar gagal dimuat: ${image.alt || "template kartu"}.`);
}
export async function waitForTraderPrintAssets(root) {
  if (!root) throw new Error("Area cetak belum siap.");
  let timer;
  try {
    await Promise.race([(async () => {
      await Promise.all(Array.from(root.querySelectorAll("img")).map(async image => {
        try {
          await loadPrintImage(image);
        } catch (error) {
          if (image.dataset.printOptional) {
            const placeholder = document.createElement("span");
            placeholder.textContent = image.dataset.printOptional;
            placeholder.style.cssText = "font: 9px Arial,sans-serif;text-align:center;color:#111;padding:4px";
            image.replaceWith(placeholder);
            return;
          }
          // Retry failed HTTP assets once without changing stored asset paths.
          const url = new URL(image.currentSrc || image.src, window.location.href);
          if (url.origin !== window.location.origin) throw error;
          url.searchParams.set("print_retry", String(Date.now()));
          image.srcset = "";
          image.src = url.href;
          await loadPrintImage(image);
        }
      }));
      await document.fonts?.ready;
    })(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("Pemuatan aset cetak belum selesai. Periksa koneksi lalu coba kembali.")), 30000);
    })]);
  } catch (error) {
    throw new Error(error.message || "Gambar atau font cetak gagal dimuat. Coba kembali.");
  } finally {
    clearTimeout(timer);
  }
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const overflows = element => element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1;
  // Bound the adjustment to preserve legibility; never truncate identity data.
  for (const element of root.querySelectorAll("[data-card-fit]")) {
    element.style.fontSize = "5.6pt";
    for (let size = 55; size >= 48 && overflows(element); size--) {
      element.style.fontSize = `${size / 10}pt`;
    }
  }
  const overflow = Array.from(root.querySelectorAll("[data-card-content]")).filter(overflows);
  if (overflow.length) throw new Error(`Data tidak muat pada kartu: ${[...new Set(overflow.map(el => `${el.dataset.cardContent}${el.dataset.cardArea ? ` (${el.dataset.cardArea})` : ""}`))].join(", ")}. Periksa panjang data sebelum mencetak.`);
  for (const qr of root.querySelectorAll("[data-card-qr]")) {
    if (!qr.querySelector("svg")) throw new Error("QR belum siap. Coba cetak kembali.");
  }
}
