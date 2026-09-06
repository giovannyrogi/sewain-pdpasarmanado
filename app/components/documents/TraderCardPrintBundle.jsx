"use client";

import React, { forwardRef } from "react";
import { Box } from "@mui/material";
import SuratIzinLahan from "./SuratIzinLahan";
import { TraderCard, CalibrationCard } from "./TraderCard";
import { administrationLabel, CARD_WIDTH_MM as W, CARD_HEIGHT_MM as H, chunkCards, mirrorCardSlots } from "@/app/utils/traderCardPrinting";
export { buildCardNumber } from "./TraderCard";
const TraderCardPrintBundle = forwardRef(function TraderCardPrintBundle({
  documents = [],
  includePermit = false,
  includeCards = true,
  cardSide = "both",
  media = "a4",
  printerProfile,
  calibration = false
}, ref) {
  const sides = cardSide === "both" ? ["front", "back"] : [cardSide];
  const pages = [];
  if (includePermit) documents.filter(item => administrationLabel(item.administration_type) === "KIP").forEach(item => pages.push({
    permit: item
  }));
  if (includeCards) sides.forEach(side => {
    const chunks = calibration ? [[null, null]] : chunkCards(documents, media === "pvc" ? 2 : 8);
    chunks.forEach(items => pages.push({
      side,
      items
    }));
  });
  return <Box ref={ref} sx={{
    color: "#111",
    bgcolor: "#fff",
    "&, & *": {
      printColorAdjust: "exact",
      WebkitPrintColorAdjust: "exact"
    }
  }}>
    {pages.map((page, index) => {
      const pageBreak = {
        breakAfter: index < pages.length - 1 ? "page" : "auto",
        pageBreakAfter: index < pages.length - 1 ? "always" : "auto"
      };
      if (page.permit) return <Box key={`permit-${index}`} sx={pageBreak}><SuratIzinLahan data={page.permit} /></Box>;
      const pvc = media === "pvc";
      const items = !pvc && page.side === "back" ? mirrorCardSlots(page.items) : page.items;
      return <Box key={`${page.side}-${index}`} className="trader-card-sheet" sx={{
        ...pageBreak,
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
        width: `${pvc ? printerProfile.pageWidth : 210}mm`,
        height: `${pvc ? printerProfile.pageHeight : 297}mm`,
        ...(!pvc && {
          display: "grid",
          gridTemplateColumns: `repeat(2, ${W}mm)`,
          gridAutoRows: `${H}mm`,
          gap: "5mm",
          justifyContent: "center",
          alignContent: "start",
          pt: "12mm"
        })
      }}>
        {items.map((item, slot) => <Box key={`${slot}-${item?.document_id || "empty"}`} sx={{
          width: `${W}mm`,
          height: `${H}mm`,
          ...(pvc && {
            position: "absolute",
            left: `${Number(printerProfile.slots[slot].x) + Number(printerProfile[`${page.side}X`])}mm`,
            top: `${Number(printerProfile.slots[slot].y) + Number(printerProfile[`${page.side}Y`])}mm`,
            transform: page.side === "back" ? `rotate(${printerProfile.backRotation}deg)` : "none"
          })
        }}>
          {calibration ? <CalibrationCard slot={slot} side={page.side} /> : item ? <TraderCard data={item} side={page.side} /> : null}
        </Box>)}
      </Box>;
    })}
  </Box>;
});
export default TraderCardPrintBundle;
