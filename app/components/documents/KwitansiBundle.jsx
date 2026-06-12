"use client";

import React, { forwardRef } from "react";
import ReceiptLayout from "./ReceiptLayout";

/**
 * KwitansiBundle mencetak dua dokumen dalam satu aksi:
 * 1. Kwitansi penerimaan pembayaran.
 * 2. Kwitansi pembayaran PPH.
 */
const KwitansiBundle = forwardRef(({ data }, ref) => {
  if (!data) return null;

  return (
    <div ref={ref}>
      <div
        style={{
          position: "relative",
          width: "216mm",
          height: "279mm",
          breakAfter: "page",
          pageBreakAfter: "always",
        }}
      >
        <ReceiptLayout
          data={data}
          receipt={data?.receipts?.contract}
          variant="white"
          type="contract"
          breakAfter={false}
        />
      </div>
      <div
        style={{
          position: "relative",
          width: "216mm",
          height: "279mm",
        }}
      >
        <ReceiptLayout
          data={data}
          receipt={data?.receipts?.pph}
          variant="yellow"
          type="pph"
          breakAfter={false}
        />
      </div>
    </div>
  );
});

KwitansiBundle.displayName = "KwitansiBundle";

export default KwitansiBundle;
