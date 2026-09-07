export const CARD_WIDTH_MM = 85.6;
export const CARD_HEIGHT_MM = 54;
export const PRINTER_PROFILE_KEY = "sewain.trader-card.l8050.v1";
// A logical two-card canvas based on the standard 85.6 x 54 mm PVC card.
// It allows a first print without entering calibration values; physical tray
// corrections remain optional and are saved separately in the same profile.
export const defaultPrinterProfile = () => ({
  version: 1,
  pageWidth: 181.2,
  pageHeight: CARD_HEIGHT_MM,
  slots: [{ x: 0, y: 0 }, { x: 95.6, y: 0 }],
  frontX: 0,
  frontY: 0,
  backX: 0,
  backY: 0,
  backRotation: 0,
  confirmedFront: false,
  confirmedBack: false
});
export const emptyPrinterProfile = () => ({
  version: 1,
  pageWidth: "",
  pageHeight: "",
  slots: [{
    x: "",
    y: ""
  }, {
    x: "",
    y: ""
  }],
  frontX: 0,
  frontY: 0,
  backX: 0,
  backY: 0,
  backRotation: 0,
  confirmedFront: false,
  confirmedBack: false
});
export const chunkCards = (items, size) => Array.from({
  length: Math.ceil(items.length / size)
}, (_, i) => items.slice(i * size, (i + 1) * size));
export function mirrorCardSlots(items) {
  return items.flatMap((item, index) => index % 2 === 0 ? [items[index + 1] || null, item] : []);
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

export const landDocumentPrefix = type => administrationLabel(type) === "KKIP" ? "KTP" : "SIL";
export const formatLandDocumentNumber = (number, type) =>
  String(number || "-").trim().replace(/\/(?:SIL|KTP)-/i, `/${landDocumentPrefix(type)}-`);

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
export function validatePrinterProfile(profile, requireConfirmation = false) {
  if (!profile || profile.version !== 1 || !Array.isArray(profile.slots) || profile.slots.length !== 2) return "Profil printer belum tersedia.";
  const keys = ["pageWidth", "pageHeight", "frontX", "frontY", "backX", "backY"];
  if (keys.some(key => profile[key] === "" || !Number.isFinite(Number(profile[key]))) || ![0, 180].includes(Number(profile.backRotation))) return "Lengkapi ukuran halaman dan offset printer.";
  const width = Number(profile.pageWidth),
    height = Number(profile.pageHeight);
  if (width <= 0 || height <= 0 || width > 1000 || height > 1000) return "Ukuran halaman driver tidak valid.";
  for (const side of ["front", "back"]) {
    const rectangles = [];
    for (const slot of profile.slots) {
      if ([slot.x, slot.y].some(value => value === "" || !Number.isFinite(Number(value)))) return "Lengkapi koordinat kedua slot sesuai tray.";
      const x = Number(slot.x) + Number(profile[`${side}X`]);
      const y = Number(slot.y) + Number(profile[`${side}Y`]);
      if (x < 0 || y < 0 || x + CARD_WIDTH_MM > width || y + CARD_HEIGHT_MM > height) return "Posisi kartu melewati ukuran halaman driver.";
      rectangles.push({
        x,
        y
      });
    }
    const [a, b] = rectangles;
    if (Math.abs(a.x - b.x) < CARD_WIDTH_MM && Math.abs(a.y - b.y) < CARD_HEIGHT_MM) return "Posisi kedua slot saling bertumpuk.";
  }
  if (requireConfirmation && !(profile.confirmedFront === true && profile.confirmedBack === true)) return "Konfirmasi hasil kalibrasi depan dan belakang terlebih dahulu.";
  return "";
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
