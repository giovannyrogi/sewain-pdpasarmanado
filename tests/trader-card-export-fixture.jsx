import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { toBlob } from "html-to-image";
import JSZip from "jszip";
import Assets from "../app/components/documents/TraderCardDownloadAssets";
import { TraderCard } from "../app/components/documents/TraderCard";
import { applyPngDensity, waitForTraderPrintAssets } from "../app/utils/traderCardPrinting";
import { CARD_EXPORT_OPTIONS, createCardExportCache, cardExportKey } from "../app/utils/traderCardExport";

const mount = document.getElementById("root");
const root = createRoot(mount);
const cache = createCardExportCache();
window.exportCardTest = async (count, mode, legacy = false) => {
  const start = performance.now();
  const sides = mode === "both" ? ["front", "back"] : [mode];
  const zip = new JSZip();
  let rendered = 0;
  const dimensions = [];
  for (let i = 0; i < count; i++) for (const side of sides) {
    const data = { document_id: i + 1, tenant_name: `PEDAGANG ${i + 1}`, administration_type: i % 2 ? "kkip" : "kip", document_number: `${i + 1}/PM/SIL-UPJB/IX/2026`, birth_place: "MANADO", birth_date: "1990-01-01", location_name: "BERSEHATI", sector_name: "BONGKAR MUAT", stall_number: "BM 18", qr_token: "a".repeat(43), start_date: "2026-09-01", end_date: "2027-08-31" };
    const key = cardExportKey(data, side, location.origin);
    let blob = legacy ? null : cache.get(key);
    if (!blob) {
      flushSync(() => root.render(legacy ? <div style={{width:"86mm",height:"54mm"}}><TraderCard data={data} side={side} /></div> : <Assets documents={[data]} side={side} />));
      await waitForTraderPrintAssets(mount);
      const node = legacy ? mount.firstElementChild : mount.querySelector('[data-card-download-id]');
      if (!node) throw Error('Missing export node: ' + mount.innerHTML.slice(0, 500));
      blob = await applyPngDensity(await toBlob(node, legacy ? {backgroundColor:"#ffffff",cacheBust:true,pixelRatio:600/96} : CARD_EXPORT_OPTIONS), legacy ? 600 : 300);
      if (!legacy) cache.set(key, blob);
      rendered++;
    }
    const bitmap = await createImageBitmap(blob);
    dimensions.push([bitmap.width, bitmap.height]); bitmap.close();
    zip.file(`${side}/${i}.png`, blob);
    window.lastCardBlob = blob;
  }
  const archive = await zip.generateAsync({type:"blob",compression:"STORE"});
  return {ms: Math.round(performance.now()-start),rendered,dimensions,zipBytes:archive.size};
};
window.testCardCache = () => {
  const small = createCardExportCache(8);
  small.set('a', new Blob(['aaaa'])); small.set('b',new Blob(['bbbb']));
  small.get('a'); small.set('c',new Blob(['cccc']));
  if (small.get('b') || !small.get('a')) throw Error('LRU eviction');
  small.clear(); if(small.get('a')) throw Error('clear');
  const a = cardExportKey({tenant_name:'A',qr_token:'x'},'front','https://a');
  if (a === cardExportKey({tenant_name:'B',qr_token:'x'},'front','https://a')) throw Error('stale identity');
  if (a === cardExportKey({tenant_name:'A',qr_token:'x'},'front','https://b')) throw Error('stale QR');
};
