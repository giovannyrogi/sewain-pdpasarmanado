"use client";

import {
  Box,
  Button,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";
import { Icon } from "@iconify/react";
import ApprovalStatusOverlay from "@/app/components/modals/ApprovalStatusOverlay";
import AppModal from "@/app/components/modals/AppModal";

const TerminationReasonModal = ({
  open,
  onClose,
  selectedData,
  loadingTrue,
  loadingFalse,
  onNotify,
  getDataApprovals = () => {},
  user,
}) => {
  const theme = useTheme();

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Alasan Non-Aktif Tenant"
      description="Catatan alasan permintaan terminasi atau non-aktif kontrak."
      icon="solar:document-text-bold-duotone"
      width={560}
      contentSx={{ position: "relative" }}
    >
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.035)"
              : "rgba(17,24,39,0.025)",
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 650,
            lineHeight: 1.75,
            textAlign: "justify",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {selectedData?.reason || "-"}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            borderRadius: 2,
            fontWeight: 850,
            color: theme.palette.text.primary,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.10)"
                : "rgba(17,24,39,0.08)",
            boxShadow: "none",
          }}
        >
          Kembali
        </Button>
      </Box>

      <ApprovalStatusOverlay data={selectedData} statusKeys={["approval_status"]} />
    </AppModal>
  );
};

export default TerminationReasonModal;
