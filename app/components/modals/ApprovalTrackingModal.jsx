"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Divider, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import axios from "axios";
import moment from "moment";
import AppModal from "@/app/components/modals/AppModal";

const TRACKING_CONFIG = {
  tenant: {
    title: "Progress Approval",
    description: "Riwayat tahapan persetujuan permohonan sewa ruangan.",
    icon: "ph:seal-check-duotone",
    loadingMessage: "Memperbarui data Approval...",
    waitingLabel: "Menunggu Persetujuan",
    endpoint: "/api/tenant-approval/",
    getEntityId: (data) => data?.tenant_application_id,
  },
  termination: {
    title: "Progress Non-Aktif Tenant",
    description: "Riwayat tahapan approval permintaan non-aktif kontrak.",
    icon: "solar:lock-keyhole-bold-duotone",
    loadingMessage: "Memperbarui data Termination Approval...",
    waitingLabel: "Menunggu Persetujuan",
    endpoint: "/api/tenant-termination-approval/",
    getEntityId: (data) => data?.tenant_early_termination_id,
  },
  payment: {
    title: "Progress Verifikasi Pembayaran",
    description: "Riwayat tahapan validasi pembayaran oleh role terkait.",
    icon: "solar:wallet-money-bold-duotone",
    loadingMessage: "Memperbarui data Payment Approval...",
    waitingLabel: "Menunggu Verifikasi",
    endpoint: "/api/payment-approval/",
    getEntityId: (data) => data?.payments?.payment_id || data?.payment_id,
  },
};

const getStatusMeta = (status, theme) => {
  if (status === "approved") {
    return {
      label: "Disetujui",
      color: theme.palette.success.main,
      bg: alpha(theme.palette.success.main, theme.palette.mode === "dark" ? 0.16 : 0.1),
      icon: "ph:seal-check-duotone",
    };
  }

  if (status === "rejected") {
    return {
      label: "Ditolak",
      color: theme.palette.error.main,
      bg: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.16 : 0.1),
      icon: "line-md:close-circle-filled",
    };
  }

  return {
    label: "Menunggu",
    color: theme.palette.warning.main,
    bg: alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.18 : 0.12),
    icon: "svg-spinners:ring-resize",
  };
};

const getProgressSummary = (items) => {
  const approved = items.filter((item) => item.status === "approved").length;
  const rejected = items.filter((item) => item.status === "rejected").length;
  const pending = Math.max(items.length - approved - rejected, 0);

  return { approved, rejected, pending, total: items.length };
};

function SummaryPill({ label, value, color }) {
  return (
    <Chip
      size="small"
      label={`${label}: ${value}`}
      sx={{
        height: 28,
        borderRadius: 999,
        color,
        fontFamily: "Poppins",
        fontWeight: 850,
        bgcolor: alpha(color, 0.12),
        border: `1px solid ${alpha(color, 0.22)}`,
      }}
    />
  );
}

/**
 * ApprovalTrackingModal menyatukan tampilan tracking approval permohonan,
 * terminasi, dan pembayaran. Parent cukup memilih `variant`, sementara komponen
 * ini yang menentukan endpoint, pesan loading, dan copy status yang sesuai.
 */
export default function ApprovalTrackingModal({
  open,
  onClose,
  selectedData,
  variant = "tenant",
  loadingTrue = () => {},
  loadingFalse = () => {},
  setLoadingMessage = () => {},
}) {
  const theme = useTheme();
  const [approvalList, setApprovalList] = useState([]);
  const config = TRACKING_CONFIG[variant] || TRACKING_CONFIG.tenant;
  const entityId = useMemo(() => config.getEntityId(selectedData), [config, selectedData]);
  const loadingHandlersRef = useRef({ loadingTrue, loadingFalse, setLoadingMessage });
  const summary = useMemo(() => getProgressSummary(approvalList), [approvalList]);

  useEffect(() => {
    loadingHandlersRef.current = { loadingTrue, loadingFalse, setLoadingMessage };
  }, [loadingFalse, loadingTrue, setLoadingMessage]);

  useEffect(() => {
    if (!open || !entityId) {
      setApprovalList([]);
      return;
    }

    let active = true;

    const fetchApprovalList = async () => {
      loadingHandlersRef.current.setLoadingMessage(config.loadingMessage);
      loadingHandlersRef.current.loadingTrue();

      try {
        const res = await axios.get(config.endpoint, { params: { id: entityId } });
        if (active && res.data?.success) {
          setApprovalList(res.data.data || []);
        }
      } catch (error) {
        console.error(`Error fetch ${variant} approval tracking:`, error);
      } finally {
        setTimeout(() => {
          if (!active) return;
          loadingHandlersRef.current.loadingFalse();
          loadingHandlersRef.current.setLoadingMessage("Loading...");
        }, 500);
      }
    };

    fetchApprovalList();

    return () => {
      active = false;
    };
  }, [config.endpoint, config.loadingMessage, entityId, open, variant]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={config.title}
      description={config.description}
      icon={config.icon}
      width={620}
    >
      <Stack spacing={1.6}>
        {approvalList.length === 0 && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
              bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.035)" : "rgba(17,24,39,0.025)",
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 750, color: theme.ui?.mutedText }}>
              Belum ada data tracking untuk ditampilkan.
            </Typography>
          </Box>
        )}

        {approvalList.length > 0 && (
          <Box
            sx={{
              p: { xs: 1.4, sm: 1.6 },
              borderRadius: 2.5,
              border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(255,152,0,0.10), rgba(255,255,255,0.035))"
                  : "linear-gradient(135deg, rgba(230,9,9,0.07), rgba(255,255,255,0.94))",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={1.4}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontFamily: "Poppins", fontSize: 14, fontWeight: 600 }}>
                  Ringkasan Approval
                </Typography>
                <Typography
                  sx={{
                    color: theme.ui?.mutedText || "text.secondary",
                    fontFamily: "Poppins",
                    fontSize: 12,
                    fontWeight: 600,
                    mt: 0.25,
                  }}
                >
                  {summary.total} tahapan, {summary.approved} selesai, {summary.pending} menunggu.
                </Typography>
              </Box>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                <SummaryPill label="Approve" value={summary.approved} color={theme.palette.success.main} />
                <SummaryPill label="Menunggu" value={summary.pending} color={theme.palette.warning.main} />
                {summary.rejected > 0 && (
                  <SummaryPill label="Ditolak" value={summary.rejected} color={theme.palette.error.main} />
                )}
              </Stack>
            </Stack>
          </Box>
        )}

        {approvalList.map((item, index) => {
          const statusMeta = getStatusMeta(item.status, theme);
          const actorName = item.full_name || item.approver_name || "-";
          const statusText =
            item.status === "approved"
              ? `Disetujui oleh: ${actorName}`
              : item.status === "rejected"
              ? `Ditolak oleh: ${actorName}`
              : config.waitingLabel;

          return (
            <Box
              key={`${item.role_id || item.approval_id || item.payment_id || index}-${index}`}
              sx={{
                position: "relative",
                p: { xs: 1.35, sm: 1.55 },
                pl: { xs: 1.35, sm: 1.75 },
                borderRadius: 2.4,
                border: `1px solid ${alpha(statusMeta.color, 0.32)}`,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha(statusMeta.color, item.status === "pending" ? 0.12 : 0.13)
                    : alpha(statusMeta.color, item.status === "pending" ? 0.08 : 0.09),
                transition: "transform 160ms ease, border-color 160ms ease, background-color 160ms ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  borderColor: alpha(statusMeta.color, 0.52),
                },
              }}
            >
              <Stack direction="row" spacing={1.35} alignItems="stretch">
                <Box
                  sx={{
                    width: 52,
                    minHeight: 66,
                    flex: "0 0 auto",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 0.3,
                    color: statusMeta.color,
                    bgcolor: alpha(statusMeta.color, theme.palette.mode === "dark" ? 0.16 : 0.1),
                    border: `1px solid ${alpha(statusMeta.color, 0.26)}`,
                  }}
                >
                  <Typography sx={{ fontFamily: "Poppins", fontSize: 18, fontWeight: 950, lineHeight: 1 }}>
                    {index + 1}
                  </Typography>
                  <Icon icon={statusMeta.icon} fontSize={20} />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={0.8}
                    sx={{ mb: 0.45 }}
                  >
                    <Typography sx={{ fontFamily: "Poppins", fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>
                      {item.role_name || "-"}
                    </Typography>
                    <Chip
                      size="small"
                      label={statusMeta.label}
                      sx={{
                        height: 25,
                        color: statusMeta.color,
                        fontFamily: "Poppins",
                        fontWeight: 850,
                        bgcolor: alpha(statusMeta.color, theme.palette.mode === "dark" ? 0.18 : 0.1),
                        border: `1px solid ${alpha(statusMeta.color, 0.25)}`,
                      }}
                    />
                  </Stack>

                  <Typography sx={{ fontFamily: "Poppins", fontSize: 13, fontWeight: 600, color: theme.ui?.mutedText, mt: 0.25 }}>
                    {statusText}
                  </Typography>
                  {["approved", "rejected"].includes(item.status) && item.approved_at && (
                    <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 0.55 }}>
                      <Typography sx={{ fontFamily: "Poppins", fontSize: 12.3, fontWeight: 600, color: theme.ui?.mutedText }}>
                        {moment(item.approved_at).format("DD/MM/YYYY HH:mm")}
                      </Typography>
                    </Stack>
                  )}
                  {item.status === "rejected" && item.notes && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.14 : 0.08),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                      }}
                    >
                      <Typography sx={{ fontFamily: "Poppins", fontSize: 12, fontWeight: 600, color: theme.palette.error.main }}>
                        Catatan Penolakan
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Poppins",
                          fontSize: 12.5,
                          color: theme.ui?.mutedText,
                          mt: 0.25,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {item.notes}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Stack>
            </Box>
          );
        })}

        {approvalList.length > 0 && (
          <Divider sx={{ borderColor: theme.ui?.dashboardCardBorder || theme.palette.divider }} />
        )}

        <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="flex-end" sx={{ pt: 1 }}>
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              borderRadius: 2,
              fontWeight: 850,
              px: 3,
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
        </Stack>
      </Stack>
    </AppModal>
  );
}
