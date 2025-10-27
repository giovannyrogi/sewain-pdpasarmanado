"use client";

import {
  Box,
  Button,
  CircularProgress,
  Modal,
  Typography,
  useMediaQuery,
  Fade,
  Divider,
  Grid,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import ImagePreviewModal from "../../components/imagepreviewmodal/page";
import formatRupiah from "../../components/formatrupiah/page";
import moment from "moment";
import ApprovedOverlay from "./ApprovedOverlay";

const TenantApprovalModal = ({
  open,
  onClose,
  selectedData,
  loadingTrue,
  loadingFalse,
  onNotify,
  getDataApprovals = () => {},
  user,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  const [openPreview, setOpenPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // console.log("selectedData", selectedData);
  const theme = useTheme();

  const style = {
    width: isMobile ? "90vw" : 500,
    maxWidth: "98vw",
    bgcolor: "background.paper",
    color: "text.primary",
    borderRadius: "10px",
    boxShadow: 24,
    p: "18px 20px 18px 20px",
    maxHeight: "90vh",
    overflowY: "auto",
    transition: "box-shadow 0.3s",
    //hide scrollbar
    "&::-webkit-scrollbar": {
      display: "none",
    },
    position: "relative",
  };

  const handleCalculateTotal = () => {
    // Konversi nilai ke number
    const totalPayment = Number(selectedData?.total_payment || 0);
    const downPayment = Number(selectedData?.down_payment || 0);
    const installment1 = Number(selectedData?.estimated_installment_1 || 0);
    const installment2 = Number(selectedData?.estimated_installment_2 || 0);
    const installment3 = Number(selectedData?.estimated_installment_3 || 0);
    const remainingPayment = Number(selectedData?.remaining_payment || 0);

    const totalSewaKontrakRuangan =
      selectedData?.price_per_m2 * selectedData?.room_area;

    // Hitung Nilai Kontrak
    const nilaiKontrak = downPayment / 1.11;

    // Hitung PPN Down Payment
    const PPNDownPayment = nilaiKontrak * 0.11;

    // Hitung Total Uang Muka (DP)
    const totalDownPayment = nilaiKontrak + PPNDownPayment;

    // Hitung total PPN
    const totalPPN = totalSewaKontrakRuangan * 0.11;

    // Total cicilan semua + PPN
    const totalInstallment = installment1 + installment2 + installment3;

    return {
      totalPayment,
      totalSewaKontrakRuangan,
      PPNDownPayment,
      totalDownPayment,
      nilaiKontrak,
      totalPPN,
      downPayment,
      totalInstallment,
      remainingPayment,
    };
  };

  const {
    totalPayment,
    totalSewaKontrakRuangan,
    PPNDownPayment,
    totalDownPayment,
    nilaiKontrak,
    totalPPN,
    downPayment,
    totalInstallment,
    remainingPayment,
  } = handleCalculateTotal() || {
    totalPayment: 0,
    totalSewaKontrakRuangan: 0,
    PPNDownPayment: 0,
    totalDownPayment: 0,
    nilaiKontrak: 0,
    totalPPN: 0,
    downPayment: 0,
    totalInstallment: 0,
    remainingPayment: 0,
  };

  const handleSubmit = async () => {
    loadingTrue();
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `/api/tenant-approval/${selectedData?.id}`,
        {
          tenant_application_id: selectedData?.tenant_application_id,
          status: "approved",
          approver_id: user.id,
        }
      );
      console.log("response", response.data);

      if (response.data.success) {
        onNotify?.({
          open: true,
          message: response.data.message || "Berhasil Menyetujui Sewa Ruangan!",
          severity: "success",
        });
        getDataApprovals();
        setTimeout(() => {
          onClose();
          loadingFalse();
          setIsSubmitting(false);
        }, 1000);
      } else {
        onNotify?.({
          open: true,
          message: response.data.message || "Gagal Menyetujui Sewa Ruangan.",
          severity: "error",
        });
        loadingFalse();
        setIsSubmitting(false);
      }
    } catch (error) {
      console.log("error", error);
      onNotify?.({
        open: true,
        message:
          error.response.data.message ||
          "Terjadi error saat menyetujui sewa ruangan.",
        severity: "error",
      });
      loadingFalse();
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 0, // hilangkan padding default
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(30,30,30,0.25)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        },
      }}
    >
      <Fade in={open}>
        <Box sx={style}>
          {/* Detail Data Pemohon */}
          <Grid container spacing={1}>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
              }}
            >
              Detail Data Pemohon
            </Typography>
          </Grid>

          <Divider
            sx={{
              mb: 1,
              borderColor: theme.palette.primary.main,
            }}
          />

          <Grid container spacing={2}>
            <Grid container size={isMobile ? 12 : 6} spacing={2}>
              <Grid
                size={isMobile ? 6 : 12}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  Nama Penyewa
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word", // <-- biar kata panjang pecah
                    whiteSpace: "normal", // <-- biar bisa turun baris
                    overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  }}
                >
                  {selectedData?.tenant_name ? selectedData.tenant_name : "-"}
                </Typography>
              </Grid>

              <Grid
                size={isMobile ? 6 : 12}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  NIK
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word", // <-- biar kata panjang pecah
                    whiteSpace: "normal", // <-- biar bisa turun baris
                    overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  }}
                >
                  {selectedData?.tenant_nik ? selectedData.tenant_nik : "-"}
                </Typography>
              </Grid>

              <Grid
                size={isMobile ? 6 : 12}
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  Nomor Telepon
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word", // <-- biar kata panjang pecah
                    whiteSpace: "normal", // <-- biar bisa turun baris
                    overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  }}
                >
                  {selectedData?.tenant_phone ? selectedData.tenant_phone : "-"}
                </Typography>
              </Grid>
            </Grid>
            <Grid container size={isMobile ? 12 : 6} spacing={2}>
              <Grid size={12} sx={{ display: "flex", flexDirection: "column" }}>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: theme.palette.primary.main,
                  }}
                >
                  Foto KTP
                </Typography>

                {/* Container dengan tinggi tetap */}
                <Box
                  sx={{
                    width: "100%",
                    height: 150, // tinggi konsisten
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderRadius: 2,
                    // bgcolor: "#f8f8f8",
                  }}
                >
                  <img
                    src={
                      selectedData?.ktp_file_path
                        ? selectedData.ktp_file_path
                        : ""
                    }
                    alt="ktp"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain", // biar tetap proporsional
                    }}
                    onClick={() => setOpenPreview(true)}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "11px",
                      color: theme.palette.primary.main,
                    }}
                  >
                    Tekan gambar untuk memperbesar
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Detail Lokasi & Ruangan */}
          <Grid container spacing={2} mt={2}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
              }}
            >
              Detail Lokasi & Ruangan
            </Typography>
          </Grid>

          <Divider
            sx={{
              mb: 1,
              borderColor: theme.palette.primary.main,
            }}
          />

          <Grid container spacing={1}>
            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Nama Lokasi
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.location_name ? selectedData.location_name : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Lantai
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.floor ? selectedData.floor : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Ruangan
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.room_number
                  ? `No. ${selectedData.room_number}`
                  : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Panjang (m)
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.room_length ? selectedData.room_length : "-"} M
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Lebar (m)
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.room_width ? selectedData.room_width : "-"} M
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Luas (m²)
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.room_area ? selectedData.room_area + " M" : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Harga Ruangan (m)
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.price_per_m2
                  ? formatRupiah(selectedData.price_per_m2)
                  : "-"}
              </Typography>
            </Grid>

            <Grid size={6} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Tanggal Dibuat
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.created_at
                  ? moment(selectedData.created_at).format("YYYY/MM/DD")
                  : "-"}
              </Typography>
            </Grid>

            <Grid size={12} sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: theme.palette.primary.main,
                }}
              >
                Masa Berlaku
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.start_date && selectedData?.end_date
                  ? moment(selectedData.start_date).format("YYYY/MM/DD") +
                    " s/d " +
                    moment(selectedData.end_date).format("YYYY/MM/DD")
                  : "Pendaftaran Baru"}
              </Typography>
            </Grid>
          </Grid>

          {/* Rincian Pembayaran */}
          <Grid container spacing={2} mt={2}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: "bold",
                // color: theme.palette.primary.main,
              }}
            >
              Rincian Pembayaran
            </Typography>
          </Grid>

          <Divider
            sx={{
              mb: 0.5,
              borderColor: theme.palette.primary.main,
            }}
          />

          <Grid container spacing={0.2}>
            <Grid
              size={12}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                Tipe Pembayaran
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {selectedData?.payment_type === "cicilan" ? "Cicilan" : "Lunas"}
              </Typography>
            </Grid>

            <Grid
              size={12}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                Total Sewa Kontrak Ruangan
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {totalSewaKontrakRuangan
                  ? formatRupiah(totalSewaKontrakRuangan)
                  : "-"}
              </Typography>
            </Grid>

            <Grid
              size={12}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                Iuran Jasa Administrasi
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {/* {selectedData?.total_payment
                ? formatRupiah(selectedData.total_payment)
                : "-"} */}{" "}
                {formatRupiah(50000)}
              </Typography>
            </Grid>

            <Grid
              size={12}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                PPN 11%
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {totalPPN ? formatRupiah(totalPPN) : "-"}
              </Typography>
            </Grid>
          </Grid>

          <Divider
            sx={{
              mb: 0.5,
              mt: 0.5,
              borderColor: theme.palette.primary.main,
            }}
          />

          {/* Total Pembayaran */}
          <Grid container spacing={1}>
            <Grid
              size={12}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                Total Pembayaran
              </Typography>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "13px",
                  wordBreak: "break-word", // <-- biar kata panjang pecah
                  whiteSpace: "normal", // <-- biar bisa turun baris
                  overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                }}
              >
                {totalPayment ? formatRupiah(totalPayment) : "-"}
              </Typography>
            </Grid>
          </Grid>

          <Divider
            sx={{
              borderColor: theme.palette.primary.main,
              width: "100%",
              mb: 2,
              mt: 0.5,
            }}
          />

          {selectedData?.payment_type === "cicilan" && (
            <>
              <Grid size={12}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: "bold",
                    mb: isMobile ? 0.5 : undefined,
                  }}
                >
                  Pembayaran Pertama
                </Typography>
              </Grid>

              <Divider
                sx={{
                  mb: 0.5,
                  borderColor: theme.palette.primary.main,
                  width: "100%",
                }}
              />

              <Grid
                size={12}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  Uang Muka (DP)
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word", // <-- biar kata panjang pecah
                    whiteSpace: "normal", // <-- biar bisa turun baris
                    overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  }}
                >
                  {selectedData?.down_payment
                    ? formatRupiah(selectedData?.down_payment)
                    : "-"}
                </Typography>
              </Grid>

              <Grid
                size={12}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  Nilai Kontrak
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word", // <-- biar kata panjang pecah
                    whiteSpace: "normal", // <-- biar bisa turun baris
                    overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  }}
                >
                  {nilaiKontrak ? formatRupiah(nilaiKontrak) : "-"}
                </Typography>
              </Grid>

              <Grid
                size={12}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  PPN 11%
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word", // <-- biar kata panjang pecah
                    whiteSpace: "normal", // <-- biar bisa turun baris
                    overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  }}
                >
                  {PPNDownPayment ? formatRupiah(PPNDownPayment) : "-"}
                </Typography>
              </Grid>

              <Divider
                sx={{
                  borderColor: theme.palette.primary.main,
                  width: "100%",
                  mb: 0.5,
                  mt: 0.5,
                }}
              />

              <Grid
                size={12}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  Total Pembayaran
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word", // <-- biar kata panjang pecah
                    whiteSpace: "normal", // <-- biar bisa turun baris
                    overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  }}
                >
                  {downPayment ? formatRupiah(downPayment) : "-"}
                </Typography>
              </Grid>

              <Divider
                sx={{
                  borderColor: theme.palette.primary.main,
                  width: "100%",
                  mb: 0.5,
                  mt: 0.5,
                }}
              />

              <Grid
                size={12}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  Sisa Pembayaran
                </Typography>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    wordBreak: "break-word", // <-- biar kata panjang pecah
                    whiteSpace: "normal", // <-- biar bisa turun baris
                    overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                  }}
                >
                  {remainingPayment ? formatRupiah(remainingPayment) : "-"}
                </Typography>
              </Grid>

              {/* Rencana Cicilan */}
              <Grid container spacing={2} mt={2}>
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: "bold",
                    // color: theme.palette.primary.main,
                  }}
                >
                  Rencana Cicilan
                </Typography>
              </Grid>

              <Divider
                sx={{
                  mb: 0.5,
                  borderColor: theme.palette.primary.main,
                }}
              />

              <Grid container>
                <Grid
                  size={12}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    {`Cicilan 1 (${moment(
                      selectedData?.estimated_installment_1_date
                    ).format("MMM YYYY")})`}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      wordBreak: "break-word", // <-- biar kata panjang pecah
                      whiteSpace: "normal", // <-- biar bisa turun baris
                      overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                    }}
                  >
                    {selectedData?.estimated_installment_1
                      ? formatRupiah(selectedData.estimated_installment_1)
                      : "-"}
                  </Typography>
                </Grid>

                <Grid
                  size={12}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    {`Cicilan 2 (${moment(
                      selectedData?.estimated_installment_2_date
                    ).format("MMM YYYY")})`}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      wordBreak: "break-word", // <-- biar kata panjang pecah
                      whiteSpace: "normal", // <-- biar bisa turun baris
                      overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                    }}
                  >
                    {selectedData?.estimated_installment_2
                      ? formatRupiah(selectedData.estimated_installment_2)
                      : "-"}
                  </Typography>
                </Grid>

                <Grid
                  size={12}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    {`Cicilan 3 (${moment(
                      selectedData?.estimated_installment_3_date
                    ).format("MMM YYYY")})`}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      wordBreak: "break-word", // <-- biar kata panjang pecah
                      whiteSpace: "normal", // <-- biar bisa turun baris
                      overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                    }}
                  >
                    {selectedData?.estimated_installment_3
                      ? formatRupiah(selectedData.estimated_installment_3)
                      : "-"}
                  </Typography>
                </Grid>
              </Grid>

              <Divider
                sx={{
                  mb: 0.5,
                  borderColor: theme.palette.primary.main,
                }}
              />

              {/* Total Cicilan */}
              <Grid container spacing={1}>
                <Grid
                  size={12}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    Total Cicilan
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      wordBreak: "break-word", // <-- biar kata panjang pecah
                      whiteSpace: "normal", // <-- biar bisa turun baris
                      overflowWrap: "anywhere", // <-- tambahan supaya lebih fleksibel
                    }}
                  >
                    {totalInstallment ? formatRupiah(totalInstallment) : "-"}
                  </Typography>
                </Grid>
              </Grid>
            </>
          )}

          <Grid
            container
            spacing={1}
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Grid
              size={
                selectedData?.status === "approved" ||
                selectedData?.status === "rejected"
                  ? 12
                  : 6
              }
            >
              <Button
                type="submit"
                variant="contained"
                color="error"
                size="small"
                sx={{
                  fontWeight: "bold",
                  fontSize: 16,
                  textTransform: "none",
                  width:
                    selectedData?.status === "approved" ||
                    selectedData?.status === "rejected"
                      ? "100%"
                      : 150,
                }}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
            </Grid>
            <Grid size={6} sx={{ textAlign: "right" }}>
              {selectedData?.status === "approved" ||
              selectedData?.status === "rejected" ? (
                ""
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  sx={{
                    fontWeight: "bold",
                    fontSize: 16,
                    textTransform: "none",
                    width: 150,
                    color: "white",
                  }}
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting && (
                      <CircularProgress size={22} color="inherit" />
                    )
                  }
                  onClick={handleSubmit}
                >
                  {isSubmitting ? "Mengirim..." : "Approve"}
                </Button>
              )}
            </Grid>
          </Grid>

          {/* Modal Preview Gambar */}
          <ImagePreviewModal
            open={openPreview}
            onClose={() => setOpenPreview(false)}
            imageUrl={
              selectedData?.ktp_file_path ? selectedData.ktp_file_path : ""
            }
            alt="Preview KTP"
          />

          {selectedData?.status === "approved" ||
          selectedData?.status === "rejected" ? (
            <ApprovedOverlay selectedData={selectedData} />
          ) : (
            ""
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default TenantApprovalModal;
