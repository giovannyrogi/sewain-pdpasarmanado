"use client";

import React, { forwardRef } from "react";
import moment from "moment";
import ReceiptLayout from "./ReceiptLayout";

const LandPermitReceipt = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const normalizedData = {
    tenant_application: {
      tenant_name: data.tenant_name,
      start_date: data.start_date,
      end_date: data.end_date,
      total_payment: data.total_payment,
    },
    payments: {
      payment_amount: data.payment_amount,
      payment_date: data.payment_date,
      payment_number: 1,
    },
    location: {
      location_name: data.location_name,
    },
    sector: {
      sector_name: data.sector_name,
    },
    stall: {
      stall_number: data.stall_number,
    },
  };
  const receipt = {
    receipt_number: `IL-${moment().format("YYYY")}-${String(
      data.land_permit_payment_id || "",
    ).padStart(6, "0")}`,
    receipt_date: moment().format("YYYY-MM-DD"),
    account_code: "",
    amount: Number(data.payment_amount || data.total_payment || 0),
  };

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "216mm",
        height: "279mm",
      }}
    >
      <ReceiptLayout
        data={normalizedData}
        receipt={receipt}
        variant="white"
        type="landPermit"
        breakAfter={false}
      />
    </div>
  );
});

LandPermitReceipt.displayName = "LandPermitReceipt";

export default LandPermitReceipt;
