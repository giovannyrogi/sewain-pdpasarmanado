"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Icon } from "@iconify/react";
import axios from "axios";
import moment from "moment";
import CrudFormModal from "@/app/components/crud/CrudFormModal";
import ImagePreviewModal from "@/app/components/modals/ImagePreviewModal";
import TenantLeaseDetailModal from "@/app/components/modals/TenantLeaseDetailModal";
import formatRupiah from "@/app/components/formatrupiah/page";
import { calculateContractAndPPN } from "@/app/components/calc-contract-and-ppn/CaclContractAndPPN";
import { normalizePaymentForLeaseDetail } from "./paymentDetailMapper";

const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024;

const toMoneyDigits = (value) => String(value || "").replace(/\D/g, "");

const getTenantLabel = (item) =>
  [item?.tenant_name, item?.location_name, item?.room_number]
    .filter(Boolean)
    .join(" - ");

const getNextInstallmentInfo = (tenant) => {
  if (!tenant) {
    return { paymentNumber: "", amount: "", remainingBalance: 0 };
  }

  if (tenant.payment_type === "lunas") {
    return {
      paymentNumber: 1,
      amount: Number(tenant.total_payment || 0),
      remainingBalance: Number(tenant.total_payment || 0),
    };
  }

  if (tenant.payment_number === undefined || tenant.payment_number === null) {
    return {
      paymentNumber: 1,
      amount: Number(tenant.down_payment || 0),
      remainingBalance: Number(tenant.total_payment || 0),
    };
  }

  const nextPaymentNumber = Math.min(Number(tenant.payment_number || 0) + 1, 4);
  return {
    paymentNumber: nextPaymentNumber,
    amount: Number(tenant.remaining_balance || 0),
    remainingBalance: Number(tenant.remaining_balance || 0),
  };
};

const getEditablePaymentInfo = (record) => {
  const tenant = record?.tenant_application || {};
  const payment = record?.payments || {};
  const previousPayments = payment.previous_payments || [];
  const currentAmount = Number(payment.payment_amount || 0);
  const previousPaidTotal = previousPayments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const availableBalance = Number(tenant.total_payment || 0) - previousPaidTotal;

  return {
    paymentNumber: Number(payment.payment_number || 1),
    amount: currentAmount,
    remainingBalance:
      tenant.payment_type === "lunas"
        ? Number(tenant.total_payment || 0)
        : Math.max(availableBalance, currentAmount),
  };
};

function PaymentProofUploadCard({
  proofFilePath,
  disabled,
  onPreview,
  onUpload,
  onClear,
}) {
  const theme = useTheme();
  const hasProof = Boolean(proofFilePath);

  return (
    <Box
      sx={{
        p: 1.35,
        borderRadius: 2,
        border: `1px solid ${theme.ui.dashboardCardBorder}`,
        bgcolor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.035)"
            : "rgba(17,24,39,0.025)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.2}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.15} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
            }}
          >
            <Icon icon="solar:file-check-bold-duotone" fontSize={22} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
              Bukti Pembayaran
            </Typography>
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontWeight: 600,
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              {hasProof
                ? "Dokumen bukti pembayaran sudah dipilih. JPG/PNG/PDF, maksimal 5MB."
                : "Unggah bukti pembayaran. JPG/PNG/PDF, maksimal 5MB."}
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {hasProof && (
            <Button
              variant="contained"
              color="inherit"
              startIcon={<Icon icon="solar:eye-bold-duotone" />}
              onClick={onPreview}
              disabled={disabled}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
            >
              Lihat Bukti
            </Button>
          )}
          <Button
            variant="contained"
            component="label"
            startIcon={<Icon icon="solar:upload-bold-duotone" />}
            disabled={disabled}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
          >
            {hasProof ? "Ganti Bukti" : "Upload Bukti"}
            <input type="file" accept="image/*,.pdf" hidden onChange={onUpload} />
          </Button>
          {hasProof && (
            <Button
              variant="contained"
              color="error"
              startIcon={<Icon icon="solar:trash-bin-trash-bold-duotone" />}
              onClick={onClear}
              disabled={disabled}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
            >
              Hapus
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

/**
 * Form create/edit bukti pembayaran yang memakai CrudFormModal reusable.
 * Semua rumus lama tetap dipakai, sementara UI dan validasi file dibuat seragam
 * dengan halaman yang sudah direfactor.
 */
export default function PaymentFormModal({
  open,
  mode = "create",
  selectedCurrentData,
  user,
  getDataPayments,
  onNotify,
  loadingTrue,
  loadingFalse,
  onClose,
}) {
  const theme = useTheme();
  const isEdit = mode === "edit";
  const [tenantOptions, setTenantOptions] = useState([]);
  const [selectedTenantApplicationId, setSelectedTenantApplicationId] =
    useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [proofFilePath, setProofFilePath] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [openTenantDetail, setOpenTenantDetail] = useState(false);
  const [typePembayaran, setTypePembayaran] = useState("lunas");
  const [paymentDate, setPaymentDate] = useState(null);
  const [minPayment, setMinPayment] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTenantOptions, setLoadingTenantOptions] = useState(false);

  const detailData = useMemo(
    () =>
      isEdit
        ? normalizePaymentForLeaseDetail(selectedData)
        : selectedData,
    [isEdit, selectedData],
  );

  const selectedPaymentType = isEdit
    ? selectedData?.tenant_application?.payment_type
    : selectedData?.payment_type;
  const selectedTotalPaymentRoom = isEdit
    ? selectedData?.tenant_application?.total_payment_room
    : selectedData?.total_payment_room;
  const selectedTenantName = isEdit
    ? selectedData?.tenant_application?.tenant_name
    : selectedData?.tenant_name;
  const selectedDownPayment = isEdit
    ? selectedData?.tenant_application?.down_payment
    : selectedData?.down_payment;
  const paymentId = selectedCurrentData?.payments?.payment_id;
  const paymentApprovalId = selectedCurrentData?.payment_approval?.id;

  const closeAndReset = () => {
    if (submitting) return;
    onClose?.();
  };

  const clearForm = () => {
    setSelectedTenantApplicationId(null);
    setSelectedData(null);
    setPaymentNumber("");
    setAmount("");
    setProofFilePath(null);
    setProofFile(null);
    setTypePembayaran("lunas");
    setPaymentDate(null);
    setMinPayment(0);
    setRemainingBalance(0);
  };

  const loadTenantPaymentOptions = async () => {
    setLoadingTenantOptions(true);
    loadingTrue?.();

    try {
      const response = await axios.get("/api/tenant-application/tenant-payment");
      setTenantOptions(response.data?.success ? response.data.data || [] : []);
    } catch (error) {
      console.error("Error fetch tenant payment options:", error);
      onNotify?.({
        open: true,
        message: "Gagal mengambil daftar penyewa untuk pembayaran.",
        severity: "error",
      });
    } finally {
      setLoadingTenantOptions(false);
      loadingFalse?.();
    }
  };

  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      clearForm();
      loadTenantPaymentOptions();
      return;
    }

    const paymentInfo = getEditablePaymentInfo(selectedCurrentData);
    setSelectedData(selectedCurrentData);
    setPaymentNumber(paymentInfo.paymentNumber);
    setAmount(paymentInfo.amount);
    setRemainingBalance(paymentInfo.remainingBalance);
    setTypePembayaran(
      selectedCurrentData?.tenant_application?.payment_type || "lunas",
    );
    setPaymentDate(
      selectedCurrentData?.payments?.payment_date
        ? moment(selectedCurrentData.payments.payment_date, "YYYY-MM-DD")
        : null,
    );
    setProofFilePath(
      selectedCurrentData?.payments?.proof_file_path
        ? `/api${selectedCurrentData.payments.proof_file_path}`
        : null,
    );
    setProofFile(selectedCurrentData?.payments?.proof_file_path || null);
  }, [isEdit, open, selectedCurrentData]);

  useEffect(() => {
    const numericRemainingBalance = Number(remainingBalance || 0);
    setMinPayment(
      Number(paymentNumber) > 3
        ? numericRemainingBalance
        : numericRemainingBalance * 0.2,
    );
  }, [paymentNumber, remainingBalance, amount]);

  const handleTenantChange = (tenant) => {
    const paymentInfo = getNextInstallmentInfo(tenant);

    setSelectedTenantApplicationId(tenant?.tenant_application_id || null);
    setSelectedData(tenant || null);
    setTypePembayaran(tenant?.payment_type || "lunas");
    setPaymentNumber(paymentInfo.paymentNumber);
    setAmount(paymentInfo.amount);
    setRemainingBalance(paymentInfo.remainingBalance);
  };

  const handleProofChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PROOF_FILE_SIZE) {
      onNotify?.({
        open: true,
        message: "Ukuran file bukti pembayaran maksimal 5MB.",
        severity: "error",
      });
      event.target.value = "";
      return;
    }

    setProofFile(file);
    setProofFilePath(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const numericAmount = Number(amount || 0);
    const numericRemainingBalance = Number(remainingBalance || 0);
    const numericPaymentNumber = Number(paymentNumber || 1);
    const dp = Number(selectedDownPayment || 0);

    if (!selectedData || (!isEdit && !selectedTenantApplicationId)) {
      onNotify?.({
        open: true,
        message: "Pilih data penyewa terlebih dahulu.",
        severity: "error",
      });
      return;
    }

    if (!paymentDate) {
      onNotify?.({
        open: true,
        message: "Tanggal pembayaran wajib diisi.",
        severity: "error",
      });
      return;
    }

    if (numericAmount < dp && numericPaymentNumber === 1) {
      onNotify?.({
        open: true,
        message: `Total pembayaran tidak boleh di bawah Uang Muka (DP), yaitu sebesar ${formatRupiah(dp)}.`,
        severity: "error",
      });
      return;
    }

    if (selectedPaymentType === "cicilan" && numericAmount < minPayment) {
      onNotify?.({
        open: true,
        message: `Total pembayaran minimal ${formatRupiah(minPayment)} (20%) dari sisa tagihan ${formatRupiah(numericRemainingBalance)}.`,
        severity: "error",
      });
      return;
    }

    if (typePembayaran === "cicilan" && numericAmount > numericRemainingBalance) {
      onNotify?.({
        open: true,
        message: `Total pembayaran tidak boleh melebihi sisa tagihan ${formatRupiah(numericRemainingBalance)}.`,
        severity: "error",
      });
      return;
    }

    if (!proofFile) {
      onNotify?.({
        open: true,
        message: "Silakan upload bukti pembayaran terlebih dahulu.",
        severity: "error",
      });
      return;
    }

    const { contractAmount, ppnAmount, total } = calculateContractAndPPN(
      selectedPaymentType,
      numericAmount,
      selectedTotalPaymentRoom,
    );
    const remainingBalanceAfterInstallment =
      selectedPaymentType === "cicilan" ? numericRemainingBalance - total : 0;
    const formData = new FormData();

    formData.append("contract_amount", contractAmount);
    if (isEdit) {
      formData.append("payment_approval_id", paymentApprovalId);
    } else {
      formData.append("tenant_application_id", selectedTenantApplicationId);
    }
    formData.append("proof_file", proofFile);
    formData.append("type_pembayaran", typePembayaran);
    formData.append("payment_date", moment(paymentDate).format("YYYY-MM-DD"));
    formData.append("tenant_name", selectedTenantName || "");
    formData.append("uploaded_by", user?.id || "");
    formData.append("payment_number", numericPaymentNumber);
    formData.append("ppn_amount", ppnAmount);
    formData.append("amount", numericAmount);
    formData.append("remaining_balance", remainingBalanceAfterInstallment);
    formData.append("payment_type", typePembayaran);

    setSubmitting(true);
    loadingTrue?.();

    try {
      const response = isEdit
        ? await axios.put(`/api/payments/${paymentId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await axios.post("/api/payments", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      if (response.data?.success) {
        onNotify?.({
          open: true,
          message:
            response.data.message ||
            `Bukti pembayaran berhasil ${isEdit ? "diperbarui" : "ditambahkan"}.`,
          severity: "success",
        });
        await getDataPayments?.();
        onClose?.();
        clearForm();
        return;
      }

      onNotify?.({
        open: true,
        message:
          response.data?.message ||
          `Gagal ${isEdit ? "memperbarui" : "menambahkan"} bukti pembayaran.`,
        severity: "error",
      });
    } catch (error) {
      console.error("Error save payment:", error);
      onNotify?.({
        open: true,
        message:
          error?.response?.data?.message ||
          `Terjadi kesalahan saat ${isEdit ? "memperbarui" : "menambahkan"} bukti pembayaran.`,
        severity: "error",
      });
    } finally {
      setTimeout(() => {
        setSubmitting(false);
        loadingFalse?.();
      }, 500);
    }
  };

  return (
    <>
      <CrudFormModal
        open={open}
        title={isEdit ? "Ubah Bukti Pembayaran" : "Upload Bukti Pembayaran"}
        description="Kelola tahap pembayaran, tanggal bayar, nominal, dan dokumen bukti transfer tenant."
        icon="solar:wallet-money-bold-duotone"
        submitLabel={isEdit ? "Simpan Perubahan" : "Submit Data"}
        loadingLabel={isEdit ? "Menyimpan pembayaran..." : "Mengupload pembayaran..."}
        loading={submitting || loadingTenantOptions}
        width={760}
        onClose={closeAndReset}
        onSubmit={handleSubmit}
      >
        <Grid container spacing={{ xs: 2.75, sm: 2.25 }}>
          <Grid size={12}>
            {isEdit ? (
              <TextField
                label="Penyewa"
                value={
                  [
                    selectedCurrentData?.tenant_application?.tenant_name,
                    selectedCurrentData?.location?.location_name,
                    selectedCurrentData?.room?.room_number,
                  ]
                    .filter(Boolean)
                    .join(" - ") || ""
                }
                disabled
                fullWidth
              />
            ) : (
              <Autocomplete
                options={tenantOptions}
                getOptionLabel={getTenantLabel}
                value={
                  tenantOptions.find(
                    (item) =>
                      item.tenant_application_id === selectedTenantApplicationId,
                  ) || null
                }
                onChange={(_, value) => handleTenantChange(value)}
                loading={loadingTenantOptions}
                disabled={submitting || loadingTenantOptions}
                isOptionEqualToValue={(option, value) =>
                  option.tenant_application_id === value.tenant_application_id
                }
                renderInput={(params) => (
                  <TextField {...params} label="Pilih Penyewa *" required />
                )}
              />
            )}
          </Grid>

          {selectedData && (
            <Grid size={12} sx={{ mt: { xs: -1.2, sm: -1 } }}>
              <Button
                size="small"
                startIcon={<Icon icon="solar:eye-bold-duotone" />}
                onClick={() => setOpenTenantDetail(true)}
                sx={{
                  px: 0,
                  minWidth: 0,
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                Lihat Detail Pemohon
              </Button>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel id="payment-type-label">Tipe Pembayaran</InputLabel>
              <Select
                labelId="payment-type-label"
                label="Tipe Pembayaran"
                value={typePembayaran}
                disabled
              >
                <MenuItem value="lunas">Lunas</MenuItem>
                <MenuItem value="cicilan">Cicilan</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {typePembayaran === "cicilan" && (
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel id="payment-number-label">Tahap Cicilan</InputLabel>
                <Select
                  labelId="payment-number-label"
                  label="Tahap Cicilan"
                  value={paymentNumber}
                  disabled
                >
                  <MenuItem value={1}>Uang Muka (DP)</MenuItem>
                  <MenuItem value={2}>Cicilan 1</MenuItem>
                  <MenuItem value={3}>Cicilan 2</MenuItem>
                  <MenuItem value={4}>Cicilan 3</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: typePembayaran === "cicilan" ? 6 : 12 }}>
            <DatePicker
              label="Tanggal Pembayaran *"
              value={paymentDate}
              onChange={(newValue) => setPaymentDate(newValue)}
              maxDate={moment()}
              disabled={submitting}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: typePembayaran === "cicilan" ? 6 : 12 }}>
            <TextField
              label="Total Pembayaran *"
              value={amount ? formatRupiah(amount) : ""}
              onChange={(event) => setAmount(toMoneyDigits(event.target.value))}
              disabled={
                submitting ||
                Number(paymentNumber) >= 4 ||
                selectedPaymentType === "lunas"
              }
              fullWidth
              required
            />
          </Grid>

          {selectedData && selectedPaymentType === "cicilan" && (
            <Grid size={12}>
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
                }}
              >
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.6 }}>
                  {Number(paymentNumber) === 1
                    ? `Pembayaran uang muka sesuai persetujuan awal sebesar ${formatRupiah(selectedDownPayment)} dari total tagihan ${formatRupiah(selectedData?.total_payment || selectedData?.tenant_application?.total_payment)}.`
                    : Number(paymentNumber) >= 4
                      ? `Pembayaran cicilan terakhir sebesar ${formatRupiah(minPayment)}.`
                      : `Minimal pembayaran ${formatRupiah(minPayment)} (20%) dari sisa tagihan ${formatRupiah(remainingBalance)}.`}
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid size={12}>
            <PaymentProofUploadCard
              proofFilePath={proofFilePath}
              disabled={submitting}
              onPreview={() => {
                if (!proofFilePath) return;
                const isPdfProof =
                  proofFile?.type === "application/pdf" ||
                  String(proofFilePath).toLowerCase().includes(".pdf");
                if (isPdfProof) {
                  window.open(proofFilePath, "_blank", "noopener,noreferrer");
                  return;
                }
                setOpenPreview(true);
              }}
              onUpload={handleProofChange}
              onClear={() => {
                setProofFilePath(null);
                setProofFile(null);
              }}
            />
          </Grid>
        </Grid>
      </CrudFormModal>

      <TenantLeaseDetailModal
        open={openTenantDetail}
        onClose={() => setOpenTenantDetail(false)}
        selectedData={detailData}
      />
      <ImagePreviewModal
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        imageUrl={proofFilePath}
        alt="preview-bukti-pembayaran"
      />
    </>
  );
}
