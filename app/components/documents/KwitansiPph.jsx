"use client";

import React, { forwardRef } from "react";
import ReceiptLayout from "./ReceiptLayout";

const KwitansiPph = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const receipt = data?.receipts?.pph;
  const copies = ["yellow"];

  return (
    <div ref={ref}>
      {copies.map((variant, index) => (
        <ReceiptLayout
          key={`${variant}-${index}`}
          data={data}
          receipt={receipt}
          variant={variant}
          type="pph"
          breakAfter={false}
          // breakAfter={index < copies.length - 1}
        />
      ))}
    </div>
  );
});

KwitansiPph.displayName = "KwitansiPph";

export default KwitansiPph;
