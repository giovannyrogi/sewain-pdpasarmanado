"use client";

import React, { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import moment from "moment";
import AppModal from "@/app/components/modals/AppModal";
import formatRupiah from "@/app/components/formatrupiah/page";

const emptyValue = "-";

const formatMoney = (value) => {
  const numericValue = Number(value || 0);
  return numericValue > 0 ? formatRupiah(numericValue) : emptyValue;
};

/**
 * MoneyRow menjaga label dan nominal tetap mudah dibaca pada desktop maupun
 * mobile. Row ini dipakai untuk semua rincian kontrak, PPN, DP, dan cicilan.
 */
function MoneyRow({ label, value, strong = false, tone = "default" }) {
  const theme = useTheme();
  const toneColor =
    tone === "success"
      ? theme.palette.success.main
      : tone === "warning"
      ? theme.palette.warning.main
      : "text.primary";

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={0.35}
      sx={{
        py: 0.9,
        borderBottom: `1px dashed ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
        "&:last-of-type": {
          borderBottom: 0,
        },
      }}
    >
      <Typography sx={{ fontSize: 12.5, fontWeight: strong ? 900 : 750 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: strong ? 15 : 13,
          fontWeight: 900,
          color: toneColor,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          textAlign: { xs: "left", sm: "right" },
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/**
 * SectionCard adalah container ringan untuk mengelompokkan rincian biaya.
 * Dipisah dari modal utama supaya layout biaya mudah dirawat dan ditambah.
 */
function SectionCard({ icon, title, description, children }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: { xs: 1.4, sm: 1.75 },
        height: "100%",
        borderRadius: 2,
        border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
        bgcolor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.035)"
            : "rgba(17,24,39,0.025)",
      }}
    >
      <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            color: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            flex: "0 0 auto",
          }}
        >
          <Icon icon={icon} fontSize={18} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 900, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {description && (
            <Typography
              sx={{
                color: theme.ui?.mutedText || "text.secondary",
                fontSize: 11,
                fontWeight: 650,
                mt: 0.2,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.62), mb: 1 }} />
      {children}
    </Box>
  );
}

/**
 * Modal rincian biaya reusable untuk form permohonan baru dan edit permohonan.
 * Komponen ini sengaja mempertahankan nama props lama agar pemanggil bisa
 * berpindah dari modal lama tanpa mengubah perhitungan bisnis di form.
 */
export default function PaymentCalculationDetailModal({
  open,
  onClose,
  totalPayment,
  downPayment,
  estimatedInstallment1,
  estimatedInstallment2,
  estimatedInstallment3,
  remainingPayment,
  paymentType,
  annualRoomRent,
  leaseDurationYears,
  totalSewaKontrakRuangan,
  totalPPN,
  estimatedInstallmentDate1,
  estimatedInstallmentDate2,
  estimatedInstallmentDate3,
  biayaAdministrasi,
  totalPPNDownPayment,
  totalSewaKontrakDownPayment,
  totalPaymentDownPayment,
  totalInstallment,
  chooseTenor,
}) {
  const theme = useTheme();
  const isInstallment = paymentType === "cicilan";

  const installments = useMemo(
    () => [
      {
        label: estimatedInstallmentDate1
          ? `Cicilan 1 (${moment(estimatedInstallmentDate1).format("MMM YYYY")})`
          : "Cicilan 1",
        amount: estimatedInstallment1,
      },
      {
        label: estimatedInstallmentDate2
          ? `Cicilan 2 (${moment(estimatedInstallmentDate2).format("MMM YYYY")})`
          : "Cicilan 2",
        amount: estimatedInstallment2,
      },
      {
        label: estimatedInstallmentDate3
          ? `Cicilan 3 (${moment(estimatedInstallmentDate3).format("MMM YYYY")})`
          : "Cicilan 3",
        amount: estimatedInstallment3,
      },
    ],
    [
      estimatedInstallment1,
      estimatedInstallment2,
      estimatedInstallment3,
      estimatedInstallmentDate1,
      estimatedInstallmentDate2,
      estimatedInstallmentDate3,
    ],
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Rincian Biaya"
      description="Ringkasan harga sewa, PPN, iuran administrasi, dan skema pembayaran."
      icon="solar:wallet-money-bold-duotone"
      width={760}
    >
      <Stack spacing={2.25}>
        <Box
          sx={{
            p: { xs: 1.6, sm: 2 },
            borderRadius: 2.5,
            border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
            bgcolor:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(255,152,0,0.09), rgba(255,255,255,0.035))"
                : "linear-gradient(135deg, rgba(230,9,9,0.07), rgba(255,255,255,0.94))",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Box>
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                <Chip
                  size="small"
                  label={isInstallment ? "Pembayaran Cicilan" : "Pembayaran Lunas"}
                  color={isInstallment ? "warning" : "success"}
                  sx={{ fontWeight: 850 }}
                />
                <Chip
                  size="small"
                  label={`Durasi ${leaseDurationYears || 1} Tahun`}
                  sx={{ fontWeight: 850 }}
                />
              </Stack>
              <Typography
                sx={{
                  color: theme.ui?.mutedText || "text.secondary",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Total yang akan tercatat pada permohonan
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: { xs: 22, sm: 26 },
                fontWeight: 950,
                lineHeight: 1.15,
                wordBreak: "break-word",
              }}
            >
              {formatMoney(totalPayment)}
            </Typography>
          </Stack>
        </Box>

        <Grid container spacing={1.25}>
          <Grid size={{ xs: 12, md: isInstallment ? 6 : 12 }}>
            <SectionCard
              icon="solar:bill-list-bold-duotone"
              title="Nilai Kontrak"
              description="Perhitungan dasar kontrak sebelum skema pembayaran."
            >
              <MoneyRow label="Harga Sewa per Tahun" value={formatMoney(annualRoomRent)} />
              <MoneyRow label="Durasi Sewa" value={`${leaseDurationYears || 1} Tahun`} />
              <MoneyRow label="Total Sewa Kontrak Ruangan" value={formatMoney(totalSewaKontrakRuangan)} />
              <MoneyRow label="Iuran Jasa Administrasi" value={formatMoney(biayaAdministrasi)} />
              <MoneyRow label="PPN 11%" value={formatMoney(totalPPN)} />
              <MoneyRow label="Total Pembayaran" value={formatMoney(totalPayment)} strong />
            </SectionCard>
          </Grid>

          {isInstallment && (
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard
                icon="solar:card-transfer-bold-duotone"
                title="Pembayaran Pertama"
                description="DP, nilai kontrak awal, PPN DP, dan sisa tagihan."
              >
                <MoneyRow label="Uang Muka (DP)" value={formatMoney(downPayment)} />
                <MoneyRow label="Nilai Kontrak" value={formatMoney(totalSewaKontrakDownPayment)} />
                <MoneyRow label="PPN 11%" value={formatMoney(totalPPNDownPayment)} />
                <MoneyRow label="Total Pembayaran Awal" value={formatMoney(totalPaymentDownPayment)} />
                <MoneyRow label="Sisa Tagihan" value={formatMoney(remainingPayment)} strong tone="warning" />
              </SectionCard>
            </Grid>
          )}

          {isInstallment && (
            <Grid size={12}>
              <SectionCard
                icon="solar:calendar-mark-bold-duotone"
                title="Rencana Cicilan"
                description="Estimasi pembayaran lanjutan sesuai tenor yang dipilih."
              >
                {installments.slice(0, Number(chooseTenor || installments.length)).map((item) => (
                  <MoneyRow
                    key={item.label}
                    label={item.label}
                    value={formatMoney(item.amount)}
                  />
                ))}
                <MoneyRow label="Total Cicilan" value={formatMoney(totalInstallment)} strong />
              </SectionCard>
            </Grid>
          )}
        </Grid>

        <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="flex-end">
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
              "&:hover": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.16)"
                    : "rgba(17,24,39,0.13)",
                boxShadow: "none",
              },
            }}
          >
            Kembali
          </Button>
        </Stack>
      </Stack>
    </AppModal>
  );
}
