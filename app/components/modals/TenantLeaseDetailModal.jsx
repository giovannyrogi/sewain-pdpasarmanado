"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
import ApprovalStatusOverlay from "@/app/components/modals/ApprovalStatusOverlay";
import ImagePreviewModal from "@/app/components/modals/ImagePreviewModal";
import formatRupiah from "@/app/components/formatrupiah/page";
import { buildPaymentDetail } from "@/app/utils/buildPaymentDetail";
import { formatNumber } from "@/app/utils/formatNumber";
import { getUploadApiUrl } from "@/app/utils/uploadPath";

const emptyValue = "-";

const formatDate = (value) => (value ? moment(value).format("YYYY/MM/DD") : emptyValue);

/**
 * Mengubah nilai kosong menjadi tanda strip agar tampilan detail konsisten.
 * Helper kecil ini dipakai banyak baris data supaya komponen utama tetap mudah dibaca.
 */
const displayValue = (value) => {
  if (value === 0) return 0;
  return value ? value : emptyValue;
};

/**
 * Nilai jenis harga dari database memakai kode teknis. Helper ini menjaga teks
 * yang tampil di modal tetap mudah dipahami pengguna operasional.
 */
const getRoomPriceTypeLabel = (priceType) => {
  const normalizedPriceType = String(priceType || "").trim().toLowerCase();

  if (normalizedPriceType === "harga_tetap") return "Harga Tetap";
  if (normalizedPriceType === "harga_per_meter") return "Harga per Meter";

  return emptyValue;
};

const getRoomPriceValueLabel = (priceType) => {
  const normalizedPriceType = String(priceType || "").trim().toLowerCase();
  return normalizedPriceType === "harga_tetap"
    ? "Harga Tetap Ruangan"
    : "Harga Ruangan / m²";
};

/**
 * Kartu kecil untuk menampilkan informasi pasangan label/nilai.
 * Dipisah agar detail pemohon, ruangan, dan biaya dapat memakai pola UI yang sama.
 */
function InfoTile({ icon, label, value, fullWidth = false }) {
  const theme = useTheme();

  return (
    <Grid size={{ xs: 12, sm: fullWidth ? 12 : 6, md: fullWidth ? 12 : 4 }}>
      <Box
        sx={{
          height: "100%",
          p: 1.5,
          borderRadius: 2,
          border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.035)"
              : "rgba(17,24,39,0.025)",
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="flex-start">
          {icon && (
            <Box
              sx={{
                width: 32,
                height: 32,
                flex: "0 0 auto",
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              }}
            >
              <Icon icon={icon} fontSize={18} />
            </Box>
          )}

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: theme.ui?.mutedText || "text.secondary",
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1.4,
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.45,
                mt: 0.25,
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              {value}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Grid>
  );
}

/**
 * Section visual dengan judul, deskripsi opsional, dan divider aksen.
 * Semua blok detail memakai komponen ini agar hierarki informasi mudah dipindai.
 */
function DetailSection({ icon, title, description, children }) {
  const theme = useTheme();

  return (
    <Box sx={{ mt: 2.25 }}>
      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.4,
            display: "grid",
            placeItems: "center",
            color: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          }}
        >
          <Icon icon={icon} fontSize={17} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
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
      <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.62), mb: 1.4 }} />
      {children}
    </Box>
  );
}

/**
 * Baris nominal untuk rincian biaya.
 * Komponen ini menjaga label dan nominal tetap rapi di layar kecil maupun desktop.
 */
function MoneyRow({ label, value, strong = false }) {
  const theme = useTheme();

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={0.35}
      sx={{
        py: 0.9,
        borderBottom: `1px dashed ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
      }}
    >
      <Typography sx={{ fontSize: 12.5, fontWeight: strong ? 900 : 750 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: strong ? 15 : 13,
          fontWeight: 700,
          color: "text.primary",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/**
 * Modal detail pemohon reusable untuk mode lihat detail dan mode approval.
 * Tombol approve hanya dirender bila `canApprove` true dan status data belum final,
 * sehingga admin kontrak tetap mendapat detail penuh tanpa aksi approval.
 */
export default function TenantLeaseDetailModal({
  open,
  onClose,
  selectedData,
  canApprove = false,
  approving = false,
  onApprove,
  showTerminationDetail = false,
  paymentContext = null,
}) {
  const theme = useTheme();
  const [previewImage, setPreviewImage] = useState({
    open: false,
    url: "",
    alt: "Preview",
  });

  const paymentDetail = buildPaymentDetail(selectedData);
  const ktpImageUrl = getUploadApiUrl(selectedData?.ktp_file_path);
  const statementFileUrl = getUploadApiUrl(selectedData?.statement_file_path);
  const proofFileUrl = getUploadApiUrl(paymentContext?.proof_file_path);
  const resolvedStatus =
    selectedData?.status || selectedData?.approval_status;
  const normalizedStatus = String(resolvedStatus || "").toLowerCase();
  const isFinalStatus = ["approved", "rejected"].includes(normalizedStatus);
  const showApproveButton = canApprove && !isFinalStatus;
  const paymentHistory = paymentContext?.previous_payments || [];
  const paymentLabel = paymentContext?.payment_label || "Pembayaran";

  /**
   * Preview modal yang tersedia saat ini berbasis tag img. Untuk file bukti
   * berbentuk PDF, fallback tetap membuka tab baru agar dokumen tidak rusak.
   */
  const openDocumentPreview = (url, alt) => {
    if (!url) return;

    if (String(url).toLowerCase().includes(".pdf")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    setPreviewImage({ open: true, url, alt });
  };

  const installments = useMemo(
    () => [
      {
        label: selectedData?.estimated_installment_1_date
          ? `Cicilan 1 (${moment(selectedData.estimated_installment_1_date).format("MMM YYYY")})`
          : "Cicilan 1",
        amount: selectedData?.estimated_installment_1,
      },
      {
        label: selectedData?.estimated_installment_2_date
          ? `Cicilan 2 (${moment(selectedData.estimated_installment_2_date).format("MMM YYYY")})`
          : "Cicilan 2",
        amount: selectedData?.estimated_installment_2,
      },
      {
        label: selectedData?.estimated_installment_3_date
          ? `Cicilan 3 (${moment(selectedData.estimated_installment_3_date).format("MMM YYYY")})`
          : "Cicilan 3",
        amount: selectedData?.estimated_installment_3,
      },
    ],
    [selectedData],
  );

  return (
    <>
      <AppModal
        open={open}
        onClose={approving ? undefined : onClose}
        title="Detail Data Pemohon"
        description="Informasi pemohon, ruangan, masa kontrak, dan rincian pembayaran."
        icon="solar:user-id-bold-duotone"
        width={980}
        contentSx={{ position: "relative" }}
      >
        <Stack spacing={2.25}>
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2.5,
              border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(255,152,0,0.10), rgba(255,255,255,0.035))"
                  : "linear-gradient(135deg, rgba(230,9,9,0.08), rgba(255,255,255,0.92))",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 700 }}>
                  {displayValue(selectedData?.tenant_name)}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label={`NIK: ${displayValue(selectedData?.tenant_nik)}`}
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    size="small"
                    label={`Telp: ${displayValue(selectedData?.tenant_phone)}`}
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              </Box>

              <Box
                sx={{
                  width: { xs: "100%", md: 250 },
                  height: { xs: 156, md: 138 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(0,0,0,0.25)"
                      : "rgba(255,255,255,0.72)",
                  cursor: selectedData?.ktp_file_path ? "zoom-in" : "default",
                }}
                onClick={() =>
                  selectedData?.ktp_file_path &&
                  openDocumentPreview(ktpImageUrl, "Preview KTP")
                }
              >
                {selectedData?.ktp_file_path ? (
                  <Box
                    component="img"
                    src={ktpImageUrl}
                    alt="Foto KTP penyewa"
                    sx={{
                      width: "100%",
                      height: "100%",
                      p: 1,
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                ) : (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={0.8}
                    sx={{ height: "100%", color: theme.ui?.mutedText }}
                  >
                    <Icon icon="solar:gallery-remove-bold-duotone" fontSize={28} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                      Tidak ada foto KTP
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Box>

          <DetailSection
            icon="solar:buildings-3-bold-duotone"
            title="Detail Lokasi & Ruangan"
            description="Lokasi, ukuran ruangan, harga dasar, dan masa berlaku kontrak."
          >
            <Grid container spacing={1.25}>
              <InfoTile icon="solar:map-point-bold-duotone" label="Nama Lokasi" value={displayValue(selectedData?.location_name)} />
              <InfoTile icon="solar:layers-bold-duotone" label="Lantai" value={displayValue(selectedData?.floor)} />
              <InfoTile icon="cil:room" label="Ruangan" value={selectedData?.room_number ? `No. ${selectedData.room_number}` : emptyValue} />
              <InfoTile icon="solar:ruler-bold-duotone" label="Panjang" value={selectedData?.room_length ? `${formatNumber(selectedData.room_length)} M` : emptyValue} />
              <InfoTile icon="solar:ruler-cross-pen-bold-duotone" label="Lebar" value={selectedData?.room_width ? `${formatNumber(selectedData.room_width)} M` : emptyValue} />
              <InfoTile icon="solar:widget-5-bold-duotone" label="Luas" value={selectedData?.room_area ? `${formatNumber(selectedData.room_area)} m²` : emptyValue} />
              <InfoTile icon="solar:tag-price-bold-duotone" label="Jenis Harga" value={getRoomPriceTypeLabel(selectedData?.price_type)} />
              <InfoTile icon="solar:tag-price-bold-duotone" label={getRoomPriceValueLabel(selectedData?.price_type)} value={selectedData?.price_per_m2 ? formatRupiah(selectedData.price_per_m2) : emptyValue} />
              <InfoTile icon="solar:calendar-add-bold-duotone" label="Tanggal Dibuat" value={formatDate(selectedData?.created_at)} />
              <InfoTile
                icon="solar:calendar-date-bold-duotone"
                label="Masa Berlaku"
                fullWidth
                value={
                  selectedData?.start_date && selectedData?.end_date
                    ? `${formatDate(selectedData.start_date)} s/d ${formatDate(selectedData.end_date)}`
                    : "Pendaftaran Baru"
                }
              />
            </Grid>
          </DetailSection>

          <DetailSection
            icon="solar:wallet-money-bold-duotone"
            title="Detail Biaya"
            description="Ringkasan nilai kontrak, PPN, iuran administrasi, dan total pembayaran."
          >
            <Box
              sx={{
                p: { xs: 1.4, sm: 1.75 },
                borderRadius: 2,
                border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.035)"
                    : "rgba(17,24,39,0.025)",
              }}
            >
              <MoneyRow label="Tipe Pembayaran" value={selectedData?.payment_type === "cicilan" ? "Cicilan" : "Lunas"} />
              {!showTerminationDetail && (
                <MoneyRow label="Harga Sewa per Tahun" value={paymentDetail.annualRoomRent ? formatRupiah(paymentDetail.annualRoomRent) : emptyValue} />
              )}
              <MoneyRow label="Durasi Sewa" value={`${paymentDetail.leaseDurationYears} Tahun`} />
              <MoneyRow label="Total Sewa Kontrak Ruangan" value={paymentDetail.totalSewaKontrakRuangan ? formatRupiah(paymentDetail.totalSewaKontrakRuangan) : emptyValue} />
              <MoneyRow label="Iuran Jasa Administrasi" value={formatRupiah(selectedData?.admin_fee || 0)} />
              <MoneyRow label="PPN 11%" value={formatRupiah(paymentDetail.totalPPN || 0)} />
              <MoneyRow label="Total Pembayaran" value={paymentDetail.totalPayment ? formatRupiah(paymentDetail.totalPayment) : emptyValue} strong />
            </Box>
          </DetailSection>

          {selectedData?.payment_type === "cicilan" && (
            <DetailSection
              icon="solar:bill-list-bold-duotone"
              title="Rincian Pembayaran Cicilan"
              description="Uang muka, nilai kontrak awal, sisa pembayaran, dan rencana cicilan."
            >
              <Grid container spacing={1.25}>
                <Grid size={{ xs: 12, md: 6 }}>
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
                    <MoneyRow label="Uang Muka (DP)" value={paymentDetail.downPayment ? formatRupiah(paymentDetail.downPayment) : emptyValue} />
                    <MoneyRow label="Nilai Kontrak" value={paymentDetail.nilaiKontrak ? formatRupiah(paymentDetail.nilaiKontrak) : emptyValue} />
                    <MoneyRow label="PPN 11%" value={paymentDetail.PPNDownPayment ? formatRupiah(paymentDetail.PPNDownPayment) : emptyValue} />
                    <MoneyRow label="Sisa Pembayaran" value={paymentDetail.remainingPayment ? formatRupiah(paymentDetail.remainingPayment) : emptyValue} strong />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
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
                    {installments
                      .slice(0, Number(selectedData?.current_tenor || installments.length))
                      .map((item) => (
                        <MoneyRow
                          key={item.label}
                          label={item.label}
                          value={item.amount ? formatRupiah(item.amount) : emptyValue}
                        />
                      ))}
                    <MoneyRow label="Total Cicilan" value={paymentDetail.totalInstallment ? formatRupiah(paymentDetail.totalInstallment) : emptyValue} strong />
                  </Box>
                </Grid>
              </Grid>
            </DetailSection>
          )}

          {showTerminationDetail && (
            <DetailSection
              icon="solar:lock-keyhole-bold-duotone"
              title="Detail Permintaan Non-Aktif Tenant"
              description="Alasan, pembuat permintaan, dan dokumen pernyataan terminasi."
            >
              <Grid container spacing={1.25}>
                <InfoTile
                  icon="solar:document-text-bold-duotone"
                  label="Alasan"
                  value={displayValue(selectedData?.reason)}
                  fullWidth
                />
                <InfoTile
                  icon="solar:user-check-bold-duotone"
                  label="Dibuat Oleh"
                  value={displayValue(selectedData?.termination_processed_by_full_name)}
                />
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box
                    sx={{
                      height: "100%",
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.035)"
                          : "rgba(17,24,39,0.025)",
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          flex: "0 0 auto",
                          borderRadius: 1.5,
                          display: "grid",
                          placeItems: "center",
                          color: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                        }}
                      >
                        <Icon icon="solar:file-download-bold-duotone" fontSize={18} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: theme.ui?.mutedText || "text.secondary",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Surat Pernyataan
                        </Typography>
                        {selectedData?.statement_file_path ? (
                          <Button
                            size="small"
                            onClick={() => window.open(statementFileUrl, "_blank", "noopener,noreferrer")}
                            sx={{
                              minWidth: 0,
                              p: 0,
                              mt: 0.25,
                              fontSize: 12.5,
                              fontWeight: 700,
                              textTransform: "none",
                            }}
                          >
                            Lihat Surat
                          </Button>
                        ) : (
                          <Typography sx={{ fontSize: 13, fontWeight: 700, mt: 0.25 }}>
                            Belum ada surat
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </DetailSection>
          )}

          {paymentContext && (
            <DetailSection
              icon="solar:wallet-money-bold-duotone"
              title="Detail Bukti Pembayaran"
              description="Bukti transfer, nominal pembayaran, dan riwayat pembayaran sebelumnya."
            >
              <Grid container spacing={1.25}>
                <InfoTile
                  icon="solar:bill-check-bold-duotone"
                  label="Tahap Pembayaran"
                  value={paymentLabel}
                />
                <InfoTile
                  icon="solar:calendar-date-bold-duotone"
                  label="Tanggal Pembayaran"
                  value={formatDate(paymentContext?.payment_date)}
                />
                <InfoTile
                  icon="solar:wallet-bold-duotone"
                  label="Nominal Dibayar"
                  value={paymentContext?.payment_amount ? formatRupiah(paymentContext.payment_amount) : emptyValue}
                />
                <InfoTile
                  icon="solar:document-add-bold-duotone"
                  label="Nilai Kontrak"
                  value={paymentContext?.contract_amount ? formatRupiah(paymentContext.contract_amount) : emptyValue}
                />
                <InfoTile
                  icon="solar:bill-list-bold-duotone"
                  label="PPN Pembayaran"
                  value={paymentContext?.ppn_amount ? formatRupiah(paymentContext.ppn_amount) : emptyValue}
                />
                <InfoTile
                  icon="solar:money-bag-bold-duotone"
                  label="Sisa Tagihan"
                  value={
                    paymentContext?.remaining_balance !== undefined && paymentContext?.remaining_balance !== null
                      ? formatRupiah(paymentContext.remaining_balance)
                      : emptyValue
                  }
                />
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.035)"
                          : "rgba(17,24,39,0.025)",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "stretch", sm: "center" }}
                      justifyContent="space-between"
                      spacing={1.25}
                    >
                      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            flex: "0 0 auto",
                            borderRadius: 1.5,
                            display: "grid",
                            placeItems: "center",
                            color: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                          }}
                        >
                          <Icon icon="solar:file-check-bold-duotone" fontSize={18} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.ui?.mutedText }}>
                            Bukti Transfer
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 700,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {paymentContext?.proof_file_path ? "Dokumen bukti pembayaran tersedia" : "Belum ada bukti pembayaran"}
                          </Typography>
                        </Box>
                      </Stack>

                      {paymentContext?.proof_file_path && (
                        <Button
                          variant="contained"
                          startIcon={<Icon icon="solar:eye-bold-duotone" />}
                          onClick={() =>
                            openDocumentPreview(
                              proofFileUrl,
                              "Preview Bukti Pembayaran",
                            )
                          }
                          sx={{
                            borderRadius: 2,
                            fontWeight: 700,
                            textTransform: "none",
                            boxShadow: "none",
                          }}
                        >
                          Lihat Bukti
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Grid>

                {paymentHistory.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        p: { xs: 1.4, sm: 1.75 },
                        borderRadius: 2,
                        border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.035)"
                            : "rgba(17,24,39,0.025)",
                      }}
                    >
                      <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.75 }}>
                        Riwayat Pembayaran Sebelumnya
                      </Typography>
                      {paymentHistory.map((payment, index) => {
                        const previousLabel =
                          Number(payment.payment_number) === 1
                            ? "Uang Muka (DP)"
                            : `Cicilan ${Number(payment.payment_number || index + 1) - 1}`;
                        const previousProofUrl = getUploadApiUrl(payment.proof_file_path);

                        return (
                          <Stack
                            key={payment.payment_id || `${payment.payment_number}-${index}`}
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={1}
                            sx={{
                              py: 0.9,
                              borderBottom: `1px dashed ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                                {previousLabel} - {formatDate(payment.payment_date)}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: theme.ui?.mutedText, fontWeight: 600 }}>
                                {payment.amount ? formatRupiah(payment.amount) : emptyValue}
                              </Typography>
                            </Box>
                            {payment.proof_file_path && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Icon icon="solar:eye-bold-duotone" />}
                                onClick={() =>
                                  openDocumentPreview(
                                    previousProofUrl,
                                    `Preview Bukti Pembayaran ${previousLabel}`,
                                  )
                                }
                                sx={{
                                  borderRadius: 1.5,
                                  fontWeight: 700,
                                  textTransform: "none",
                                }}
                              >
                                Lihat Bukti
                              </Button>
                            )}
                          </Stack>
                        );
                      })}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DetailSection>
          )}

          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            justifyContent="flex-end"
            spacing={1.25}
            sx={{ pt: 1 }}
          >
            <Button
              variant="contained"
              onClick={onClose}
              disabled={approving}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
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

            {showApproveButton && (
              <Button
                variant="contained"
                color="success"
                onClick={onApprove}
                disabled={approving}
                startIcon={approving ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  color: "#fff",
                  px: 3,
                }}
              >
                {approving ? "Mengirim..." : "Approve"}
              </Button>
            )}
          </Stack>
        </Stack>

        <ApprovalStatusOverlay data={selectedData} status={resolvedStatus} />
      </AppModal>

      <ImagePreviewModal
        open={previewImage.open}
        onClose={() =>
          setPreviewImage({ open: false, url: "", alt: "Preview" })
        }
        imageUrl={previewImage.url}
        alt={previewImage.alt}
      />
    </>
  );
}
