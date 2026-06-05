"use client";

import React, { useMemo, useState } from "react";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import Link from "next/link";
import DashboardPanel from "./DashboardPanel";
import { getDashboardListItemSx } from "./dashboardStyles";
import { formatDate, getDaysLabel } from "./dashboardUtils";
import formatRupiah from "@/app/components/formatrupiah/page";

const FilterButton = ({ active, children, onClick }) => {
  const theme = useTheme();

  return (
    <Button
      size="small"
      onClick={onClick}
      sx={{
        minWidth: 0,
        px: 1.2,
        py: 0.55,
        borderRadius: 1.5,
        fontWeight: 900,
        fontSize: 11,
        color: active ? theme.palette.primary.main : theme.ui.mutedText,
        bgcolor: active
          ? theme.palette.mode === "dark"
            ? "rgba(255, 152, 0, 0.13)"
            : "rgba(230, 9, 9, 0.10)"
          : "transparent",
      }}
    >
      {children}
    </Button>
  );
};

const QueueItem = ({
  icon,
  title,
  subtitle,
  meta,
  status,
  tone = "primary",
  actionHref,
  actionLabel = "Detail",
}) => {
  const theme = useTheme();
  const color = theme.palette[tone]?.main || theme.palette.primary.main;

  return (
    <Box sx={getDashboardListItemSx(theme)}>
      <Box
        sx={{
          flex: "0 0 auto",
          width: 42,
          height: 42,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          color,
          bgcolor: theme.palette.mode === "dark" ? `${color}22` : `${color}14`,
        }}
      >
        <Icon icon={icon} fontSize={21} />
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontWeight: 900, fontSize: 13 }}>
          {title}
        </Typography>
        <Typography noWrap sx={{ color: theme.ui.mutedText, fontWeight: 650, fontSize: 12 }}>
          {subtitle}
        </Typography>
        {status && (
          <Typography sx={{ color, fontWeight: 900, fontSize: 11, mt: 0.25 }}>
            {status}
          </Typography>
        )}
      </Box>

      <Stack alignItems="flex-end" spacing={0.75} sx={{ flex: "0 0 auto" }}>
        {meta && (
          <Typography sx={{ color, fontWeight: 900, fontSize: 11, textAlign: "right" }}>
            {meta}
          </Typography>
        )}
        {actionHref && (
          <Button
            LinkComponent={Link}
            href={actionHref}
            size="small"
            endIcon={<Icon icon="solar:arrow-right-linear" />}
            sx={{
              minWidth: 0,
              px: 1,
              py: 0.35,
              borderRadius: 1.5,
              fontWeight: 900,
              fontSize: 11,
              color: theme.palette.primary.main,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 152, 0, 0.10)"
                  : "rgba(230, 9, 9, 0.08)",
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

/**
 * Membentuk antrean approval sesuai role login.
 * Tiap item membawa URL detail supaya modal approval terbuka dari halaman tujuan.
 */
const buildApprovalItems = (queues = {}) => [
  ...(queues.tenantApproval?.items || []).map((item) => ({
    key: `tenant-${item.approval_id}`,
    icon: "solar:document-add-bold-duotone",
    title: item.tenant_name,
    subtitle: `${item.location_name} - ${item.room_number}`,
    status: "Permohonan sewa menunggu approval",
    meta: "Permohonan",
    tone: "info",
    actionHref: `/tenant-approval?tenant_application_id=${item.tenant_application_id}&open=approval`,
  })),
  ...(queues.terminationApproval?.items || []).map((item) => ({
    key: `termination-${item.approval_id}`,
    icon: "solar:lock-keyhole-bold-duotone",
    title: item.tenant_name,
    subtitle: item.reason || "Permintaan terminasi/nonaktif",
    status: "Terminasi menunggu approval",
    meta: "Terminasi",
    tone: "warning",
    actionHref: `/tenant-terminations-approval?tenant_early_termination_id=${item.termination_id}&open=approval`,
  })),
];

/**
 * Panel-panel antrean kerja dashboard.
 * Komponen ini mengatur visibilitas role, filter lokal, dan link detail tanpa
 * mengubah keamanan halaman tujuan.
 */
export default function DashboardQueues({ overview, loading }) {
  const theme = useTheme();
  const access = overview?.access || {};
  const queues = overview?.queues || {};
  const [paymentFilter, setPaymentFilter] = useState("dueSoon");
  const [contractFilter, setContractFilter] = useState("soon");
  const approvalItems = useMemo(() => buildApprovalItems(queues), [queues]);
  const dueItems = queues.duePayments || [];
  const expiringItems = queues.expiringContracts || [];
  const paymentValidationItems = queues.paymentApproval?.items || [];

  const filteredPayments = dueItems.filter((item) =>
    paymentFilter === "dueSoon"
      ? Number(item.days_remaining) >= 0
      : Number(item.days_remaining) < 0,
  );
  const filteredContracts = expiringItems.filter((item) =>
    contractFilter === "soon"
      ? Number(item.days_remaining) >= 0
      : Number(item.days_remaining) < 0,
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "repeat(auto-fit, minmax(min(100%, 410px), 1fr))",
        },
        gap: { xs: 1.5, lg: 2 },
        alignItems: "start",
      }}
    >
      {access.canSeeTenantApprovalQueue && (
        <DashboardPanel
          title="Butuh Tindakan"
          caption="Permohonan dan terminasi yang sudah masuk giliran role Anda"
          loading={loading}
          empty={!approvalItems.length}
          emptyText="Tidak ada tindakan yang menunggu."
        >
          <Stack spacing={1}>
            {approvalItems.slice(0, 6).map(({ key, ...item }) => (
              <QueueItem key={key} {...item} />
            ))}
          </Stack>
        </DashboardPanel>
      )}

      {access.canSeePaymentValidationQueue && (
        <DashboardPanel
          title="Validasi Pembayaran"
          caption="Bukti pembayaran yang menunggu validasi keuangan"
          loading={loading}
          empty={!paymentValidationItems.length}
          emptyText="Tidak ada pembayaran yang perlu divalidasi."
        >
          <Stack spacing={1}>
            {paymentValidationItems.slice(0, 6).map((item) => (
              <QueueItem
                key={`payment-${item.approval_id}`}
                icon="solar:wallet-money-bold-duotone"
                title={item.tenant_name}
                subtitle={`${formatRupiah(item.amount || 0)} - ${formatDate(item.payment_date)}`}
                status="Menunggu validasi pembayaran"
                meta="Payment"
                tone="success"
                actionHref={`/payments?payment_id=${item.payment_id}&open=approval`}
              />
            ))}
          </Stack>
        </DashboardPanel>
      )}

      {access.canSeeDuePayments && (
        <DashboardPanel
          title="Jatuh Tempo Pembayaran"
          caption="Pantau cicilan 7 hari ke depan dan yang sudah terlambat"
          loading={loading}
          empty={!filteredPayments.length}
          emptyText="Tidak ada pembayaran pada filter ini."
          action={
            <Button
              size="small"
              endIcon={<Icon icon="solar:arrow-right-linear" />}
              sx={{
                minWidth: 0,
                px: 1.25,
                borderRadius: 1.5,
                fontWeight: 900,
                color: theme.palette.primary.main,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 152, 0, 0.10)"
                    : "rgba(230, 9, 9, 0.08)",
              }}
            >
              Pantau
            </Button>
          }
        >
          <Stack spacing={1.25}>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              <FilterButton
                active={paymentFilter === "dueSoon"}
                onClick={() => setPaymentFilter("dueSoon")}
              >
                7 Hari Lagi
              </FilterButton>
              <FilterButton
                active={paymentFilter === "overdue"}
                onClick={() => setPaymentFilter("overdue")}
              >
                Terlambat
              </FilterButton>
            </Box>
            {filteredPayments.slice(0, 6).map((item) => (
              <QueueItem
                key={`due-${item.tenant_application_id}`}
                icon="solar:alarm-bold-duotone"
                title={item.tenant_name}
                subtitle={`Cicilan ${item.current_payment_step || "-"} - ${formatDate(item.due_date)}`}
                meta={getDaysLabel(item.days_remaining)}
                tone={Number(item.days_remaining) < 0 ? "error" : "warning"}
              />
            ))}
          </Stack>
        </DashboardPanel>
      )}

      {access.canSeeExpiringContracts && (
        <DashboardPanel
          title="Kontrak Segera Berakhir"
          caption="Kontrak aktif yang akan berakhir bulan ini dan yang sudah expired"
          loading={loading}
          empty={!filteredContracts.length}
          emptyText="Tidak ada kontrak pada filter ini."
        >
          <Stack spacing={1.25}>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              <FilterButton
                active={contractFilter === "soon"}
                onClick={() => setContractFilter("soon")}
              >
                Bulan Ini
              </FilterButton>
              <FilterButton
                active={contractFilter === "expired"}
                onClick={() => setContractFilter("expired")}
              >
                Sudah Expired
              </FilterButton>
            </Box>
            {filteredContracts.slice(0, 6).map((item) => (
              <QueueItem
                key={`exp-${item.tenant_application_id}`}
                icon="solar:calendar-mark-bold-duotone"
                title={item.tenant_name}
                subtitle={`${item.location_name} - ${item.room_number}`}
                meta={getDaysLabel(item.days_remaining)}
                tone={Number(item.days_remaining) < 0 ? "error" : "warning"}
              />
            ))}
          </Stack>
        </DashboardPanel>
      )}
    </Box>
  );
}
