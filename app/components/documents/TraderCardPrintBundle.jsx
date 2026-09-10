"use client";

import React, { forwardRef } from "react";
import { Box } from "@mui/material";
import SuratIzinLahan from "./SuratIzinLahan";
import { administrationLabel } from "@/app/utils/traderCardPrinting";
export { buildCardNumber } from "./TraderCard";
const TraderCardPrintBundle = forwardRef(function TraderCardPrintBundle({
  documents = [],
  includePermit = false,
}, ref) {
  const pages = includePermit
    ? documents
        .filter((item) => administrationLabel(item.administration_type) === "KIP")
        .map((permit) => ({ permit }))
    : [];
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
      return null;
    })}
  </Box>;
});
export default TraderCardPrintBundle;
