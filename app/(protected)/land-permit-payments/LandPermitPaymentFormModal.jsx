"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Icon } from "@iconify/react";
import moment from "moment";
import CrudFormModal from "@/app/components/crud/CrudFormModal";
import ImagePreviewModal from "@/app/components/modals/ImagePreviewModal";
import LandPermitApplicantDetailModal from "@/app/(protected)/land-permit-applications/LandPermitApplicantDetailModal";
import formatRupiah from "@/app/components/formatrupiah/page";
import { getUploadApiUrl } from "@/app/utils/uploadPath";

const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = "image/jpeg,image/png,application/pdf";
const uploadActionTextSx = {
  display: { xs: "inline", sm: "none" },
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1,
};

const getUploadActionButtonSx = () => ({
  width: { xs: "100%", sm: 40 },
  minWidth: { xs: "100%", sm: 40 },
  height: 40,
  px: { xs: 2, sm: 0 },
  borderRadius: 2,
  fontWeight: 700,
  textTransform: "none",
  boxShadow: "none",
  "& .MuiButton-startIcon": {
    ml: 0,
    mr: { xs: 1, sm: 0 },
  },
});

const getApplicationLabel = (item) =>
  [
    item?.tenant_name,
    item?.location_name,
    item?.sector_name,
    item?.stall_number ? `Lahan ${item.stall_number}` : null,
  ]
    .filter(Boolean)
    .join(" - ");

function ProofUploadCard({
  fileName,
  previewUrl,
  disabled,
  onChoose,
  onPreview,
  onClear,
}) {
  const theme = useTheme();
  const inputRef = useRef(null);
  const hasFile = Boolean(fileName || previewUrl);

  const openPicker = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 1.75 },
        borderRadius: 2,
        border: `1px solid ${theme.ui.dashboardCardBorder}`,
        bgcolor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.035)"
            : "rgba(17,24,39,0.025)",
      }}
    >
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        onChange={(event) => onChoose(event.target.files?.[0] || null)}
      />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 1.75,
              display: "grid",
              placeItems: "center",
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
            }}
          >
            <Icon icon="solar:gallery-send-bold-duotone" fontSize={22} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              Bukti Pembayaran
            </Typography>
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontSize: 11.5,
                fontWeight: 600,
                overflowWrap: "anywhere",
              }}
            >
              {fileName || (hasFile ? "Bukti pembayaran tersimpan" : "JPG, PNG, atau PDF. Maksimal 5MB.")}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={0.75}
          justifyContent="flex-end"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {hasFile && (
            <Button
              size="small"
              variant="outlined"
              color="info"
              onClick={onPreview}
              disabled={disabled}
              startIcon={<Icon icon="solar:eye-bold-duotone" />}
              title="Lihat bukti pembayaran"
              sx={{
                ...getUploadActionButtonSx(),
                color: theme.palette.info.main,
                borderColor: alpha(theme.palette.info.main, 0.55),
                borderColor: `${theme.palette.info.main}88`,
                bgcolor: "rgba(33,150,243,0.08)",
                "&:hover": {
                  borderColor: theme.palette.info.main,
                  bgcolor: "rgba(33,150,243,0.14)",
                },
              }}
            >
              <Box component="span" sx={uploadActionTextSx}>
                Lihat Bukti
              </Box>
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={openPicker}
            disabled={disabled}
            startIcon={<Icon icon="solar:upload-bold-duotone" />}
            title={hasFile ? "Ganti bukti pembayaran" : "Pilih bukti pembayaran"}
            sx={getUploadActionButtonSx()}
          >
            <Box component="span" sx={uploadActionTextSx}>
              {hasFile ? "Ganti Bukti" : "Pilih File"}
            </Box>
          </Button>
          {hasFile && (
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={onClear}
              disabled={disabled}
              startIcon={<Icon icon="solar:trash-bin-trash-bold-duotone" />}
              title="Hapus bukti pembayaran"
              sx={{
                ...getUploadActionButtonSx(),
                color: theme.palette.error.main,
                borderColor: alpha(theme.palette.error.main, 0.55),
                bgcolor: alpha(theme.palette.error.main, 0.08),
                "&:hover": {
                  borderColor: theme.palette.error.main,
                  bgcolor: alpha(theme.palette.error.main, 0.14),
                },
              }}
            >
              <Box component="span" sx={uploadActionTextSx}>
                Hapus
              </Box>
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default function LandPermitPaymentFormModal({
  open,
  mode = "create",
  selectedPayment,
  applications = [],
  loading = false,
  onClose,
  onSubmit,
  onNotify,
}) {
  const theme = useTheme();
  const isEdit = mode === "edit";
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [paymentDate, setPaymentDate] = useState(moment());
  const [proofFile, setProofFile] = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  console.log("selectedPayment:", selectedPayment);
  console.log("applications:", applications);

  const applicationOptions = useMemo(
    () =>
      isEdit && selectedPayment
        ? [selectedPayment]
        : applications,
    [applications, isEdit, selectedPayment],
  );

  useEffect(() => {
    if (!open) return;

    if (isEdit && selectedPayment) {
      setSelectedApplication(selectedPayment);
      setPaymentDate(
        selectedPayment.payment_date
          ? moment(selectedPayment.payment_date, "YYYY-MM-DD")
          : moment(),
      );
      setProofPreviewUrl(
        getUploadApiUrl(selectedPayment.proof_file_path),
      );
      setProofFile(null);
      return;
    }

    setSelectedApplication(null);
    setPaymentDate(moment());
    setProofFile(null);
    setProofPreviewUrl("");
  }, [isEdit, open, selectedPayment]);

  useEffect(
    () => () => {
      if (proofPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(proofPreviewUrl);
      }
    },
    [proofPreviewUrl],
  );

  const resetProof = () => {
    if (proofPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(proofPreviewUrl);
    }
    setProofFile(null);
    setProofPreviewUrl("");
  };

  const handleFileChange = (file) => {
    if (!file) return;
    if (file.size > MAX_PROOF_FILE_SIZE) {
      onNotify?.({
        open: true,
        severity: "error",
        message: "Ukuran file bukti pembayaran maksimal 5MB.",
      });
      return;
    }

    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      onNotify?.({
        open: true,
        severity: "error",
        message: "Format bukti pembayaran harus JPG, PNG, atau PDF.",
      });
      return;
    }

    if (proofPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(proofPreviewUrl);
    }
    setProofFile(file);
    setProofPreviewUrl(URL.createObjectURL(file));
  };

  const handlePreview = () => {
    if (!proofPreviewUrl) return;
    const isPdf =
      proofFile?.type === "application/pdf" ||
      proofPreviewUrl.toLowerCase().includes(".pdf");
    if (isPdf) {
      window.open(proofPreviewUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setPreviewOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedApplication?.land_permit_application_id) {
      onNotify?.({
        open: true,
        severity: "error",
        message: "Silakan pilih pemohon izin lahan.",
      });
      return;
    }
    if (!paymentDate || !moment(paymentDate).isValid()) {
      onNotify?.({
        open: true,
        severity: "error",
        message: "Silakan pilih tanggal pembayaran.",
      });
      return;
    }
    if (!proofFile && !proofPreviewUrl) {
      onNotify?.({
        open: true,
        severity: "error",
        message: "Silakan upload bukti pembayaran.",
      });
      return;
    }

    const formData = new FormData();
    formData.append(
      "land_permit_application_id",
      selectedApplication.land_permit_application_id,
    );
    formData.append(
      "payment_date",
      moment(paymentDate).format("YYYY-MM-DD"),
    );
    if (proofFile) {
      formData.append("proof_file", proofFile);
    }

    onSubmit?.(formData);
  };

  return (
    <>
      <CrudFormModal
        open={open}
        title={
          isEdit
            ? "Ubah Bukti Pembayaran Izin Lahan"
            : "Tambah Pembayaran Izin Lahan"
        }
        description="Pilih permohonan yang sudah disetujui, tanggal pembayaran, dan unggah bukti transfer."
        icon="solar:wallet-money-bold-duotone"
        submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Pembayaran"}
        loadingLabel={
          isEdit
            ? "Memperbarui pembayaran izin lahan..."
            : "Menyimpan pembayaran izin lahan..."
        }
        loading={loading}
        width={760}
        onClose={onClose}
        onSubmit={handleSubmit}
      >
        <Grid container spacing={{ xs: 2.75, sm: 2.5 }}>
          <Grid size={12}>
            <Autocomplete
              options={applicationOptions}
              value={selectedApplication}
              getOptionLabel={getApplicationLabel}
              isOptionEqualToValue={(option, value) =>
                Number(option.land_permit_application_id) ===
                Number(value.land_permit_application_id)
              }
              onChange={(_event, value) => setSelectedApplication(value)}
              disabled={loading || isEdit}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pilih Pemohon Izin Lahan *"
                  required
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.land_permit_application_id}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                      {option.tenant_name}
                    </Typography>
                    <Typography
                      sx={{
                        color: theme.ui.mutedText,
                        fontSize: 11.5,
                        fontWeight: 600,
                      }}
                    >
                      {option.location_name} - {option.sector_name} - Lahan{" "}
                      {option.stall_number}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          </Grid>

          <Grid size={12}>
            <DatePicker
              label="Tanggal Pembayaran *"
              value={paymentDate}
              onChange={setPaymentDate}
              maxDate={moment()}
              disabled={loading}
              slotProps={{
                textField: { fullWidth: true, required: true },
              }}
            />
          </Grid>

          <Grid size={12}>
            <ProofUploadCard
              fileName={proofFile?.name}
              previewUrl={proofPreviewUrl}
              disabled={loading}
              onChoose={handleFileChange}
              onPreview={handlePreview}
              onClear={resetProof}
            />
          </Grid>

          {selectedApplication && (
            <Grid size={12}>
              <Box
                sx={{
                  p: { xs: 1.5, sm: 1.75 },
                  borderRadius: 2,
                  border: `1px solid ${theme.ui.dashboardCardBorder}`,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.035)"
                      : "rgba(17,24,39,0.025)",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1.5}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: theme.ui.mutedText,
                        fontSize: 11.5,
                        fontWeight: 700,
                      }}
                    >
                      Total Pembayaran Izin Lahan
                    </Typography>
                    <Typography
                      sx={{ fontSize: { xs: 18, sm: 20 }, fontWeight: 700 }}
                    >
                      {formatRupiah(selectedApplication.total_payment)}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => setDetailOpen(true)}
                    sx={{
                      flex: "0 0 auto",
                      minHeight: 32,
                      borderRadius: 1.5,
                      px: { xs: 1.15, sm: 1.35 },
                      fontWeight: 700,
                      textTransform: "none",
                    }}
                  >
                    Lihat Rincian
                  </Button>
                </Stack>
              </Box>
            </Grid>
          )}
        </Grid>
      </CrudFormModal>

      <LandPermitApplicantDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        selectedData={selectedApplication}
      />
      <ImagePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={proofPreviewUrl}
        alt="Preview bukti pembayaran izin lahan"
      />
    </>
  );
}
