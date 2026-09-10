"use client";

import React, { forwardRef } from "react";
import { Box } from "@mui/material";
import { TraderCard } from "./TraderCard";
import {
  CARD_HEIGHT_MM,
  CARD_WIDTH_MM,
} from "@/app/utils/traderCardPrinting";

const sides = ["front", "back"];

/**
 * Area render tersembunyi untuk mengubah desain kartu yang sama menjadi PNG.
 * PNG tidak bergantung pada dialog/browser print atau profil printer tertentu.
 */
const TraderCardDownloadAssets = forwardRef(function TraderCardDownloadAssets(
  { documents = [] },
  ref,
) {
  return (
    <Box
      ref={ref}
      aria-hidden
      sx={{
        position: "fixed",
        left: "-10000px",
        top: 0,
        width: `${CARD_WIDTH_MM}mm`,
        height: "auto",
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {documents.flatMap((document) =>
        sides.map((side) => (
          <Box
            key={`${document.document_id}-${side}`}
            data-card-download-id={document.document_id}
            data-card-download-side={side}
            sx={{
              width: `${CARD_WIDTH_MM}mm`,
              height: `${CARD_HEIGHT_MM}mm`,
              bgcolor: "#fff",
            }}
          >
            <TraderCard data={document} side={side} />
          </Box>
        )),
      )}
    </Box>
  );
});

export default TraderCardDownloadAssets;
