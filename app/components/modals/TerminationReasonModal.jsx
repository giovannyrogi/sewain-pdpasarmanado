"use client";

import React from "react";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import AppModal from "@/app/components/modals/AppModal";
import ApprovalStatusOverlay from "@/app/components/modals/ApprovalStatusOverlay";
import { getUploadApiUrl } from "@/app/utils/uploadPath";

/**
 * Modal alasan nonaktif tenant yang reusable untuk menu terminasi dan approval.
 * Komponen ini hanya menampilkan konteks alasan serta tautan surat pernyataan,
 * sehingga aman dipakai ulang tanpa membawa logic approval atau delete.
 */
export default function TerminationReasonModal({ open, onClose, selectedData }) {
  const theme = useTheme();
  const statementUrl = getUploadApiUrl(selectedData?.statement_file_path);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Alasan Non-Aktif Tenant"
      description="Ringkasan alasan dan dokumen pendukung permintaan non-aktif kontrak."
      icon="solar:document-text-bold-duotone"
      width={620}
      contentSx={{ position: "relative" }}
    >
      <Stack spacing={1.5}>
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
              color: theme.ui?.mutedText || "text.secondary",
              fontSize: 11.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.3,
              mb: 0.75,
            }}
          >
            Catatan alasan
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 650,
              lineHeight: 1.75,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {selectedData?.reason || "-"}
          </Typography>
        </Box>

        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
            bgcolor: alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.1 : 0.055,
            ),
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 1.8,
                  display: "grid",
                  placeItems: "center",
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.14),
                }}
              >
                <Icon icon="solar:file-download-bold-duotone" fontSize={21} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 850 }}>
                  Surat Pernyataan
                </Typography>
                <Typography
                  sx={{
                    color: theme.ui?.mutedText || "text.secondary",
                    fontSize: 12,
                    fontWeight: 650,
                  }}
                >
                  Dokumen pendukung permintaan non-aktif tenant.
                </Typography>
              </Box>
            </Stack>

            <Button
              component="a"
              href={statementUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              disabled={!statementUrl}
              variant="contained"
              startIcon={<Icon icon="solar:eye-bold-duotone" />}
              sx={{
                minHeight: 38,
                px: 2,
                borderRadius: 2,
                fontWeight: 850,
                boxShadow: theme.ui?.buttonShadow,
              }}
            >
              Lihat Surat
            </Button>
          </Stack>
        </Box>
      </Stack>

      <ApprovalStatusOverlay data={selectedData} statusKeys={["termination_approval_status"]} />
    </AppModal>
  );
}
