"use client";

import React, { useMemo, useState } from "react";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import Link from "next/link";
import DashboardPanel from "@/app/components/dashboard/DashboardPanel";
import { getDashboardListItemSx } from "@/app/components/dashboard/dashboardStyles";
import {
  formatDate,
  getContractDaysLabel,
  getDaysLabel,
} from "@/app/components/dashboard/dashboardUtils";
import formatRupiah from "@/app/components/formatrupiah/page";

const FilterButton = ({ active, children, count, onClick }) => {
  const theme = useTheme();

  return (
    <Button
      size="small"
      onClick={onClick}
      sx={{
        minWidth: 0,
        px: 1.15,
        py: 0.55,
        borderRadius: 1.5,
        fontWeight: 600,
        fontSize: 11,
        gap: 0.75,
        color: active ? theme.palette.primary.main : theme.ui.mutedText,
        bgcolor: active
          ? theme.palette.mode === "dark"
            ? "rgba(255, 152, 0, 0.13)"
            : "rgba(230, 9, 9, 0.10)"
          : "transparent",
        border: `1px solid ${
          active ? `${theme.palette.primary.main}44` : "transparent"
        }`,
      }}
    >
      <Box component="span">{children}</Box>
      {typeof count === "number" && (
        <Box
          component="span"
          sx={{
            width: 20,
            height: 20,
            minWidth: 20,
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 600,
            color: active ? theme.palette.primary.main : theme.palette.text.primary,
            bgcolor:
              theme.palette.mode === "dark"
                ? active
                  ? "rgba(255, 152, 0, 0.18)"
                  : "rgba(255,255,255,0.10)"
                : active
                ? "rgba(230, 9, 9, 0.12)"
                : "rgba(17,24,39,0.08)",
          }}
        >
          {count}
        </Box>
      )}
    </Button>
  );
};

const EmptyQueueState = ({ text }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: 132,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        color: theme.ui.mutedText,
      }}
    >
      <Stack alignItems="center" spacing={1}>
        <Icon icon="solar:check-circle-bold-duotone" fontSize={34} />
        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{text}</Typography>
      </Stack>
    </Box>
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
  actionLoadingMessage,
}) => {
  const theme = useTheme();
  const color = theme.palette[tone]?.main || theme.palette.primary.main;
  const handleActionClick = () => {
    if (!actionLoadingMessage || typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("sewain:global-loading-show", {
        detail: { message: actionLoadingMessage },
      }),
    );
  };

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
        <Typography noWrap sx={{ fontWeight: 600, fontSize: 13 }}>
          {title}
        </Typography>
        <Typography
          noWrap
          sx={{ color: theme.ui.mutedText, fontWeight: 650, fontSize: 12 }}
        >
          {subtitle}
        </Typography>
        {status && (
          <Typography sx={{ color, fontWeight: 600, fontSize: 11, mt: 0.25 }}>
            {status}
          </Typography>
        )}
      </Box>

      <Stack alignItems="flex-end" spacing={0.75} sx={{ flex: "0 0 auto" }}>
        {meta && (
          <Typography
            sx={{ color, fontWeight: 600, fontSize: 11, textAlign: "right" }}
          >
            {meta}
          </Typography>
        )}
        {actionHref && (
          <Button
            LinkComponent={Link}
            href={actionHref}
            size="small"
            startIcon={<Icon icon="solar:eye-bold-duotone" />}
            endIcon={<Icon icon="solar:arrow-right-linear" />}
            onClick={handleActionClick}
            sx={{
              minWidth: 0,
              minHeight: 30,
              px: 1.15,
              py: 0.45,
              borderRadius: 1.5,
              fontWeight: 600,
              fontSize: 11,
              lineHeight: 1,
              color: theme.palette.primary.main,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 152, 0, 0.14)"
                  : "rgba(230, 9, 9, 0.10)",
              border: `1px solid ${theme.palette.primary.main}55`,
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

const buildApprovalItems = (queues = {}) => [
  ...(queues.applicationApproval?.items || []).map((item) => ({
    key: `application-${item.approval_id}`,
    icon: "solar:document-add-bold-duotone",
    title: item.tenant_name,
    subtitle: `${item.location_name} - ${item.sector_name} - Lahan ${item.stall_number}`,
    status: "Permohonan izin lahan menunggu approval",
    meta: "Permohonan",
    tone: "info",
    actionHref: `/land-permit-approval?land_permit_application_id=${item.land_permit_application_id}&open=approval`,
    actionLoadingMessage: "Menampilkan detail approval izin lahan...",
  })),
  ...(queues.terminationApproval?.items || []).map((item) => ({
    key: `termination-${item.approval_id}`,
    icon: "solar:lock-keyhole-bold-duotone",
    title: item.tenant_name,
    subtitle: item.reason || "Pengajuan non-aktif izin lahan",
    status: "Non-aktif izin lahan menunggu approval",
    meta: "Non-Aktif",
    tone: "warning",
    actionHref: `/land-permit-termination-approval?land_permit_termination_id=${item.land_permit_termination_id}&open=approval`,
    actionLoadingMessage: "Menampilkan detail approval non-aktif izin lahan...",
  })),
];

export default function LandPermitQueues({ overview, loading }) {
  const access = overview?.access || {};
  const queues = overview?.queues || {};
  const [paymentFilter, setPaymentFilter] = useState("dueSoon");
  const [expiryFilter, setExpiryFilter] = useState("soon");
  const approvalItems = useMemo(() => buildApprovalItems(queues), [queues]);
  const paymentValidationItems = queues.paymentValidation?.items || [];
  const dueItems = queues.duePayments || [];
  const expiringItems = queues.expiringPermits || [];
  const dueSoonCount = dueItems.filter((item) => item.due_status === "dueSoon").length;
  const overdueCount = dueItems.filter((item) => item.due_status === "overdue").length;
  const expiringSoonCount = expiringItems.filter(
    (item) => item.permit_expiry_status === "expiringSoon",
  ).length;
  const expiredCount = expiringItems.filter(
    (item) => item.permit_expiry_status === "expired",
  ).length;

  const filteredPayments = dueItems.filter((item) =>
    paymentFilter === "dueSoon"
      ? item.due_status === "dueSoon"
      : item.due_status === "overdue",
  );
  const filteredPermits = expiringItems.filter((item) =>
    expiryFilter === "soon"
      ? item.permit_expiry_status === "expiringSoon"
      : item.permit_expiry_status === "expired",
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
      {(access.canSeeApplicationApprovalQueue ||
        access.canSeeTerminationApprovalQueue) && (
        <DashboardPanel
          title="Butuh Tindakan"
          caption="Permohonan dan non-aktif izin lahan yang masuk giliran role Anda"
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
          caption="Bukti pembayaran izin lahan yang menunggu validasi keuangan"
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
                subtitle={`${item.location_name} - ${item.sector_name} - Lahan ${item.stall_number}`}
                status={`Dibayar ${formatDate(item.payment_date)}`}
                meta={formatRupiah(item.amount || 0)}
                tone="success"
                actionHref={`/land-permit-payments?payment_id=${item.payment_id}&open=approval`}
                actionLabel="Setujui"
                actionLoadingMessage="Menampilkan detail validasi pembayaran izin lahan..."
              />
            ))}
          </Stack>
        </DashboardPanel>
      )}

      {access.canSeePaymentDue && (
        <DashboardPanel
          title="Jatuh Tempo Pembayaran"
          caption="Izin yang tanggal mulainya dekat atau sudah lewat tetapi belum dibayar"
          loading={loading}
          empty={false}
        >
          <Stack spacing={1.25}>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              <FilterButton
                active={paymentFilter === "dueSoon"}
                count={dueSoonCount}
                onClick={() => setPaymentFilter("dueSoon")}
              >
                30 Hari Lagi
              </FilterButton>
              <FilterButton
                active={paymentFilter === "overdue"}
                count={overdueCount}
                onClick={() => setPaymentFilter("overdue")}
              >
                Terlambat
              </FilterButton>
            </Box>
            {filteredPayments.length ? (
              filteredPayments.slice(0, 6).map((item) => (
                <QueueItem
                  key={`due-${item.land_permit_application_id}`}
                  icon="solar:alarm-bold-duotone"
                  title={item.tenant_name}
                  subtitle={`${item.location_name} - ${item.sector_name} - Lahan ${item.stall_number} | Mulai ${formatDate(item.start_date)}`}
                  meta={getDaysLabel(item.days_remaining)}
                  tone={Number(item.days_remaining) < 0 ? "error" : "warning"}
                />
              ))
            ) : (
              <EmptyQueueState text="Tidak ada pembayaran pada filter ini." />
            )}
          </Stack>
        </DashboardPanel>
      )}

      {access.canSeeExpiringPermits && (
        <DashboardPanel
          title="Izin Lahan Segera Berakhir"
          caption="Izin aktif yang akan berakhir 30 hari ke depan dan yang sudah berakhir"
          loading={loading}
          empty={false}
        >
          <Stack spacing={1.25}>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              <FilterButton
                active={expiryFilter === "soon"}
                count={expiringSoonCount}
                onClick={() => setExpiryFilter("soon")}
              >
                30 Hari Lagi
              </FilterButton>
              <FilterButton
                active={expiryFilter === "expired"}
                count={expiredCount}
                onClick={() => setExpiryFilter("expired")}
              >
                Sudah Berakhir
              </FilterButton>
            </Box>
            {filteredPermits.length ? (
              filteredPermits.slice(0, 6).map((item) => (
                <QueueItem
                  key={`exp-${item.land_permit_application_id}`}
                  icon="solar:calendar-mark-bold-duotone"
                  title={item.tenant_name}
                  subtitle={`${item.location_name} - ${item.sector_name} - Lahan ${item.stall_number} | Berakhir ${formatDate(item.end_date)}`}
                  meta={getContractDaysLabel(item.days_remaining)}
                  tone={Number(item.days_remaining) < 0 ? "error" : "warning"}
                />
              ))
            ) : (
              <EmptyQueueState text="Tidak ada izin lahan pada filter ini." />
            )}
          </Stack>
        </DashboardPanel>
      )}
    </Box>
  );
}
