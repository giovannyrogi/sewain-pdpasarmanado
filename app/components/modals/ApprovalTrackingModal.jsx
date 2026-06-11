"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
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
    label: "Pending",
    color: theme.palette.warning.main,
    bg: alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.18 : 0.12),
    icon: "svg-spinners:ring-resize",
  };
};

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
      <Stack spacing={1.35}>
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
                p: { xs: 1.35, sm: 1.6 },
                borderRadius: 2,
                border: `1px solid ${alpha(statusMeta.color, 0.28)}`,
                bgcolor: statusMeta.bg,
              }}
            >
              <Stack direction="row" spacing={1.4} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    flex: "0 0 auto",
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    border: `2px solid ${statusMeta.color}`,
                    color: statusMeta.color,
                    fontWeight: 900,
                  }}
                >
                  {variant === "payment" ? (
                    <Icon icon={statusMeta.icon} fontSize={26} />
                  ) : (
                    index + 1
                  )}
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 900, lineHeight: 1.25 }}>
                    {item.role_name || "-"}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: theme.ui?.mutedText, mt: 0.25 }}>
                    {statusText}
                  </Typography>
                  {["approved", "rejected"].includes(item.status) && item.approved_at && (
                    <Typography sx={{ fontSize: 12.5, color: theme.ui?.mutedText, mt: 0.25 }}>
                      Tanggal: {moment(item.approved_at).format("DD/MM/YYYY HH:mm")}
                    </Typography>
                  )}
                  {item.status === "rejected" && item.notes && (
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        color: theme.ui?.mutedText,
                        mt: 0.7,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      Catatan: {item.notes}
                    </Typography>
                  )}
                </Box>

                <Icon icon={statusMeta.icon} width={34} height={34} color={statusMeta.color} />
              </Stack>
            </Box>
          );
        })}

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
