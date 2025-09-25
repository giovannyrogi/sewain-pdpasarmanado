"use client";
import React from "react";
import { Box, Typography } from "@mui/material";

const PaymentApprovedOverlay = ({ selectedData }) => {
  return (
    <Box
      sx={{
        position: "absolute", // relatif terhadap parent
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-15deg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 1,
        px: 6,
        py: 2,
        border:
          selectedData?.payments?.approval_status === "approved"
            ? "5px solid rgba(40, 167, 69, 0.4)"
            : selectedData?.payments?.approval_status === "rejected"
            ? "5px solid rgba(255, 0, 0, 0.5)"
            : "none",
        borderRadius: "8px",
        backgroundColor: "transparent",
      }}
    >
      <Typography
        variant="h3"
        sx={{
          fontWeight: "bold",
          color:
            selectedData?.payments?.approval_status === "approved"
              ? "green"
              : selectedData?.payments?.approval_status === "rejected"
              ? "red"
              : "",
          textTransform: "uppercase",
          letterSpacing: "6px",
          fontStyle: "italic",
          textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        {selectedData?.payments?.approval_status === "approved"
          ? "Approved"
          : selectedData?.payments?.approval_status === "rejected"
          ? "Rejected"
          : ""}
      </Typography>
    </Box>
  );
};

export default PaymentApprovedOverlay;
