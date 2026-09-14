import { CARD_WIDTH_MM, CARD_HEIGHT_MM, TRADER_CARD_EXPORT_DPI } from "./traderCardPrinting";

export const CARD_EXPORT_VERSION = "300dpi-v2-ttl";
export const CARD_EXPORT_TEMPLATES = {
  front: "/card-export/front-v1.png",
  back: "/card-export/back-v1.png",
};
export const CARD_EXPORT_OPTIONS = {
  backgroundColor: "#ffffff", cacheBust: false, skipFonts: true, fontEmbedCSS: "",
  canvasWidth: Math.round(CARD_WIDTH_MM * TRADER_CARD_EXPORT_DPI / 25.4),
  canvasHeight: Math.round(CARD_HEIGHT_MM * TRADER_CARD_EXPORT_DPI / 25.4),
  pixelRatio: 1,
};
export const yieldCardExport = () => new Promise(resolve =>
  requestAnimationFrame(() => requestAnimationFrame(resolve)));

// Page-local LRU: neither identity data nor generated cards are persisted.
export function createCardExportCache(limit = 32 * 1024 * 1024) {
  const entries = new Map();
  let bytes = 0;
  return {
    get(key) {
      const blob = entries.get(key);
      if (blob) { entries.delete(key); entries.set(key, blob); }
      return blob;
    },
    set(key, blob) {
      if (entries.has(key)) { bytes -= entries.get(key).size; entries.delete(key); }
      if (blob.size > limit) return;
      while (bytes + blob.size > limit && entries.size) {
        const oldest = entries.keys().next().value;
        bytes -= entries.get(oldest).size;
        entries.delete(oldest);
      }
      entries.set(key, blob); bytes += blob.size;
    },
    clear() { entries.clear(); bytes = 0; },
  };
}

export function cardExportKey(data, side, baseUrl) {
  // Include all document fields so new fields cannot silently reuse stale cards.
  return JSON.stringify([CARD_EXPORT_VERSION, CARD_EXPORT_TEMPLATES[side],
    TRADER_CARD_EXPORT_DPI, baseUrl, side,
    Object.keys(data).sort().map(key => [key, data[key]])]);
}
