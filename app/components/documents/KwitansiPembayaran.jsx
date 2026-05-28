"use client";

import React, { forwardRef } from "react";
import ReceiptLayout from "./ReceiptLayout";

const KwitansiPembayaran = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const receipt = data?.receipts?.contract;
  const copies = ["white", "white", "white"];

  return (
    <div ref={ref}>
      {copies.map((variant, index) => (
        <ReceiptLayout
          key={`${variant}-${index}`}
          data={data}
          receipt={receipt}
          variant={variant}
          type="contract"
          breakAfter={index < copies.length - 1}
        />
      ))}
    </div>
  );
});

KwitansiPembayaran.displayName = "KwitansiPembayaran";

export default KwitansiPembayaran;
